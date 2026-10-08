/**
 * SkillSetu — Database Reset
 *
 * Drops all tables, enums, functions and triggers in the public schema.
 * Use before re-applying migrations from a clean state.
 *
 * Usage: bun run db:reset:hard
 */
import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file (.env takes precedence over inherited shell env vars)
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  }
} catch {
  // .env not found
}

function parsePassword() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  let password = process.env.SUPABASE_DB_PASS ?? ''
  if (!password && dbUrl) {
    const match = dbUrl.match(/:([^:@]+)@/)
    if (match) password = decodeURIComponent(match[1])
  }
  if (!password) {
    throw new Error('Set DATABASE_URL or SUPABASE_DB_PASS in .env')
  }
  return password
}

const client = new Client({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.nuzxwzacqiwjkrmyttic',
  password: parsePassword(),
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  query_timeout: 60000,
})

async function main() {
  await client.connect()
  console.log('⚠️  Dropping all public schema objects...')

  // Drop all triggers first
  await client.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace))
      LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s;', r.tgname, r.tgrelid::regclass);
      END LOOP;
    END;
    $$;
  `)
  console.log('   ✓ Triggers dropped')

  // Drop all tables (cascades to constraints)
  await client.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
      LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', r.tablename);
      END LOOP;
    END;
    $$;
  `)
  console.log('   ✓ Tables dropped')

  // Drop all enums
  await client.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e')
      LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE;', r.typname);
      END LOOP;
    END;
    $$;
  `)
  console.log('   ✓ Enums dropped')

  // Drop all functions (except ones owned by extensions)
  await client.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT proname, oid::regprocedure FROM pg_proc WHERE pronamespace = 'public'::regnamespace)
      LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.oid::regprocedure);
      END LOOP;
    END;
    $$;
  `)
  console.log('   ✓ Functions dropped')

  const { rows } = await client.query(`
    SELECT count(*) as tables FROM information_schema.tables WHERE table_schema = 'public'
  `)
  console.log(`\n✅ Reset complete. Remaining public tables: ${rows[0].tables}`)
  await client.end()
}

main().catch((err) => {
  console.error('❌ Reset failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
