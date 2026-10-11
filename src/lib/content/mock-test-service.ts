import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeFetch } from '@/lib/safe-fetch'
import type { PublicQuestion } from '@/lib/learning/assessment-types'

/**
 * Public mock-test content service.
 *
 * Mirrors the assessment-service.ts getPublishedQuizBySlug pattern but for
 * mock_tests + test_translations + test_questions. Correct answers are
 * STRIPPED before being sent to the client — only the existing
 * /api/quiz/attempts endpoint grades answers server-side.
 */

export interface MockTestListItem {
  id: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit_minutes: number | null
  question_count: number
  passing_score: number
  attempts_allowed: number | null
  course_slug: string | null
  course_title: string | null
  translation: {
    title: string
    instructions: string | null
  } | null
}

export interface MockTestDetail {
  test: {
    id: string
    slug: string
    time_limit_minutes: number | null
    passing_score: number
    difficulty: 'easy' | 'medium' | 'hard'
    attempts_allowed: number | null
  }
  translation: {
    title: string
    instructions: string | null
  } | null
  questions: PublicQuestion[]
}

/** List all published mock tests, with translations + course context. */
export async function listPublishedMockTests(
  language: string = 'en',
): Promise<MockTestListItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('mock_tests')
    .select(
      `id, slug, difficulty, time_limit_minutes, question_count,
       passing_score, attempts_allowed, status,
       translations:test_translations(language_code, title, instructions, status),
       course:courses(slug, translations:course_translations(language_code, title))`,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (error) return []

  const items: MockTestListItem[] = []
  for (const test of data ?? []) {
    const trans = (test.translations ?? []).find(
      (t: { language_code: string; status: string }) =>
        t.language_code === language && t.status === 'published',
    )
    if (!trans) continue

    // Count questions via test_questions (more accurate than the column).
    const { count } = await supabase
      .from('test_questions')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', test.id)

    const course = test.course as
      | {
          slug: string
          translations: { language_code: string; title: string }[] | null
        }
      | null

    const courseTrans = course?.translations?.find(
      (t: { language_code: string }) => t.language_code === language,
    )

    items.push({
      id: test.id,
      slug: test.slug,
      difficulty: (test.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard',
      time_limit_minutes: test.time_limit_minutes,
      question_count: count ?? test.question_count ?? 0,
      passing_score: test.passing_score,
      attempts_allowed: test.attempts_allowed,
      course_slug: course?.slug ?? null,
      course_title: courseTrans?.title ?? null,
      translation: {
        title: trans.title,
        instructions: trans.instructions,
      },
    })
  }

  return items
}

/** Get a published mock test by slug, with its questions (correct answers stripped). */
export async function getPublishedMockTestBySlug(
  slug: string,
  language: 'en' | 'hi' = 'en',
): Promise<{ data: MockTestDetail | null; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  // 1. Get the test + translation
  const { data: test, error: tErr } = await supabase
    .from('mock_tests')
    .select(
      `id, slug, time_limit_minutes, passing_score, difficulty,
       attempts_allowed, status, published_at`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (tErr) return { data: null, error: tErr.message }

  const { data: testTrans } = await supabase
    .from('test_translations')
    .select('title, instructions')
    .eq('test_id', test.id)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()

  // 2. Get test_questions join
  const { data: testQuestions, error: tqErr } = await supabase
    .from('test_questions')
    .select('question_id, sort_order')
    .eq('test_id', test.id)
    .order('sort_order', { ascending: true })
  if (tqErr) return { data: null, error: tqErr.message }

  // 3. For each question, get translation + options (strip is_correct)
  const questions: PublicQuestion[] = []
  for (const tq of testQuestions ?? []) {
    const pubQ = await preparePublicQuestion(tq.question_id, language)
    if (pubQ) questions.push(pubQ)
  }

  return {
    data: {
      test: {
        id: test.id,
        slug: test.slug,
        time_limit_minutes: test.time_limit_minutes,
        passing_score: test.passing_score,
        difficulty: (test.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard',
        attempts_allowed: test.attempts_allowed,
      },
      translation: testTrans
        ? {
            title: testTrans.title,
            instructions: testTrans.instructions,
          }
        : null,
      questions,
    },
    error: null,
  }
}

/**
 * Build a PublicQuestion: translation + options with is_correct STRIPPED.
 * Mirrors assessment-service.ts preparePublicQuestion (kept private there).
 */
async function preparePublicQuestion(
  questionId: string,
  language: 'en' | 'hi',
): Promise<PublicQuestion | null> {
  const supabase = await createServerSupabaseClient()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, slug, question_type, difficulty, status, topic')
    .eq('id', questionId)
    .eq('status', 'published')
    .single()
  if (qErr || !question) return null

  const { data: trans } = await supabase
    .from('question_translations')
    .select('language_code, question_text, explanation')
    .eq('question_id', questionId)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()

  const { data: rawOptions } = await supabase
    .from('question_options')
    .select('id, sort_order, text, is_correct')
    .eq('question_id', questionId)
    .order('sort_order', { ascending: true })

  const options = (rawOptions ?? []).map(
    (o: {
      id: string
      sort_order: number
      text: Record<string, string> | null
      is_correct: boolean
    }) => ({
      id: o.id,
      sort_order: o.sort_order,
      text: o.text?.[language] ?? o.text?.en ?? '',
    }),
  )

  return {
    id: question.id,
    slug: question.slug,
    question_type: question.question_type,
    difficulty: question.difficulty,
    translation: {
      language_code: language,
      question_text: trans?.question_text ?? '',
      explanation: null,
    },
    options,
  }
}

/** Safe wrapper used by the public /mock-tests index page. */
export async function safeListPublishedMockTests(
  language: 'en' | 'hi',
): Promise<MockTestListItem[] | null> {
  return safeFetch(() => listPublishedMockTests(language))
}
