import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * searchService — full-text search over published content.
 *
 * Uses PostgreSQL ILIKE for MVP (simple, works without dedicated
 * search tables). Searches across:
 *   - courses (title, short_description)
 *   - lessons (title, summary)
 *   - questions (question_text)
 *   - categories / skills (name, description)
 *   - centres (name, description)
 *   - course_resources / PDFs (title, description)
 *
 * Future: upgrade to tsvector full-text search or dedicated search
 * engine (Meilisearch/Typesense) when scale requires.
 */

export interface SearchResult {
  type: 'course' | 'lesson' | 'question' | 'skill' | 'centre' | 'pdf'
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

/** Escape a query for safe use in ILIKE patterns. */
function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, '\\$&')
}

/**
 * Search published content. Returns results grouped by type.
 */
export async function search(
  query: string,
  language: string = 'en',
  limit: number = 30,
): Promise<SearchResponse> {
  const supabase = await createServerSupabaseClient()
  const q = escapeIlike(query.trim())
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

  for (const course of courses ?? []) {
    const t = (course.translations ?? []).find(
      (tr: { language_code: string }) => tr.language_code === language,
    )
    if (!t) continue
    const titleMatch = (t.title ?? '').toLowerCase().includes(q.toLowerCase())
    const descMatch = (t.short_description ?? '').toLowerCase().includes(q.toLowerCase())
    if (!titleMatch && !descMatch) continue
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

  for (const lt of lessons ?? []) {
    const titleMatch = (lt.title ?? '').toLowerCase().includes(q.toLowerCase())
    const summaryMatch = (lt.summary ?? '').toLowerCase().includes(q.toLowerCase())
    if (!titleMatch && !summaryMatch) continue
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

  // 3. Search categories / skills
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      id, slug,
      translations:category_translations(
        language_code, name, description
      )
    `)
    .eq('status', 'published')

  for (const cat of categories ?? []) {
    const t = (cat.translations ?? []).find(
      (tr: { language_code: string }) => tr.language_code === language,
    )
    if (!t) continue
    const nameMatch = (t.name ?? '').toLowerCase().includes(q.toLowerCase())
    const descMatch = (t.description ?? '').toLowerCase().includes(q.toLowerCase())
    if (!nameMatch && !descMatch) continue
    results.push({
      type: 'skill',
      id: cat.id,
      slug: cat.slug,
      title: t.name,
      excerpt: t.description ?? '',
      url: `/skills/${cat.slug}`,
    })
  }

  // 4. Search centres
  const { data: centres } = await supabase
    .from('centres')
    .select('id, slug, name, description')
    .eq('status', 'published')

  for (const centre of centres ?? []) {
    const nameMatch = (centre.name ?? '').toLowerCase().includes(q.toLowerCase())
    const descMatch = (centre.description ?? '').toLowerCase().includes(q.toLowerCase())
    if (!nameMatch && !descMatch) continue
    results.push({
      type: 'centre',
      id: centre.id,
      slug: centre.slug,
      title: centre.name,
      excerpt: centre.description ?? '',
      url: `/centres/${centre.slug}`,
    })
  }

  // 5. Search course resources / PDFs
  const { data: resources } = await supabase
    .from('course_resources')
    .select(`
      id, slug, resource_type,
      course:courses(slug),
      translations:course_resource_translations(
        language_code, title, description
      )
    `)
    .eq('status', 'published')

  for (const res of resources ?? []) {
    const t = (res.translations ?? []).find(
      (tr: { language_code: string }) => tr.language_code === language,
    )
    if (!t) continue
    const titleMatch = (t.title ?? '').toLowerCase().includes(q.toLowerCase())
    const descMatch = (t.description ?? '').toLowerCase().includes(q.toLowerCase())
    if (!titleMatch && !descMatch) continue
    const courseSlug = (res.course as { slug: string } | null)?.slug
    results.push({
      type: 'pdf',
      id: res.id,
      slug: res.slug,
      title: t.title,
      excerpt: t.description ?? '',
      url: courseSlug ? `/courses/${courseSlug}/pdf` : '/pdf-store',
    })
  }

  // Limit total
  const limited = results.slice(0, limit)

  return { query, results: limited, total: limited.length }
}
