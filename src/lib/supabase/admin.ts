import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase admin client using the service-role key.
 *
 * ⚠️  NEVER import this in a Client Component or expose the service-role
 *    key to the browser. It bypasses Row Level Security entirely.
 *
 * Use only for trusted server-side operations:
 *   - admin / console actions behind an explicit permission check
 *   - privileged reads / writes that must act as the system
 *   - background jobs / webhooks
 *
 * @see docs/security.md (added in S4)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'The admin client is server-only and requires the service-role key.',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
