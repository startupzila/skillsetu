/**
 * Centralised validation of required Supabase environment variables.
 *
 * A missing / misconfigured deployment fails loudly and early instead
 * of producing cryptic downstream errors.
 */
export type SupabaseEnvStatus = {
  ok: boolean
  url: boolean
  anonKey: boolean
  serviceRoleKey: boolean
  databaseUrl: boolean
  siteUrl: boolean
  missing: string[]
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const missing: string[] = []

  const url = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const serviceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const databaseUrl = Boolean(process.env.DATABASE_URL)
  const siteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL)

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!databaseUrl) missing.push('DATABASE_URL')
  if (!siteUrl) missing.push('NEXT_PUBLIC_SITE_URL')

  return {
    ok: missing.length === 0,
    url,
    anonKey,
    serviceRoleKey,
    databaseUrl,
    siteUrl,
    missing,
  }
}
