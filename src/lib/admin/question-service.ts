import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Admin question service — CRUD for questions, options, and quiz-question links.
 *
 * @see prisma/schema.prisma (Assessment section)
 */

// ── QUESTIONS ───────────────────────────────────────────────

export interface QuestionInput {
  slug: string
  question_type?: string
  difficulty?: string
  topic?: string
  lesson_id?: string | null
  // EN translation
  question_text: string
  explanation?: string
  model_answer?: string // HTML — for descriptive questions
  // Options (MCQ only; empty for descriptive)
  options: Array<{
    text: { en: string; hi?: string }
    is_correct: boolean
  }>
}

/** List all questions (including drafts). */
export async function adminListQuestions() {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('questions')
    .select(
      `id, slug, question_type, difficulty, status, topic, published_at, created_at,
       translations:question_translations(language_code, question_text, status),
       options:question_options(id, sort_order, is_correct)`,
    )
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single question with translation + options. */
export async function adminGetQuestion(questionId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data: question, error: qErr } = await admin
    .from('questions')
    .select('id, slug, question_type, difficulty, status, topic, lesson_id')
    .eq('id', questionId)
    .single()
  if (qErr) return { data: null, error: qErr.message }

  const { data: trans } = await admin
    .from('question_translations')
    .select('id, language_code, question_text, explanation, status')
    .eq('question_id', questionId)
    .eq('language_code', 'en')
    .single()

  const { data: options } = await admin
    .from('question_options')
    .select('id, sort_order, text, is_correct')
    .eq('question_id', questionId)
    .order('sort_order', { ascending: true })

  return {
    data: {
      ...question,
      translation: trans,
      options: options ?? [],
    },
    error: null,
  }
}

/** Create a question with EN translation + options. */
export async function adminCreateQuestion(input: QuestionInput) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data: question, error: qErr } = await admin
    .from('questions')
    .insert({
      slug: input.slug,
      question_type: input.question_type ?? 'single_choice',
      difficulty: input.difficulty ?? 'easy',
      topic: input.topic ?? null,
      lesson_id: input.lesson_id ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (qErr) return { data: null, error: qErr.message }

  // Insert EN translation
  const { error: tErr } = await admin.from('question_translations').insert({
    question_id: question.id,
    language_code: 'en',
    question_text: input.question_text,
    explanation: input.explanation ?? null,
    model_answer: input.model_answer ?? null,
    status: 'draft',
  })
  if (tErr) return { data: null, error: tErr.message }

  // Insert options (MCQ types only)
  const mcqTypes = ['single_choice', 'multiple_choice', 'true_false']
  if (mcqTypes.includes(input.question_type ?? 'single_choice') && input.options.length > 0) {
    const { error: oErr } = await admin.from('question_options').insert(
      input.options.map((opt, i) => ({
        question_id: question.id,
        sort_order: i + 1,
        text: opt.text,
        is_correct: opt.is_correct,
      })),
    )
    if (oErr) return { data: null, error: oErr.message }
  }

  await recordAudit({ action: 'question.create', entityType: 'question', entityId: question.id })
  return { data: question, error: null }
}

/** Update a question's core fields. */
export async function adminUpdateQuestion(
  questionId: string,
  updates: { question_type?: string; difficulty?: string; topic?: string | null; status?: string; lesson_id?: string | null },
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update question translation (text + explanation + model_answer). */
export async function adminUpdateQuestionTranslation(
  translationId: string,
  updates: { question_text?: string; explanation?: string | null; model_answer?: string | null },
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('question_translations')
    .update(updates)
    .eq('id', translationId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update or create an option. */
export async function adminUpdateOption(
  optionId: string,
  updates: { text?: Record<string, string>; is_correct?: boolean; sort_order?: number },
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('question_options')
    .update(updates)
    .eq('id', optionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a new option (used when adding options inline). */
export async function adminCreateOption(
  questionId: string,
  option: { text: { en: string; hi?: string }; is_correct: boolean },
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('question_options')
    .select('sort_order')
    .eq('question_id', questionId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = (existing && existing.length > 0 ? (existing[0] as { sort_order: number }).sort_order : 0) + 1

  const { data, error } = await admin
    .from('question_options')
    .insert({
      question_id: questionId,
      sort_order: nextOrder,
      text: option.text,
      is_correct: option.is_correct,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Delete an option. */
export async function adminDeleteOption(optionId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()
  const { error } = await admin.from('question_options').delete().eq('id', optionId)
  if (error) return { error: error.message }
  return { error: null }
}

/** List all questions attached to a lesson (for the integrated lesson editor). */
export async function adminListQuestionsForLesson(lessonId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('questions')
    .select(
      `id, slug, question_type, difficulty, status, topic, published_at, created_at,
       translations:question_translations(id, language_code, question_text, explanation, model_answer, status),
       options:question_options(id, sort_order, text, is_correct)`,
    )
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Delete a question. */
export async function adminDeleteQuestion(questionId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { error } = await admin.from('questions').delete().eq('id', questionId)
  if (error) return { error: error.message }
  await recordAudit({ action: 'question.delete', entityType: 'question', entityId: questionId })
  return { error: null }
}

/** Publish a question. */
export async function adminPublishQuestion(questionId: string) {
  await requirePermission('question.review')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('questions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'question.publish', entityType: 'question', entityId: questionId })
  return { data, error: null }
}

// ── QUIZZES ─────────────────────────────────────────────────

/** List all quizzes. */
export async function adminListQuizzes() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('quizzes')
    .select(
      `id, slug, status, passing_score, published_at, created_at,
       translations:quiz_translations(language_code, title, status),
       lesson:lessons(id, slug)`,
    )
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get questions linked to a quiz. */
export async function adminListQuizQuestions(quizId: string) {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('quiz_questions')
    .select(
      `id, sort_order,
       question:questions(id, slug, question_type, difficulty, status,
         translations:question_translations(language_code, question_text))`,
    )
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Link a question to a quiz. */
export async function adminAddQuestionToQuiz(quizId: string, questionId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Get next sort_order
  const { data: existing } = await admin
    .from('quiz_questions')
    .select('sort_order')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing && existing.length > 0 ? (existing[0] as { sort_order: number }).sort_order : 0) + 1

  const { data, error } = await admin
    .from('quiz_questions')
    .insert({ quiz_id: quizId, question_id: questionId, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Remove a question from a quiz. */
export async function adminRemoveQuestionFromQuiz(quizId: string, questionId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { error } = await admin
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', quizId)
    .eq('question_id', questionId)

  if (error) return { error: error.message }
  return { error: null }
}
