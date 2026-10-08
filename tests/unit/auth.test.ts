import { describe, it, expect } from 'vitest'

/**
 * Integration tests for auth-related logic.
 * These test the permission/role logic without hitting the DB.
 */

import { PERMISSIONS, ROLES, ALL_PERMISSIONS } from '@/lib/auth/permissions'

describe('PERMISSIONS', () => {
  it('has 19 permissions', () => {
    expect(Object.keys(PERMISSIONS)).toHaveLength(19)
  })

  it('includes course.read', () => {
    expect(PERMISSIONS.COURSE_READ).toBe('course.read')
  })

  it('includes users.manage', () => {
    expect(PERMISSIONS.USERS_MANAGE).toBe('users.manage')
  })

  it('includes audit.read', () => {
    expect(PERMISSIONS.AUDIT_READ).toBe('audit.read')
  })
})

describe('ROLES', () => {
  it('has 11 roles', () => {
    expect(Object.keys(ROLES)).toHaveLength(11)
  })

  it('includes super_admin', () => {
    expect(ROLES.SUPER_ADMIN).toBe('super_admin')
  })

  it('includes media_manager', () => {
    expect(ROLES.MEDIA_MANAGER).toBe('media_manager')
  })
})

describe('ALL_PERMISSIONS', () => {
  it('contains all 19 permissions', () => {
    expect(ALL_PERMISSIONS).toHaveLength(19)
  })

  it('includes every permission value', () => {
    Object.values(PERMISSIONS).forEach((perm) => {
      expect(ALL_PERMISSIONS).toContain(perm)
    })
  })
})

// ── Auth session shape validation ────────────────────────

interface AuthSession {
  user: { id: string; email: string; emailConfirmed: boolean }
  roles: string[]
  permissions: string[]
}

function isStaff(session: AuthSession | null): boolean {
  if (!session) return false
  const staffRoles = [
    'super_admin', 'admin', 'editorial_manager', 'content_writer',
    'reviewer', 'translator', 'quiz_editor', 'commerce_manager',
    'marketing_manager', 'analyst', 'media_manager',
  ]
  return session.roles.some((r) => staffRoles.includes(r))
}

function hasPermission(session: AuthSession | null, permission: string): boolean {
  if (!session) return false
  if (session.permissions.includes('*')) return true
  return session.permissions.includes(permission)
}

describe('isStaff', () => {
  it('returns true for super_admin', () => {
    expect(isStaff({ user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: ['super_admin'], permissions: ['*'] })).toBe(true)
  })

  it('returns true for content_writer', () => {
    expect(isStaff({ user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: ['content_writer'], permissions: ['course.read'] })).toBe(true)
  })

  it('returns false for null session', () => {
    expect(isStaff(null)).toBe(false)
  })

  it('returns false for no roles', () => {
    expect(isStaff({ user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: [], permissions: [] })).toBe(false)
  })
})

describe('hasPermission', () => {
  it('returns true for super_admin (* permission)', () => {
    const s = { user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: ['super_admin'], permissions: ['*'] }
    expect(hasPermission(s, 'course.publish')).toBe(true)
    expect(hasPermission(s, 'users.manage')).toBe(true)
  })

  it('returns true when permission exists', () => {
    const s = { user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: ['admin'], permissions: ['course.read', 'course.create'] }
    expect(hasPermission(s, 'course.read')).toBe(true)
  })

  it('returns false when permission missing', () => {
    const s = { user: { id: '1', email: 'a@b.c', emailConfirmed: true }, roles: ['content_writer'], permissions: ['course.read'] }
    expect(hasPermission(s, 'course.publish')).toBe(false)
  })

  it('returns false for null session', () => {
    expect(hasPermission(null, 'course.read')).toBe(false)
  })
})

// ── Coupon validation logic ─────────────────────────────

function validateCouponLogic(coupon: {
  status: string; starts_at: string | null; expires_at: string | null;
  usage_limit: number | null; used_count: number; min_order_cents: number;
}, orderTotalCents: number): { valid: boolean; error: string | null } {
  if (coupon.status !== 'active') return { valid: false, error: 'Coupon is not active' }

  const now = new Date()
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { valid: false, error: 'Coupon not yet active' }
  if (coupon.expires_at && new Date(coupon.expires_at) < now)
    return { valid: false, error: 'Coupon has expired' }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { valid: false, error: 'Coupon usage limit reached' }
  if (orderTotalCents < coupon.min_order_cents)
    return { valid: false, error: 'Order does not meet minimum amount' }

  return { valid: true, error: null }
}

describe('validateCouponLogic', () => {
  const baseCoupon = {
    status: 'active', starts_at: null, expires_at: null,
    usage_limit: null, used_count: 0, min_order_cents: 0,
  }

  it('validates a basic active coupon', () => {
    expect(validateCouponLogic(baseCoupon, 1000)).toEqual({ valid: true, error: null })
  })

  it('rejects inactive coupon', () => {
    expect(validateCouponLogic({ ...baseCoupon, status: 'inactive' }, 1000).valid).toBe(false)
  })

  it('rejects expired coupon', () => {
    const expired = { ...baseCoupon, expires_at: '2020-01-01T00:00:00Z' }
    expect(validateCouponLogic(expired, 1000).valid).toBe(false)
  })

  it('rejects future-start coupon', () => {
    const future = { ...baseCoupon, starts_at: '2099-01-01T00:00:00Z' }
    expect(validateCouponLogic(future, 1000).valid).toBe(false)
  })

  it('rejects when usage limit reached', () => {
    const used = { ...baseCoupon, usage_limit: 10, used_count: 10 }
    expect(validateCouponLogic(used, 1000).valid).toBe(false)
  })

  it('rejects when order below minimum', () => {
    const minOrder = { ...baseCoupon, min_order_cents: 500 }
    expect(validateCouponLogic(minOrder, 100).valid).toBe(false)
  })
})
