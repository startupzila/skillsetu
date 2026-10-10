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

  // Single nested query: course + translations + modules + module_translations
  // + lessons + lesson_translations + categories — replaces the old N+1 pattern
  // (was 1 + N_modules + N_modules×N_lessons queries; now 1 query total).
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select(
      `
      id, slug, status, difficulty, estimated_duration,
      default_language, published_at, last_reviewed_at, next_review_at,
      translations:course_translations(
        id, language_code, title, short_description, description,
        learning_outcomes, prerequisites, target_audience, status,
        seo_title, seo_description, seo_keywords, seo_faqs, seo_intro_paragraph
      ),
      modules:modules(
        id, slug, sort_order, status,
        translations:module_translations(
          language_code, title, description, status
        ),
        lessons:lessons(
          id, slug, sort_order, lesson_type, duration_minutes, status,
          translations:lesson_translations(
            language_code, title, summary, status
          )
        )
      ),
      course_categories(
        category:categories(
          id, slug,
          translations:category_translations(language_code, name)
        )
      )
      `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (courseErr) {
    return { data: null, error: courseErr.message, code: courseErr.code }
  }

  // Filter to published modules + lessons (nested filter happens in JS —
  // one round-trip vs N+1 queries is a massive win)
  type RawModule = {
    id: string
    slug: string
    sort_order: number
    status: string
    translations: { language_code: string; title: string; description: string | null; status: string }[]
    lessons: {
      id: string
      slug: string
      sort_order: number
      lesson_type: string
      duration_minutes: number | null
      status: string
      translations: { language_code: string; title: string; summary: string | null; status: string }[]
    }[]
  }

  const curriculum: CurriculumModule[] = ((course as Record<string, unknown>).modules as RawModule[] ?? [])
    .filter((m) => m.status === 'published')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((mod) => ({
      id: mod.id,
      slug: mod.slug,
      sort_order: mod.sort_order,
      translations: (mod.translations ?? []).filter((t) => t.status === 'published'),
      lessons: (mod.lessons ?? [])
        .filter((l) => l.status === 'published')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          sort_order: lesson.sort_order,
          lesson_type: lesson.lesson_type as LessonType,
          duration_minutes: lesson.duration_minutes,
          translations: (lesson.translations ?? []).filter((t) => t.status === 'published'),
        })),
    }))

  // Extract categories from the nested course_categories join
  const rawCourseCats = (course as Record<string, unknown>).course_categories as
    | { category: { id: string; slug: string; translations: { language_code: string; name: string }[] } }[]
    | undefined

  // Build the result — modules is our filtered curriculum (NOT the raw nested
  // array from the query). Do NOT delete it.
  const result: CourseWithCurriculum = {
    ...(course as unknown as CourseWithTranslation),
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

  // Attach categories (for breadcrumbs + related)
  ;(result as Record<string, unknown>).categories =
    (rawCourseCats ?? []).map((cc) => cc.category)

  return { data: result, error: null, code: null }
}
