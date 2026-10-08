import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { LessonPageData, LanguageCode } from './types'

/**
 * lessonService — reads published lessons with their content blocks.
 *
 * A lesson is fetched by course_slug + lesson_slug (URL-style lookup).
 * Returns the translation for the requested language, plus ordered blocks.
 * Prev/next lesson slugs are computed within the same module.
 */

/** Get a published lesson by course slug + lesson slug, with blocks. */
export async function getPublishedLessonBySlug(
  courseSlug: string,
  lessonSlug: string,
  language: LanguageCode = 'en',
): Promise<{ data: LessonPageData | null; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  // 1. Find the course
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('id, slug')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()
  if (courseErr) return { data: null, error: courseErr.message }

  // 2. Find the lesson via modules that belong to this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug')
    .eq('course_id', course.id)
    .eq('status', 'published')

  if (!modules || modules.length === 0)
    return { data: null, error: 'No modules found for course' }

  const moduleIds = modules.map((m) => m.id)

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select(
      'id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at',
    )
    .in('module_id', moduleIds)
    .eq('slug', lessonSlug)
    .eq('status', 'published')
    .single()
  if (lessonErr) return { data: null, error: lessonErr.message }

  // 3. Find the module (for slug + prev/next)
  const lessonModule = modules.find((m) => m.id === lesson.module_id)!

  // 4. Get the lesson translation for the requested language
  const { data: translation, error: transErr } = await supabase
    .from('lesson_translations')
    .select(
      'id, lesson_id, language_code, title, summary, status, translator_id, reviewer_id, created_at, updated_at',
    )
    .eq('lesson_id', lesson.id)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()
  if (transErr) return { data: null, error: transErr.message }

  // 5. Get blocks (ordered)
  const { data: blocks, error: blocksErr } = await supabase
    .from('lesson_blocks')
    .select('id, lesson_translation_id, block_type, sort_order, data, created_at, updated_at')
    .eq('lesson_translation_id', translation.id)
    .order('sort_order', { ascending: true })
  if (blocksErr) return { data: null, error: blocksErr.message }

  // 6. Prev/next lesson within the same module
  const { data: siblings } = await supabase
    .from('lessons')
    .select('slug, sort_order')
    .eq('module_id', lesson.module_id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  let prevLesson: { slug: string } | null = null
  let nextLesson: { slug: string } | null = null
  if (siblings) {
    const idx = siblings.findIndex((s) => s.slug === lesson.slug)
    if (idx > 0) prevLesson = { slug: siblings[idx - 1].slug }
    if (idx >= 0 && idx < siblings.length - 1)
      nextLesson = { slug: siblings[idx + 1].slug }
  }

  return {
    data: {
      lesson: lesson as LessonPageData['lesson'],
      translation: translation as LessonPageData['translation'],
      blocks: (blocks ?? []) as LessonPageData['blocks'],
      course: { id: course.id, slug: course.slug },
      module: { id: lessonModule.id, slug: lessonModule.slug },
      prevLesson,
      nextLesson,
    },
    error: null,
  }
}
