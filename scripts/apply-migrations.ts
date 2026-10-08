/**
 * SkillSetu — Database Migration Runner
 *
 * Connects to Supabase Postgres via the connection pooler (IPv4, port 6543)
 * and runs all SQL migration + seed files in order.
 *
 * Usage:
 *   bun run db:apply                # apply all files
 *   bun run db:apply --check        # check connection + list pending files
 *
 * The pooler URL is built from env vars or defaults to the Supabase pooler
 * for project nuzxwzacqiwjkrmyttic (transaction mode, port 6543, IPv4).
 *
 * Why the pooler? The sandbox blocks raw TCP to port 5432 (IPv6-only direct
 * host), but the pooler is IPv4 on port 6543 and works over the public
 * internet. Prisma's `db:push` cannot use the transaction-mode pooler, so
 * we run DDL directly with the `pg` library instead.
 */
import { Client } from 'pg'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const DB_ROOT = resolve(process.cwd(), 'db')

// Load .env file (Bun doesn't auto-load for standalone scripts).
// .env values take precedence over inherited shell env vars.
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) {
      process.env[m[1]] = m[2]
    }
  }
} catch {
  // .env not found — rely on real env vars
}

function getConnectionConfig() {
  // Parse password from DATABASE_URL env var, or fall back to SUPABASE_DB_PASS.
  // Never hard-code the password in source.
  const dbUrl = process.env.DATABASE_URL ?? ''
  let password = process.env.SUPABASE_DB_PASS ?? ''
  if (!password && dbUrl) {
    try {
      const match = dbUrl.match(/:([^:@]+)@/)
      if (match) password = decodeURIComponent(match[1])
    } catch {
      // ignore parse errors
    }
  }
  if (!password) {
    throw new Error(
      'Database password not found. Set DATABASE_URL or SUPABASE_DB_PASS in .env',
    )
  }

  const projectRef = 'nuzxwzacqiwjkrmyttic'
  const host = process.env.SUPABASE_DB_HOST ?? 'aws-0-ap-south-1.pooler.supabase.com'
  const port = parseInt(process.env.SUPABASE_DB_PORT ?? '6543', 10)
  const user = process.env.SUPABASE_DB_USER ?? `postgres.${projectRef}`
  const database = 'postgres'

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 120000,
  }
}

interface SqlFile {
  path: string
  label: string
}

function listSqlFiles(): SqlFile[] {
  const files: SqlFile[] = []
  const migDir = join(DB_ROOT, 'migrations')
  const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  for (const f of migrations) {
    files.push({ path: join(migDir, f), label: `migrations/${f}` })
  }
  const seedDir = join(DB_ROOT, 'seeds')
  try {
    const seeds = readdirSync(seedDir).filter((f) => f.endsWith('.sql')).sort()
    for (const f of seeds) {
      files.push({ path: join(seedDir, f), label: `seeds/${f}` })
    }
  } catch {
    // no seeds dir
  }
  return files
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  const config = getConnectionConfig()
  const client = new Client(config)

  console.log(`\n📦 SkillSetu DB Migration Runner`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   DB:   ${config.database}\n`)

  const files = listSqlFiles()
  console.log(`Found ${files.length} SQL file(s) to apply:`)
  for (const f of files) {
    const size = statSync(f.path).size
    console.log(`   • ${f.label}  (${size} bytes)`)
  }
  console.log()

  if (checkOnly) {
    console.log('--check mode: connecting to verify reachability only...')
    try {
      await client.connect()
      const { rows } = await client.query('SELECT current_database() as db, now() as time')
      console.log('✅ Connection OK:', rows[0])
      await client.end()
      process.exit(0)
    } catch (err) {
      console.error('❌ Connection failed:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }

  try {
    await client.connect()
    console.log('✅ Connected to Supabase Postgres\n')

    for (const file of files) {
      const sql = readFileSync(file.path, 'utf-8')
      process.stdout.write(`▶ Applying ${file.label}... `)
      try {
        await client.query(sql)
        console.log('OK')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('already exists') || msg.includes('duplicate key')) {
          console.log('SKIPPED (already exists)')
        } else {
          console.log('FAILED')
          console.error(`   ${msg.split('\n')[0]}`)
          throw err
        }
      }
    }

    console.log('\n🔍 Verification:')
    const { rows: tableCount } = await client.query(
      `SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`,
    )
    console.log(`   Public tables: ${tableCount[0].count}`)

    const { rows: courseCount } = await client
      .query(`SELECT count(*) as count FROM courses`)
      .catch(() => [{ count: 0 }])
    console.log(`   Courses: ${courseCount[0].count}`)

    const { rows: questionCount } = await client
      .query(`SELECT count(*) as count FROM questions`)
      .catch(() => [{ count: 0 }])
    console.log(`   Questions: ${questionCount[0].count}`)

    const { rows: roleCount } = await client
      .query(`SELECT count(*) as count FROM roles`)
      .catch(() => [{ count: 0 }])
    console.log(`   Roles: ${roleCount[0].count}`)

    console.log('\n✅ All migrations and seeds applied successfully.\n')
  } catch (err) {
    console.error('\n❌ Migration failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
