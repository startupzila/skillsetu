import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * searchService — full-text search over published content.
 *
 * Uses PostgreSQL ILIKE for MVP (simple, works without dedicated
 * search tables). Searches across:
 *   - courses (title, short_description)
 *   - lessons (title, summary)
 *   - questions (question_text)
 *
 * Future: upgrade to tsvector full-text search or dedicated search
 * engine (Meilisearch/Typesense) when scale requires.
 *
 * @see docs/architecture.md §"Search"
 */

export interface SearchResult {
  type: 'course' | 'lesson' | 'question'
  id: string
  slug: string
  title: string
  excerpt: string
  url: string
  meta?: {
    difficulty?: string
    duration?: number | null
  }
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
}

/**
 * Search published content. Returns results grouped by type.
 */
export async function search(
  query: string,
  language: string = 'en',
  limit: number = 20,
): Promise<SearchResponse> {
  const supabase = await createServerSupabaseClient()
  const q = query.trim()
  if (!q) return { query, results: [], total: 0 }

  const results: SearchResult[] = []

  // 1. Search courses
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, slug, difficulty, estimated_duration,
      translations:course_translations(
        language_code, title, short_description
      )
    `)
    .eq('status', 'published')
    .or(
      `translations.title.ilike.%${q}%,translations.short_description.ilike.%${q}%`,
    )

  for (const course of courses ?? []) {
    const t = (course.translations ?? []).find(
      (tr: { language_code: string }) => tr.language_code === language,
    )
    if (!t) continue
    results.push({
      type: 'course',
      id: course.id,
      slug: course.slug,
      title: t.title,
      excerpt: t.short_description ?? '',
      url: `/courses/${course.slug}`,
      meta: {
        difficulty: course.difficulty,
        duration: course.estimated_duration,
      },
    })
  }

  // 2. Search lessons (via lesson_translations)
  const { data: lessons } = await supabase
    .from('lesson_translations')
    .select(`
      title, summary,
      lesson:lessons(
        id, slug, duration_minutes,
        module:modules(
          slug,
          course:courses(slug)
        )
      )
    `)
    .eq('language_code', language)
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .limit(limit)

  for (const lt of lessons ?? []) {
    const lesson = lt.lesson as
      | { id: string; slug: string; duration_minutes: number | null; module: { slug: string; course: { slug: string } | null } | null }
      | null
    if (!lesson) continue
    const courseSlug = lesson.module?.course?.slug
    if (!courseSlug) continue
    results.push({
      type: 'lesson',
      id: lesson.id,
      slug: lesson.slug,
      title: lt.title,
      excerpt: lt.summary ?? '',
      url: `/courses/${courseSlug}/${lesson.module!.slug}/${lesson.slug}`,
      meta: { duration: lesson.duration_minutes },
    })
  }

  // 3. Search questions
  const { data: questions } = await supabase
    .from('question_translations')
    .select(`
      question_text,
      question:questions(slug)
    `)
    .eq('language_code', language)
    .eq('status', 'published')
    .ilike('question_text', `%${q}%`)
    .limit(5)

  for (const qt of questions ?? []) {
    const question = qt.question as { slug: string } | null
    if (!question) continue
    results.push({
      type: 'question',
      id: question.slug,
      slug: question.slug,
      title: qt.question_text,
      excerpt: 'Practice question',
      url: `/quiz/excel-intro-quiz`,
    })
  }

  // Limit total
  const limited = results.slice(0, limit)

  return { query, results: limited, total: limited.length }
}
