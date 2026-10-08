import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  Question,
  QuestionTranslation,
  QuestionOptionDB,
  PublicQuestion,
  PublicQuestionOption,
  Quiz,
  QuizTranslation,
  LanguageCode,
} from './assessment-types'
import type { LanguageCode as ContentLanguageCode } from '@/lib/content/types'

/**
 * assessmentService — reads published questions/quizzes and prepares
 * them for the learner. CRITICAL: `is_correct` is NEVER sent to the
 * client before an answer is submitted.
 *
 * Uses the server Supabase client (anon key, RLS on). Only published
 * questions/quizzes are readable.
 */

/** Get a published quiz by slug, with its questions (correct answers stripped). */
export async function getPublishedQuizBySlug(
  slug: string,
  language: LanguageCode = 'en',
) {
  const supabase = await createServerSupabaseClient()

  // 1. Get the quiz + translation
  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select('id, slug, lesson_id, status, passing_score, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (quizErr) return { data: null, error: quizErr.message }

  const { data: quizTrans } = await supabase
    .from('quiz_translations')
    .select('title, instructions')
    .eq('quiz_id', quiz.id)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()

  // 2. Get quiz_questions join
  const { data: quizQuestions, error: qqErr } = await supabase
    .from('quiz_questions')
    .select('question_id, sort_order')
    .eq('quiz_id', quiz.id)
    .order('sort_order', { ascending: true })
  if (qqErr) return { data: null, error: qqErr.message }

  // 3. For each question, get translation + options (strip is_correct)
  const questions: PublicQuestion[] = []
  for (const qq of quizQuestions ?? []) {
    const pubQ = await preparePublicQuestion(qq.question_id, language)
    if (pubQ) questions.push(pubQ)
  }

  return {
    data: {
      quiz: quiz as Quiz,
      translation: quizTrans as Pick<QuizTranslation, 'title' | 'instructions'> | null,
      questions,
    },
    error: null,
  }
}

/**
 * Build a PublicQuestion: translation + options with is_correct STRIPPED.
 * This is the only function that touches is_correct — it must never leak it.
 */
async function preparePublicQuestion(
  questionId: string,
  language: LanguageCode,
): Promise<PublicQuestion | null> {
  const supabase = await createServerSupabaseClient()

  // Question + translation
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, slug, question_type, difficulty, status, topic')
    .eq('id', questionId)
    .eq('status', 'published')
    .single<Question>()
  if (qErr || !question) return null

  const { data: trans } = await supabase
    .from('question_translations')
    .select('language_code, question_text, explanation')
    .eq('question_id', questionId)
    .eq('language_code', language)
    .eq('status', 'published')
    .single<QuestionTranslation>()

  // Options — fetch with is_correct (server-side only), then strip it
  const { data: rawOptions } = await supabase
    .from('question_options')
    .select('id, sort_order, text, is_correct')
    .eq('question_id', questionId)
    .order('sort_order', { ascending: true })

  const options: PublicQuestionOption[] = (rawOptions ?? []).map((o: QuestionOptionDB) => ({
    id: o.id,
    sort_order: o.sort_order,
    // Resolve the option text for the requested language, fallback to 'en'
    text: o.text?.[language] ?? o.text?.en ?? '',
  }))

  return {
    id: question.id,
    slug: question.slug,
    question_type: question.question_type,
    difficulty: question.difficulty,
    translation: {
      language_code: language,
      question_text: trans?.question_text ?? '',
      // Explanation is returned AFTER answering (see gradeAnswer), not here.
      // But we keep the field for type compatibility; set to null.
      explanation: null,
    },
    options,
  }
}

/** Grade a learner's answer for a single question. Returns correctness + explanation. */
export async function gradeAnswer(
  questionId: string,
  selectedOptionIds: string[],
  language: LanguageCode = 'en',
) {
  const supabase = await createServerSupabaseClient()

  // Fetch the question's options (server-side, RLS allows since question is published)
  const { data: options, error } = await supabase
    .from('question_options')
    .select('id, is_correct')
    .eq('question_id', questionId)

  if (error) return { data: null, error: error.message }

  const correctIds = (options ?? [])
    .filter((o: { is_correct: boolean; id: string }) => o.is_correct)
    .map((o: { id: string }) => o.id)

  const isCorrect =
    selectedOptionIds.length === correctIds.length &&
    selectedOptionIds.every((id) => correctIds.includes(id))

  // Fetch explanation
  const { data: trans } = await supabase
    .from('question_translations')
    .select('explanation')
    .eq('question_id', questionId)
    .eq('language_code', language)
    .single()

  return {
    data: {
      question_id: questionId,
      is_correct: isCorrect,
      correct_option_ids: correctIds,
      explanation: trans?.explanation ?? null,
    },
    error: null,
  }
}
