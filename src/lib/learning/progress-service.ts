import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Enrollment, LessonProgress, Bookmark, Note, EntityType } from './learner-types'

/**
 * progressService — manages learner progress, bookmarks and notes.
 *
 * All operations are scoped to the signed-in user (auth.uid()). RLS
 * enforces self-only access; the service layer additionally extracts
 * auth.uid() from the session so client-provided user_id is never trusted.
 *
 * Server-authoritative: progress is never computed from client state alone.
 */

/** Get the current user's id from the session. Throws if not authenticated. */
async function requireUserId(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')
  return user.id
}

// ── ENROLLMENTS ────────────────────────────────────────────

/** Enrol the current user in a course (idempotent). */
export async function enrolInCourse(courseId: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: userId, course_id: courseId, status: 'active' },
      { onConflict: 'user_id,course_id' },
    )
    .select()
    .single<Enrollment>()

  return { data, error: error?.message ?? null }
}

/** List the current user's enrollments. */
export async function listMyEnrollments() {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  return { data: (data ?? []) as Enrollment[], error: error?.message ?? null }
}

// ── LESSON PROGRESS ────────────────────────────────────────

/** Get or create a progress record for a lesson (marks it in_progress). */
export async function getOrCreateLessonProgress(lessonId: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  // Try to fetch existing
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single<LessonProgress>()

  if (existing) return { data: existing, error: null }

  // Create new (not_started → in_progress)
  const { data, error } = await supabase
    .from('lesson_progress')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      status: 'in_progress',
      progress_percent: 0,
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    })
    .select()
    .single<LessonProgress>()

  return { data, error: error?.message ?? null }
}

/** Mark a lesson as completed and update enrollment progress. */
export async function completeLesson(lessonId: string, enrollmentId?: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        status: 'completed',
        progress_percent: 100,
        completed_at: now,
        last_accessed_at: now,
      },
      { onConflict: 'user_id,lesson_id' },
    )
    .select()
    .single<LessonProgress>()

  return { data, error: error?.message ?? null }
}

// ── BOOKMARKS ──────────────────────────────────────────────

/** Toggle a bookmark (add if absent, remove if present). */
export async function toggleBookmark(
  entityType: EntityType,
  entityId: string,
) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  // Check if bookmark exists
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', (existing as Bookmark).id)
    return { data: { bookmarked: false }, error: error?.message ?? null }
  }

  // Add
  const { error } = await supabase.from('bookmarks').insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
  })
  return { data: { bookmarked: true }, error: error?.message ?? null }
}

/** List the current user's bookmarks (optionally filtered by type). */
export async function listMyBookmarks(entityType?: EntityType) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  let query = supabase.from('bookmarks').select('*').eq('user_id', userId)
  if (entityType) query = query.eq('entity_type', entityType)
  const { data, error } = await query.order('created_at', { ascending: false })

  return { data: (data ?? []) as Bookmark[], error: error?.message ?? null }
}

// ── NOTES ─────────────────────────────────────────────────

/** Create a private note on a lesson or course. */
export async function createNote(
  content: string,
  options: { lessonId?: string; courseId?: string } = {},
) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      lesson_id: options.lessonId ?? null,
      course_id: options.courseId ?? null,
      content,
      is_private: true,
    })
    .select()
    .single<Note>()

  return { data, error: error?.message ?? null }
}

/** List notes for a lesson (current user's private notes only). */
export async function listMyNotes(lessonId?: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  let query = supabase.from('notes').select('*').eq('user_id', userId)
  if (lessonId) query = query.eq('lesson_id', lessonId)
  const { data, error } = await query.order('updated_at', { ascending: false })

  return { data: (data ?? []) as Note[], error: error?.message ?? null }
}

/** Update a note (only the owner can, via RLS). */
export async function updateNote(noteId: string, content: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single<Note>()

  return { data, error: error?.message ?? null }
}

/** Delete a note (only the owner can, via RLS). */
export async function deleteNote(noteId: string) {
  const userId = await requireUserId()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}
