import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  CourseWithTranslation,
  CourseWithCurriculum,
  LanguageCode,
  CurriculumModule,
} from './types'

/**
 * courseService — reads published courses with translations and curriculum.
 *
 * Uses the server Supabase client (anon key, RLS on). Only rows
 * with status = 'published' are visible to the public via RLS.
 */

/** List all published courses, each with translations for the given language. */
export async function listPublishedCourses(language?: LanguageCode) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id, slug, status, difficulty, estimated_duration,
      default_language, published_at,
      translations:course_translations(
        id, language_code, title, short_description,
        status, learning_outcomes
      )
      `,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message, code: error.code }
  }

  const courses = (data ?? []) as CourseWithTranslation[]

  // Filter translations to the requested language
  const filtered = language
    ? courses.map((c) => ({
        ...c,
        translations: c.translations.filter(
          (t) => t.language_code === language && t.status === 'published',
        ),
      }))
    : courses

  // Only return courses that actually have a published translation
  const withTranslation = filtered.filter((c) => c.translations.length > 0)

  return { data: withTranslation, error: null, code: null }
}

/** List published courses belonging to a specific category (by category slug). */
export async function listPublishedCoursesByCategory(
  categorySlug: string,
  language?: LanguageCode,
) {
  const supabase = await createServerSupabaseClient()

  // Find the category
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('status', 'published')
    .single()
  if (catErr) return { data: [], error: catErr.message }

  // Find courses in that category
  const { data: courseCats } = await supabase
    .from('course_categories')
    .select('course_id')
    .eq('category_id', cat.id)

  const courseIds = (courseCats ?? []).map((cc: { course_id: string }) => cc.course_id)
  if (courseIds.length === 0) return { data: [], error: null }

  const { data: courses, error } = await supabase
    .from('courses')
    .select(
      `
      id, slug, status, difficulty, estimated_duration,
      default_language, published_at,
      translations:course_translations(
        id, language_code, title, short_description, status, learning_outcomes
      )
      `,
    )
    .in('id', courseIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  const result = (courses ?? []) as CourseWithTranslation[]
  const filtered = language
    ? result.map((c) => ({
        ...c,
        translations: c.translations.filter(
          (t) => t.language_code === language && t.status === 'published',
        ),
      }))
    : result

  return { data: filtered.filter((c) => c.translations.length > 0), error: null }
}

/** Get a single published course by slug, with curriculum (modules + lessons). */
export async function getPublishedCourseBySlug(
  slug: string,
  language?: LanguageCode,
) {
  const supabase = await createServerSupabaseClient()

  // 1. Get the course + translations
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select(
      `
      id, slug, status, difficulty, estimated_duration,
      default_language, published_at, last_reviewed_at, next_review_at,
      translations:course_translations(
        id, language_code, title, short_description, description,
        learning_outcomes, prerequisites, target_audience, status
      )
      `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (courseErr) {
    return { data: null, error: courseErr.message, code: courseErr.code }
  }

  // 2. Get modules for this course (published only)
  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .select('id, slug, sort_order, status')
    .eq('course_id', course.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (modErr) {
    return { data: null, error: modErr.message, code: modErr.code }
  }

  // 3. For each module, get translations + lessons
  const curriculum: CurriculumModule[] = []
  for (const mod of modules ?? []) {
    const [{ data: modTranslations }, { data: lessons }] = await Promise.all([
      supabase
        .from('module_translations')
        .select('language_code, title, description')
        .eq('module_id', mod.id)
        .eq('status', 'published'),
      supabase
        .from('lessons')
        .select(
          'id, slug, sort_order, lesson_type, duration_minutes, status',
        )
        .eq('module_id', mod.id)
        .eq('status', 'published')
        .order('sort_order', { ascending: true }),
    ])

    // For each lesson, get translations
    const lessonsWithTranslations = []
    for (const lesson of lessons ?? []) {
      const { data: lessonTrans } = await supabase
        .from('lesson_translations')
        .select('language_code, title, summary')
        .eq('lesson_id', lesson.id)
        .eq('status', 'published')

      lessonsWithTranslations.push({
        id: lesson.id,
        slug: lesson.slug,
        sort_order: lesson.sort_order,
        lesson_type: lesson.lesson_type,
        duration_minutes: lesson.duration_minutes,
        translations: lessonTrans ?? [],
      })
    }

    curriculum.push({
      id: mod.id,
      slug: mod.slug,
      sort_order: mod.sort_order,
      translations: modTranslations ?? [],
      lessons: lessonsWithTranslations,
    })
  }

  // Filter translations by language if specified
  const result: CourseWithCurriculum = {
    ...(course as CourseWithTranslation),
    modules: curriculum,
  }

  if (language) {
    result.translations = result.translations.filter(
      (t) => t.language_code === language && t.status === 'published',
    )
    result.modules = result.modules.map((m) => ({
      ...m,
      translations: m.translations.filter((t) => t.language_code === language),
      lessons: m.lessons.map((l) => ({
        ...l,
        translations: l.translations.filter(
          (t) => t.language_code === language,
        ),
      })),
    }))
  }

  // Fetch course categories (for breadcrumbs + related)
  const { data: courseCats } = await supabase
    .from('course_categories')
    .select(
      `category:categories(id, slug, translations:category_translations(language_code, name))`,
    )
    .eq('course_id', course.id)

  // Attach categories (typed loosely to avoid TS friction)
  ;(result as Record<string, unknown>).categories =
    (courseCats ?? []).map((cc: { category: unknown }) => cc.category)

  return { data: result, error: null, code: null }
}
