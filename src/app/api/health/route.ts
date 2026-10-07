import { NextResponse } from 'next/server'
import { createAdminClient, getSupabaseEnvStatus } from '@/lib/supabase'

/**
 * GET /api/health
 *
 * Verifies that the SkillSetu infrastructure is wired correctly:
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
  let supabase: 'ok' | 'error' = 'error'
  let supabaseDetail: string | undefined

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      supabaseDetail = error.message
    } else {
      supabase = 'ok'
    }
  } catch (err) {
    supabaseDetail = err instanceof Error ? err.message : 'Unknown error'
  }

  const ok = supabase === 'ok'

  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      service: 'skillsetu',
      timestamp: new Date().toISOString(),
      env: {
        url: env.url,
        anonKey: env.anonKey,
        serviceRoleKey: env.serviceRoleKey,
        databaseUrl: env.databaseUrl,
        siteUrl: env.siteUrl,
      },
      supabase: {
        status: supabase,
        ...(supabaseDetail ? { detail: supabaseDetail } : {}),
      },
      schema: 'pending — tables are created in S2/S3 via prisma db:push',
    },
    { status: ok ? 200 : 503 },
  )
}
