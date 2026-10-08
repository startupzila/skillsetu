import { createAdminClient } from '@/lib/supabase/admin'

/**
 * SkillSetu — Audit log helper (S4)
 *
 * Writes immutable audit entries for administrative actions.
 * Audit logs are service-role only (RLS blocks public access).
 *
 * @see docs/security.md
 */

export interface AuditEntry {
  actorId?: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/** Record an audit event. Fails silently (logs to console) if the
 *  audit_logs table doesn't exist yet (schema not applied). */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    })
    if (error && !error.message.includes('does not exist') && !error.message.includes('Could not find')) {
      console.error('[audit] failed to record:', error.message)
    }
  } catch (err) {
    console.error('[audit] error:', err)
  }
}
