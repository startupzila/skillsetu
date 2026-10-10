import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'
import { generateCourseSeo } from '@/lib/templates/seo-templates'

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
       translations:course_translations(language_code, title, short_description, description, status,
         seo_title, seo_description, seo_keywords, seo_faqs, seo_intro_paragraph)`,
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

  // Auto-generate EN SEO metadata from the title + description
  const seo = generateCourseSeo(
    input.title,
    input.short_description,
    input.difficulty,
    'en',
  )

  // Insert EN translation (with auto-generated SEO fields)
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
    seo_title: seo.seo_title,
    seo_description: seo.seo_description,
    seo_keywords: seo.seo_keywords,
    seo_faqs: seo.seo_faqs,
    seo_intro_paragraph: seo.seo_intro_paragraph,
  })

  if (transErr) return { data: null, error: transErr.message }

  await recordAudit({ action: 'course.create', entityType: 'course', entityId: course.id })
  return { data: course, error: null }
}

/** Update a course's core fields (status, difficulty, duration, slug, …). */
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

/** Update a course translation (title, descriptions, outcomes, SEO, …). */
export async function adminUpdateCourseTranslation(
  courseId: string,
  language: string,
  updates: {
    title?: string
    short_description?: string | null
    description?: string | null
    learning_outcomes?: string[] | null
    prerequisites?: string[] | null
    target_audience?: string[] | null
    status?: string
    seo_title?: string | null
    seo_description?: string | null
    seo_keywords?: string[] | null
    seo_faqs?: Array<{ q: string; a: string }> | null
    seo_intro_paragraph?: string | null
  },
) {
  await requirePermission('course.update')
  const admin = createAdminClient()

  // Try update first
  const { data: updated, error: updErr } = await admin
    .from('course_translations')
    .update(updates)
    .eq('course_id', courseId)
    .eq('language_code', language)
    .select()
    .single()

  if (updErr) {
    // Row doesn't exist yet → create it (upsert behaviour)
    // Fetch course difficulty for SEO generation
    const { data: course } = await admin
      .from('courses')
      .select('difficulty')
      .eq('id', courseId)
      .single()

    const title = updates.title ?? ''
    const seo = title
      ? generateCourseSeo(title, updates.short_description, course?.difficulty, language as 'en' | 'hi')
      : null

    const { data: inserted, error: insErr } = await admin.from('course_translations').insert({
      course_id: courseId,
      language_code: language,
      title: updates.title ?? '',
      short_description: updates.short_description ?? null,
      description: updates.description ?? null,
      learning_outcomes: updates.learning_outcomes ?? null,
      prerequisites: updates.prerequisites ?? null,
      target_audience: updates.target_audience ?? null,
      status: 'draft',
      ...(seo ? {
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        seo_keywords: seo.seo_keywords,
        seo_faqs: seo.seo_faqs,
        seo_intro_paragraph: seo.seo_intro_paragraph,
      } : {}),
      ...updates,
    }).select().single()

    if (insErr) return { data: null, error: insErr.message }
    await recordAudit({ action: 'course.update', entityType: 'course', entityId: courseId })
    return { data: inserted, error: null }
  }

  await recordAudit({ action: 'course.update', entityType: 'course', entityId: courseId })
  return { data: updated, error: null }
}

/** Create a new translation row for an existing course (e.g. add Hindi). */
export async function adminCreateCourseTranslation(
  courseId: string,
  language: string,
  input: {
    title: string
    short_description?: string | null
    description?: string | null
  },
) {
  await requirePermission('course.update')
  const admin = createAdminClient()

  // Fetch course difficulty for SEO generation
  const { data: course } = await admin
    .from('courses')
    .select('difficulty')
    .eq('id', courseId)
    .single()

  const seo = generateCourseSeo(
    input.title,
    input.short_description,
    course?.difficulty,
    language as 'en' | 'hi',
  )

  const { data, error } = await admin.from('course_translations').insert({
    course_id: courseId,
    language_code: language,
    title: input.title,
    short_description: input.short_description ?? null,
    description: input.description ?? null,
    status: 'draft',
    seo_title: seo.seo_title,
    seo_description: seo.seo_description,
    seo_keywords: seo.seo_keywords,
    seo_faqs: seo.seo_faqs,
    seo_intro_paragraph: seo.seo_intro_paragraph,
  }).select().single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'course.update', entityType: 'course', entityId: courseId })
  return { data, error: null }
}

/** Publish a course (and all its published-status translations). */
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

  // Publish all existing translations so they're visible (RLS hides drafts)
  await admin
    .from('course_translations')
    .update({ status: 'published' })
    .eq('course_id', courseId)
    .not('status', 'eq', 'published')

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

/** Update a module's core fields (slug, sort_order, status). */
export async function adminUpdateModule(moduleId: string, updates: Record<string, unknown>) {
  await requirePermission('course.update')
  const admin = createAdminClient()
  const { data, error } = await admin.from('modules').update(updates).eq('id', moduleId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update a module translation (title, description).
 *  If the row doesn't exist for this (module_id, language_code), create it.
 *  This allows the editor's "Hindi" tab to create the HI translation on first save. */
export async function adminUpdateModuleTranslation(
  moduleId: string,
  language: string,
  updates: { title?: string; description?: string | null },
) {
  await requirePermission('course.update')
  const admin = createAdminClient()

  // Try update first; if no row matches, fall back to insert (upsert).
  const { data: updated, error: updErr } = await admin
    .from('module_translations')
    .update(updates)
    .eq('module_id', moduleId)
    .eq('language_code', language)
    .select()
    .maybeSingle()

  if (updErr) return { data: null, error: updErr.message }
  if (updated) {
    await recordAudit({ action: 'course.update', entityType: 'module', entityId: moduleId })
    return { data: updated, error: null }
  }

  // Row doesn't exist → create it.
  const { data: inserted, error: insErr } = await admin
    .from('module_translations')
    .insert({
      module_id: moduleId,
      language_code: language,
      title: updates.title ?? '',
      description: updates.description ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (insErr) return { data: null, error: insErr.message }
  await recordAudit({ action: 'course.update', entityType: 'module', entityId: moduleId })
  return { data: inserted, error: null }
}

/** Delete a module (cascades to translations + lessons). */
export async function adminDeleteModule(moduleId: string) {
  await requirePermission('course.update')
  const admin = createAdminClient()
  const { error } = await admin.from('modules').delete().eq('id', moduleId)
  if (error) return { error: error.message }
  return { error: null }
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

/** Update a lesson's core fields (slug, sort_order, status, duration, video_url). */
export async function adminUpdateLesson(lessonId: string, updates: Record<string, unknown>) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()
  const { data, error } = await admin.from('lessons').update(updates).eq('id', lessonId).select().single()
  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'lesson.update', entityType: 'lesson', entityId: lessonId })
  return { data, error: null }
}

/** Delete a lesson (cascades to translations + blocks; questions set to null lesson_id). */
export async function adminDeleteLesson(lessonId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()
  const { error } = await admin.from('lessons').delete().eq('id', lessonId)
  if (error) return { error: error.message }
  await recordAudit({ action: 'lesson.delete', entityType: 'lesson', entityId: lessonId })
  return { error: null }
}

/** Publish a lesson (and its EN translation — both must be published for RLS). */
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

  // Also publish the EN translation (RLS hides draft translations from the
  // public — a lesson is only visible when both lesson + translation are
  // published). Best-effort: ignore error if no EN translation exists yet.
  await admin
    .from('lesson_translations')
    .update({ status: 'published' })
    .eq('lesson_id', lessonId)
    .eq('language_code', 'en')

  await recordAudit({ action: 'lesson.publish', entityType: 'lesson', entityId: lessonId })
  return { data, error: null }
}

/** Update lesson translation (title, summary, content_html). */
export async function adminUpdateLessonTranslation(
  lessonTranslationId: string,
  updates: { title?: string; summary?: string | null; content_html?: string | null; status?: string },
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
  await recordAudit({ action: 'lesson.update', entityType: 'lesson', entityId: lessonTranslationId })
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
    .select('id, title, summary, content_html, status')
    .eq('lesson_id', lessonId)
    .eq('language_code', language)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a lesson (including draft) by ID with its video_url + ALL translations
 *  (incl content_html) as an array. Used by the lesson editor which has EN/HI
 *  tabs and needs both translations on the client. */
export async function adminGetLesson(lessonId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data: lesson, error: lErr } = await admin
    .from('lessons')
    .select('id, slug, sort_order, lesson_type, status, duration_minutes, video_url, module_id')
    .eq('id', lessonId)
    .single()
  if (lErr) return { data: null, error: lErr.message }

  const { data: translations, error: tErr } = await admin
    .from('lesson_translations')
    .select('id, language_code, title, summary, content_html, status')
    .eq('lesson_id', lessonId)

  if (tErr) return { data: null, error: tErr.message }

  return {
    data: { ...lesson, translations: translations ?? [] },
    error: null,
  }
}

/** Upsert a lesson translation by (lesson_id, language_code).
 *  Used when the editor's Hindi tab saves for the first time (no HI row yet).
 *  Also accepts updates to an existing translation by id. */
export async function adminUpsertLessonTranslation(
  lessonId: string,
  language: string,
  fields: { title?: string; summary?: string | null; content_html?: string | null; status?: string },
) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('lesson_translations')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('language_code', language)
    .maybeSingle()

  if (existing) {
    const { data, error } = await admin
      .from('lesson_translations')
      .update(fields)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    await recordAudit({ action: 'lesson.update', entityType: 'lesson', entityId: lessonId })
    return { data, error: null }
  }

  const { data, error } = await admin
    .from('lesson_translations')
    .insert({
      lesson_id: lessonId,
      language_code: language,
      title: fields.title ?? '',
      summary: fields.summary ?? null,
      content_html: fields.content_html ?? null,
      status: fields.status ?? 'draft',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'lesson.update', entityType: 'lesson', entityId: lessonId })
  return { data, error: null }
}
