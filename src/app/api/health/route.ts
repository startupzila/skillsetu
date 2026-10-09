import { NextResponse } from 'next/server'
import { createAdminClient, getSupabaseEnvStatus } from '@/lib/supabase'

/**
 * GET /api/health
 *
 * Verifies that the MioDemy infrastructure is wired correctly:
 *   1. All required environment variables are present.
 *   2. Supabase project is reachable over HTTPS and the service-role
 *      key is valid (via auth.admin.listUsers, which requires the
 *      service role and confirms the project is alive).
 *
 * This route uses the Supabase JS client (HTTPS / port 443) rather
 * than Prisma because raw TCP Postgres (port 5432) is blocked inside
 * the sandbox. Prisma is the schema source-of-truth only — see
 * docs/architecture.md §"Data Access" and docs/deployment.md.
 */
export async function GET() {
  const env = getSupabaseEnvStatus()

  if (!env.ok) {
    return NextResponse.json(
      {
        status: 'misconfigured',
        message: 'Required environment variables are missing.',
        missing: env.missing,
        env,
      },
      { status: 500 },
    )
  }

  // Probe Supabase over HTTPS using the service-role admin client.
  // auth.admin.listUsers() confirms: project is reachable + key is valid.
  let supabaseStatus: 'ok' | 'error' = 'error'
  let supabaseDetail: string | undefined

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      supabaseDetail = error.message
    } else {
      supabaseStatus = 'ok'
    }
  } catch (err) {
    supabaseDetail = err instanceof Error ? err.message : 'Unknown error'
  }

  // Check if the S2 schema (courses table) has been applied.
  let schemaStatus: 'applied' | 'pending' = 'pending'
  let courseCount = 0
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('courses')
      .select('*', { count: 'exact', head: true })
    if (!error && count !== null) {
      schemaStatus = 'applied'
      courseCount = count
    }
  } catch {
    // Table doesn't exist yet — schema not applied
  }

  const ok = supabaseStatus === 'ok'

  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      service: 'miodemy',
      timestamp: new Date().toISOString(),
      env: {
        url: env.url,
        anonKey: env.anonKey,
        serviceRoleKey: env.serviceRoleKey,
        databaseUrl: env.databaseUrl,
        siteUrl: env.siteUrl,
      },
      supabase: {
        status: supabaseStatus,
        ...(supabaseDetail ? { detail: supabaseDetail } : {}),
      },
      schema: {
        status: schemaStatus,
        courses: courseCount,
        ...(schemaStatus === 'pending'
          ? { message: 'Apply db/migrations/*.sql in Supabase Dashboard SQL Editor.' }
          : {}),
      },
    },
    { status: ok ? 200 : 503 },
  )
}
