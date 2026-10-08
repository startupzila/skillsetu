import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'
import type { EntityType } from '@/lib/auth/permissions'

/**
 * Admin editorial service — reviews, comments, assignments.
 *
 * @see prisma/schema.prisma (Editorial section)
 */

// ── REVIEWS ─────────────────────────────────────────────────

export interface ReviewInput {
  entityType: EntityType
  entityId: string
  status?: string
  feedback?: string
}

/** Create a review request. */
export async function adminCreateReview(input: ReviewInput) {
  const session = await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin.from('reviews').insert({
    reviewer_id: session.user.id,
    entity_type: input.entityType,
    entity_id: input.entityId,
    status: input.status ?? 'pending',
    feedback: input.feedback ?? null,
  }).select().single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update review status (approve/reject/changes_requested). */
export async function adminUpdateReview(
  reviewId: string,
  updates: { status: string; feedback?: string },
) {
  await requirePermission('question.review')
  const admin = createAdminClient()

  const { data, error } = await admin.from('reviews')
    .update({
      status: updates.status,
      feedback: updates.feedback ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** List reviews (optionally filtered by entity). */
export async function adminListReviews(entityType?: EntityType, entityId?: string) {
  await requirePermission('question.review')
  const admin = createAdminClient()

  let query = admin.from('reviews').select(
    `id, status, feedback, reviewed_at, created_at,
     reviewer:profiles!reviews_reviewer_id_fkey(display_name)`,
  )

  if (entityType && entityId) {
    query = query.eq('entity_type', entityType).eq('entity_id', entityId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── EDITORIAL COMMENTS ─────────────────────────────────────

export interface CommentInput {
  entityType: EntityType
  entityId: string
  comment: string
}

/** Create an editorial comment. */
export async function adminCreateComment(input: CommentInput) {
  const session = await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin.from('editorial_comments').insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    author_id: session.user.id,
    comment: input.comment,
    resolved: false,
  }).select().single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** List comments for an entity. */
export async function adminListComments(entityType: EntityType, entityId: string) {
  await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin.from('editorial_comments')
    .select(
      `id, comment, resolved, created_at, updated_at,
       author:profiles!editorial_comments_author_id_fkey(display_name)`,
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Resolve/unresolve a comment. */
export async function adminToggleCommentResolved(commentId: string) {
  await requireUser()
  const admin = createAdminClient()

  const { data: current } = await admin.from('editorial_comments')
    .select('resolved')
    .eq('id', commentId)
    .single()

  const { data, error } = await admin.from('editorial_comments')
    .update({ resolved: !current?.resolved })
    .eq('id', commentId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Delete a comment. */
export async function adminDeleteComment(commentId: string) {
  await requireUser()
  const admin = createAdminClient()

  const { error } = await admin.from('editorial_comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  return { error: null }
}
