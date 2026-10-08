import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Admin content service — CRUD operations for courses, modules, lessons.
 *
 * All operations require the caller to have the appropriate permission
 * (course.create, course.update, course.publish, etc.).
 * Uses the service-role admin client (bypasses RLS, server-only).
 *
 * @see docs/security.md
 */

// ── COURSES ────────────────────────────────────────────────

export interface CourseInput {
  slug: string
  difficulty?: string
  estimated_duration?: number | null
  default_language?: string
  status?: string
  // Translation
  title: string
  short_description?: string
  description?: string
  learning_outcomes?: string[]
  prerequisites?: string[]
  target_audience?: string[]
  language_code?: string
}

/** List all courses (including drafts) for the console. */
export async function adminListCourses() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .select(
      `
      id, slug, status, difficulty, estimated_duration,
      default_language, published_at, created_at, updated_at,
      translations:course_translations(language_code, title, status)
      `,
    )
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single course (including draft) by ID for the console editor. */
export async function adminGetCourse(courseId: string) {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .select(
      `id, slug, status, difficulty, estimated_duration, default_language, published_at,
       translations:course_translations(language_code, title, short_description, description, status)`,
    )
    .eq('id', courseId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a new course (with EN translation). */
export async function adminCreateCourse(input: CourseInput) {
  await requirePermission('course.create')
  const admin = createAdminClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .insert({
      slug: input.slug,
      difficulty: input.difficulty ?? 'beginner',
      estimated_duration: input.estimated_duration ?? null,
      default_language: input.default_language ?? 'en',
      status: input.status ?? 'draft',
    })
    .select()
    .single()

  if (courseErr) return { data: null, error: courseErr.message }

  // Insert EN translation
  const { error: transErr } = await admin.from('course_translations').insert({
    course_id: course.id,
    language_code: input.language_code ?? 'en',
    title: input.title,
    short_description: input.short_description ?? null,
    description: input.description ?? null,
    learning_outcomes: input.learning_outcomes ?? null,
    prerequisites: input.prerequisites ?? null,
    target_audience: input.target_audience ?? null,
    status: 'draft',
  })

  if (transErr) return { data: null, error: transErr.message }

  await recordAudit({ action: 'course.create', entityType: 'course', entityId: course.id })
  return { data: course, error: null }
}

/** Update a course. */
export async function adminUpdateCourse(courseId: string, updates: Record<string, unknown>) {
  await requirePermission('course.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'course.update', entityType: 'course', entityId: courseId })
  return { data, error: null }
}

/** Publish a course. */
export async function adminPublishCourse(courseId: string) {
  await requirePermission('course.publish')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'course.publish', entityType: 'course', entityId: courseId })
  return { data, error: null }
}

/** Archive a course (soft delete — does not hard-delete). */
export async function adminArchiveCourse(courseId: string) {
  await requirePermission('course.publish')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .update({ status: 'archived' })
    .eq('id', courseId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'course.archive', entityType: 'course', entityId: courseId })
  return { data, error: null }
}

// ── MODULES ────────────────────────────────────────────────

export interface ModuleInput {
  course_id: string
  slug: string
  sort_order?: number
  title: string
  description?: string
}

/** List modules for a course (with lessons). */
export async function adminListModules(courseId: string) {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data: modules, error: modErr } = await admin
    .from('modules')
    .select(
      `id, slug, sort_order, status, created_at,
       translations:module_translations(language_code, title, description),
       lessons(id, slug, sort_order, status, duration_minutes,
         translations:lesson_translations(language_code, title))`,
    )
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (modErr) return { data: null, error: modErr.message }
  return { data: modules, error: null }
}

/** Create a module. */
export async function adminCreateModule(input: ModuleInput) {
  await requirePermission('course.update')
  const admin = createAdminClient()

  const { data: mod, error: modErr } = await admin
    .from('modules')
    .insert({
      course_id: input.course_id,
      slug: input.slug,
      sort_order: input.sort_order ?? 0,
      status: 'draft',
    })
    .select()
    .single()

  if (modErr) return { data: null, error: modErr.message }

  const { error: transErr } = await admin.from('module_translations').insert({
    module_id: mod.id,
    language_code: 'en',
    title: input.title,
    description: input.description ?? null,
    status: 'draft',
  })

  if (transErr) return { data: null, error: transErr.message }
  return { data: mod, error: null }
}

// ── LESSONS ────────────────────────────────────────────────

export interface LessonInput {
  module_id: string
  slug: string
  sort_order?: number
  lesson_type?: string
  duration_minutes?: number | null
  title: string
  summary?: string
}

/** Create a lesson. */
export async function adminCreateLesson(input: LessonInput) {
  await requirePermission('lesson.create')
  const admin = createAdminClient()

  const { data: lesson, error: lessonErr } = await admin
    .from('lessons')
    .insert({
      module_id: input.module_id,
      slug: input.slug,
      sort_order: input.sort_order ?? 0,
      lesson_type: input.lesson_type ?? 'article',
      duration_minutes: input.duration_minutes ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (lessonErr) return { data: null, error: lessonErr.message }

  const { error: transErr } = await admin.from('lesson_translations').insert({
    lesson_id: lesson.id,
    language_code: 'en',
    title: input.title,
    summary: input.summary ?? null,
    status: 'draft',
  })

  if (transErr) return { data: null, error: transErr.message }
  await recordAudit({ action: 'lesson.create', entityType: 'lesson', entityId: lesson.id })
  return { data: lesson, error: null }
}

/** Publish a lesson. */
export async function adminPublishLesson(lessonId: string) {
  await requirePermission('lesson.publish')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lessons')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'lesson.publish', entityType: 'lesson', entityId: lessonId })
  return { data, error: null }
}

/** Update lesson translation (title, summary). */
export async function adminUpdateLessonTranslation(
  lessonTranslationId: string,
  updates: { title?: string; summary?: string },
) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lesson_translations')
    .update(updates)
    .eq('id', lessonTranslationId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── LESSON BLOCKS ───────────────────────────────────────────

/** List blocks for a lesson translation (ordered by sort_order). */
export async function adminListBlocks(lessonTranslationId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lesson_blocks')
    .select('id, block_type, sort_order, data, created_at, updated_at')
    .eq('lesson_translation_id', lessonTranslationId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a block. */
export async function adminCreateBlock(input: {
  lesson_translation_id: string
  block_type: string
  data: Record<string, unknown>
  sort_order?: number
}) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lesson_blocks')
    .insert({
      lesson_translation_id: input.lesson_translation_id,
      block_type: input.block_type,
      data: input.data,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update a block (type + data). */
export async function adminUpdateBlock(
  blockId: string,
  updates: { block_type?: string; data?: Record<string, unknown>; sort_order?: number },
) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lesson_blocks')
    .update(updates)
    .eq('id', blockId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Delete a block. */
export async function adminDeleteBlock(blockId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { error } = await admin.from('lesson_blocks').delete().eq('id', blockId)
  if (error) return { error: error.message }
  return { error: null }
}

/** Reorder blocks (accepts array of {id, sort_order}). */
export async function adminReorderBlocks(
  items: Array<{ id: string; sort_order: number }>,
) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  for (const item of items) {
    const { error } = await admin
      .from('lesson_blocks')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
    if (error) return { error: error.message }
  }
  return { error: null }
}

/** Get lesson translation ID by lesson ID + language. */
export async function adminGetLessonTranslation(lessonId: string, language = 'en') {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('lesson_translations')
    .select('id, title, summary, status')
    .eq('lesson_id', lessonId)
    .eq('language_code', language)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
