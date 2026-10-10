import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeFetch } from '@/lib/safe-fetch'

/**
 * Quiz listing service — lists all published quizzes for the /quizzes index page.
 * Returns quizzes with their course/lesson context, translations, and question count.
 */

export interface QuizListItem {
  id: string
  slug: string
  passing_score: number
  question_count: number
  lesson_id: string | null
  lesson_slug: string | null
  module_slug: string | null
  course_slug: string | null
  course_title: string | null
  translation: {
    title: string
    instructions: string | null
  } | null
}

export async function listPublishedQuizzes(language: string = 'en'): Promise<QuizListItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      id, slug, passing_score, lesson_id, status,
      translations:quiz_translations(
        language_code, title, instructions, status
      ),
      lesson:lessons(
        id, slug,
        module:modules(
          slug,
          course:courses(
            slug,
            translations:course_translations(language_code, title)
          )
        )
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) return []

  const items: QuizListItem[] = []
  for (const quiz of data ?? []) {
    const trans = (quiz.translations ?? []).find(
      (t: { language_code: string; status: string }) => t.language_code === language && t.status === 'published',
    )
    if (!trans) continue

    // Count questions via quiz_questions
    const { count } = await supabase
      .from('quiz_questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id)

    const lesson = quiz.lesson as
      | { id: string; slug: string; module: { slug: string; course: { slug: string; translations: { language_code: string; title: string }[] } | null } | null }
      | null

    const courseTrans = lesson?.module?.course?.translations?.find(
      (t: { language_code: string }) => t.language_code === language,
    )

    items.push({
      id: quiz.id,
      slug: quiz.slug,
      passing_score: quiz.passing_score,
      question_count: count ?? 0,
      lesson_id: quiz.lesson_id,
      lesson_slug: lesson?.slug ?? null,
      module_slug: lesson?.module?.slug ?? null,
      course_slug: lesson?.module?.course?.slug ?? null,
      course_title: courseTrans?.title ?? null,
      translation: {
        title: trans.title,
        instructions: trans.instructions,
      },
    })
  }

  return items
}

/** Get related quizzes (same course, excluding the current one). */
export async function getRelatedQuizzes(
  currentQuizId: string,
  courseSlug: string | null,
  language: string = 'en',
  limit: number = 4,
): Promise<QuizListItem[]> {
  if (!courseSlug) return []
  const all = await safeFetch(() => listPublishedQuizzes(language))
  return (all ?? [])
    .filter((q) => q.id !== currentQuizId && q.course_slug === courseSlug)
    .slice(0, limit)
}

/** Get the latest quizzes (most recently published). */
export async function getLatestQuizzes(
  language: string = 'en',
  limit: number = 4,
): Promise<QuizListItem[]> {
  const all = await safeFetch(() => listPublishedQuizzes(language))
  return (all ?? []).slice(0, limit)
}

/** Get trending quizzes (most attempted — for MVP, just return latest as a fallback). */
export async function getTrendingQuizzes(
  language: string = 'en',
  limit: number = 4,
): Promise<QuizListItem[]> {
  // TODO: when attempt counts are available, sort by attempt_count desc.
  // For now, return a different slice than latest.
  const all = await safeFetch(() => listPublishedQuizzes(language))
  return (all ?? []).slice(4, 4 + limit)
}

/** Get the next lesson's quiz (for the "next quiz" button after completing a lesson quiz). */
export async function getNextLessonQuiz(
  currentLessonId: string,
  courseSlug: string,
  language: string = 'en',
): Promise<QuizListItem | null> {
  const supabase = await createServerSupabaseClient()

  // Find the course
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()
  if (!course) return null

  // Find all modules + lessons in order
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      lessons(id, slug)
    `)
    .eq('course_id', course.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  // Flatten all lessons
  const allLessons = (modules ?? []).flatMap(
    (m: { lessons: { id: string; slug: string }[] }) =>
      (m.lessons ?? []).map((l) => ({ id: l.id, slug: l.slug })),
  )

  // Find current lesson index
  const currentIdx = allLessons.findIndex((l) => l.id === currentLessonId)
  if (currentIdx < 0 || currentIdx >= allLessons.length - 1) return null

  // Find next lesson
  const nextLesson = allLessons[currentIdx + 1]

  // Find quiz attached to next lesson
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, slug, passing_score, lesson_id, status')
    .eq('lesson_id', nextLesson.id)
    .eq('status', 'published')
    .single()

  if (!quiz) return null

  const { data: trans } = await supabase
    .from('quiz_translations')
    .select('title, instructions')
    .eq('quiz_id', quiz.id)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()

  const { count } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quiz.id)

  return {
    id: quiz.id,
    slug: quiz.slug,
    passing_score: quiz.passing_score,
    question_count: count ?? 0,
    lesson_id: quiz.lesson_id,
    lesson_slug: nextLesson.slug,
    module_slug: (modules ?? []).find((m: { lessons: { id: string }[] }) =>
      m.lessons?.some((l) => l.id === nextLesson.id),
    )?.id ?? null,
    course_slug: courseSlug,
    course_title: null,
    translation: trans ? { title: trans.title, instructions: trans.instructions } : null,
  }
}
