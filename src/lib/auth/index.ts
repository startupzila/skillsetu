/**
 * MioDemy — Auth library (S4)
 *
 * Server-side session, RBAC and audit helpers.
 *
 *   getSession()         → current user + profile + roles + permissions (or null)
 *   requireUser()        → throws AuthError(UNAUTHENTICATED) if no session
 *   requireRole(...)     → throws AuthError(FORBIDDEN) if role missing
 *   requirePermission(p) → throws AuthError(FORBIDDEN) if permission missing
 *   hasPermission(s, p)  → boolean check (no throw)
 *   isStaff(s)           → is the user a console-capable role?
 *   recordAudit(entry)   → write an immutable audit log entry
 *
 * @see docs/security.md
 */
export { PERMISSIONS, ROLES, ALL_PERMISSIONS } from './permissions'
export type { Permission, RoleName } from './permissions'

export {
  getSession,
  requireUser,
  requireRole,
  requirePermission,
  hasPermission,
  hasRole,
  isStaff,
  AuthError,
} from './session'
export type { AuthUser, AuthSession } from './session'

export { recordAudit } from './audit'
export type { AuditEntry } from './audit'
