import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Profile } from '@/lib/content/types'
import type { RoleName } from './permissions'

// Re-export the AuthSession type from session.ts
export interface AuthUser {
  id: string
  email: string
  emailConfirmed: boolean
}

export interface AuthSession {
  user: AuthUser
  profile: Profile | null
  roles: RoleName[]
  permissions: string[]
}

/**
 * Lightweight session fetch — optimized version of getSession().
 *
 * The original getSession() makes 5 sequential Supabase API calls:
 *   1. auth.getUser()
 *   2. profiles.select(*).eq('id', user.id)
 *   3. user_roles.select(role:roles(name))
 *   4. user_roles.select(role_id) (redundant — already fetched in #3)
 *   5. role_permissions.select(permission:permissions(name))
 *
 * Each call is ~50-100ms → 250-500ms total per page load.
 * Since the public layout calls this on EVERY page, that's a massive overhead.
 *
 * This optimized version:
 *   - Fetches profile + roles in 2 parallel calls (not 4 sequential)
 *   - Skips permissions entirely (only needed in console, not public pages)
 *   - For public pages, we only need: is user logged in? + display name + isStaff?
 *
 * For console pages that need full permissions, use the original getSession().
 */

/** Fast session check for public pages — returns minimal user info. */
export async function getSessionFast(): Promise<AuthSession | null> {
  const headerList = await headers()
  const cookieHeader = headerList.get('cookie') ?? ''

  // Quick check: if no supabase auth cookie, user is definitely not logged in
  if (!cookieHeader.includes('sb-') && !cookieHeader.includes('supabase')) {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieHeader.split(';').map((c) => {
          const [name, ...rest] = c.trim().split('=')
          return { name, value: rest.join('=') }
        }).filter((c) => c.name && c.value)
      },
      setAll() {
        // No-op — server component
      },
    },
  })

  // 1. Get user (fast — reads from JWT, no DB query)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch profile + roles in PARALLEL (was sequential)
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('user_roles').select('role:roles(name)').eq('user_id', user.id),
  ])

  const roles: RoleName[] = (roleRows ?? [])
    .map((r: { role: { name: string } | null }) => r?.role?.name as RoleName)
    .filter(Boolean)

  // For public pages, we don't need permissions — just roles for isStaff check
  const permissions: string[] = roles.includes('super_admin' as RoleName) ? ['*'] : []

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      emailConfirmed: !!user.email_confirmed_at,
    },
    profile: profile as Profile | null,
    roles,
    permissions,
  }
}

