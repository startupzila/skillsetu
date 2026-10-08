import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/content/types'
import type { RoleName } from './permissions'

/**
 * SkillSetu — Session & authorization helpers (S4)
 *
 * These helpers run server-side only. They read the Supabase session
 * from cookies and look up the user's roles + permissions from the DB.
 *
 * Security rules:
 *   - Never trust client-provided user_id or role values.
 *   - Authorization is enforced server-side AND via Supabase RLS.
 *   - Frontend hiding is never the only control.
 *
 * @see docs/security.md
 */

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

/** Get the current authenticated user + profile + roles + permissions. */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // Fetch roles (user_roles → roles.name)
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)

  const roles: RoleName[] = (roleRows ?? [])
    .map((r: { role: { name: string } | null }) => r?.role?.name as RoleName)
    .filter(Boolean)

  // Fetch permissions (role_permissions → permissions.name)
  let permissions: string[] = []
  if (roles.length > 0) {
    const { data: permRows } = await supabase
      .from('role_permissions')
      .select('permission:permissions(name)')
      .in(
        'role_id',
        (await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)).data?.map((r: { role_id: string }) => r.role_id) ?? [],
      )

    permissions = (permRows ?? [])
      .map((p: { permission: { name: string } | null }) => p?.permission?.name)
      .filter(Boolean) as string[]
  }

  // super_admin implicitly has all permissions
  if (roles.includes('super_admin' as RoleName)) {
    permissions = ['*']
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      emailConfirmed: !!user.email_confirmed_at,
    },
    profile,
    roles,
    permissions,
  }
}

/** Require an authenticated user; throws AuthError if not. */
export async function requireUser(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    throw new AuthError('Authentication required', 'UNAUTHENTICATED')
  }
  return session
}

/** Require the user to have one of the given roles. */
export async function requireRole(...roles: RoleName[]): Promise<AuthSession> {
  const session = await requireUser()
  const hasRole = session.roles.some((r) => roles.includes(r))
  if (!hasRole) {
    throw new AuthError('Insufficient role', 'FORBIDDEN')
  }
  return session
}

/** Require the user to have a specific permission. */
export async function requirePermission(permission: string): Promise<AuthSession> {
  const session = await requireUser()
  // super_admin has '*'
  if (session.permissions.includes('*')) return session
  if (!session.permissions.includes(permission)) {
    throw new AuthError('Insufficient permissions', 'FORBIDDEN')
  }
  return session
}

/** Check if a session has a permission (no throw). */
export function hasPermission(session: AuthSession | null, permission: string): boolean {
  if (!session) return false
  if (session.permissions.includes('*')) return true
  return session.permissions.includes(permission)
}

/** Check if a session has one of the given roles (no throw). */
export function hasRole(session: AuthSession | null, ...roles: RoleName[]): boolean {
  if (!session) return false
  return session.roles.some((r) => roles.includes(r))
}

/** Is this user a console-accessible role (any staff role)? */
export function isStaff(session: AuthSession | null): boolean {
  return hasRole(
    session,
    'super_admin',
    'admin',
    'editorial_manager',
    'content_writer',
    'reviewer',
    'translator',
    'quiz_editor',
    'commerce_manager',
    'marketing_manager',
    'analyst',
    'media_manager',
  )
}

/** Custom error carrying a code for HTTP mapping. */
export class AuthError extends Error {
  code: 'UNAUTHENTICATED' | 'FORBIDDEN'
  constructor(message: string, code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}
