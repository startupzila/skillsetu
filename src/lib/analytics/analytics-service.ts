import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'

/**
 * Analytics service — event tracking + admin metrics.
 *
 * Events are stored in the `audit_logs` table (action field = event name,
 * metadata field = event details). This reuses existing infrastructure
 * rather than creating a separate events table for MVP.
 *
 * @see prisma/schema.prisma (AuditLog)
 */

// ── EVENT TRACKING ─────────────────────────────────────────

/** Track a product-level event (course_view, lesson_complete, etc.) */
export async function trackEvent(event: {
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client to write (audit_logs has no public insert policy)
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user?.id ?? null,
      action: event.action,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      metadata: event.metadata ?? null,
    })
  } catch {
    // Silent fail — analytics should never break the page
  }
}

// ── ADMIN METRICS ──────────────────────────────────────────

export interface AdminMetrics {
  learners: number
  courses: number
  publishedCourses: number
  lessons: number
  publishedLessons: number
  questions: number
  orders: number
  paidOrders: number
  revenue: number
  enrollments: number
  quizAttempts: number
  bookmarks: number
  notes: number
  mediaAssets: number
}

/** Get aggregate metrics for the admin analytics dashboard. */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  await requirePermission('analytics.read')
  const admin = createAdminClient()

  async function count(table: string, filter?: string) {
    let q = admin.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = q.filter(...filter.split(','))
    const { count: c } = await q
    return c ?? 0
  }

  const [
    learners, courses, publishedCourses, lessons, publishedLessons,
    questions, orders, paidOrders, revenue, enrollments, quizAttempts,
    bookmarks, notes, mediaAssets,
  ] = await Promise.all([
    count('profiles'),
    count('courses'),
    count('courses', 'status=eq.published'),
    count('lessons'),
    count('lessons', 'status=eq.published'),
    count('questions', 'status=eq.published'),
    count('orders'),
    count('orders', 'status=eq.paid'),
    (async () => {
      const { data } = await admin.from('orders').select('total_cents').eq('status', 'paid')
      return (data ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0)
    })(),
    count('enrollments'),
    count('attempts', 'status=eq.completed'),
    count('bookmarks'),
    count('notes'),
    count('media_assets'),
  ])

  return {
    learners, courses, publishedCourses, lessons, publishedLessons,
    questions, orders, paidOrders, revenue, enrollments, quizAttempts,
    bookmarks, notes, mediaAssets,
  }
}

/** Get recent events (for the analytics dashboard). */
export async function getRecentEvents(limit = 20) {
  await requirePermission('analytics.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('audit_logs')
    .select('action, entity_type, entity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data ?? []
}
