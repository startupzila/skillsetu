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

/** Update question translation (text + explanation + model_answer).
 *
 *  Supports two flows:
 *   (a) Standard update by translation id — used when the translation already
 *       exists (e.g. editing the EN translation).
 *   (b) Upsert by (question_id, language_code) — used by the lesson editor's
 *       Hindi tab to create the HI translation on first save. The caller
 *       passes `question_id` and `language_code` inside `updates`; the
 *       `translationId` arg is ignored in this path.
 */
export async function adminUpdateQuestionTranslation(
  translationId: string,
  updates: {
    question_text?: string
    explanation?: string | null
    model_answer?: string | null
    question_id?: string
    language_code?: string
  },
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Upsert by (question_id, language_code)
  if (updates.question_id && updates.language_code) {
    const { question_id, language_code, ...fields } = updates
    const { data: existing } = await admin
      .from('question_translations')
      .select('id')
      .eq('question_id', question_id)
      .eq('language_code', language_code)
      .maybeSingle()

    if (existing) {
      const { data, error } = await admin
        .from('question_translations')
        .update(fields)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return { data: null, error: error.message }
      return { data, error: null }
    }

    const { data, error } = await admin
      .from('question_translations')
      .insert({
        question_id,
        language_code,
        question_text: fields.question_text ?? '',
        explanation: fields.explanation ?? null,
        model_answer: fields.model_answer ?? null,
        status: 'draft',
      })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  }

  // Standard update by id
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

// ── QUIZ CRUD (create / update / delete / list-for-lesson) ─────────────

export interface AdminQuizInput {
  lesson_id?: string
  module_id?: string
  course_id?: string
  slug: string
  passing_score?: number
  title_en: string
  title_hi?: string
  instructions_en?: string
  instructions_hi?: string
}

/** Create a quiz with EN + (optional) HI translations.
 *  The quiz row starts in `draft` status. Use `adminPublishQuiz` to publish. */
export async function adminCreateQuiz(input: AdminQuizInput) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data: quiz, error: qErr } = await admin
    .from('quizzes')
    .insert({
      slug: input.slug,
      lesson_id: input.lesson_id ?? null,
      module_id: input.module_id ?? null,
      course_id: input.course_id ?? null,
      status: 'draft',
      passing_score: input.passing_score ?? 60,
    })
    .select()
    .single()
  if (qErr) return { data: null, error: qErr.message }

  // Insert EN translation (always required)
  const { error: enErr } = await admin.from('quiz_translations').insert({
    quiz_id: quiz.id,
    language_code: 'en',
    title: input.title_en,
    instructions: input.instructions_en ?? null,
    status: 'draft',
  })
  if (enErr) return { data: null, error: enErr.message }

  // Insert HI translation (if provided)
  if (input.title_hi || input.instructions_hi) {
    const { error: hiErr } = await admin.from('quiz_translations').insert({
      quiz_id: quiz.id,
      language_code: 'hi',
      title: input.title_hi ?? input.title_en,
      instructions: input.instructions_hi ?? null,
      status: 'draft',
    })
    if (hiErr) return { data: null, error: hiErr.message }
  }

  await recordAudit({ action: 'quiz.create', entityType: 'quiz', entityId: quiz.id })
  return { data: quiz, error: null }
}

export interface AdminQuizUpdate {
  passing_score?: number
  status?: string
  course_id?: string | null
  title_en?: string
  title_hi?: string
  instructions_en?: string | null
  instructions_hi?: string | null
}

/** Update a quiz's core fields + (optional) EN/HI translations.
 *  - Translations are upserted by (quiz_id, language_code). If a translation
 *    row doesn't exist yet (e.g. adding HI to a quiz that only had EN), it's
 *    created on the fly.
 */
export async function adminUpdateQuiz(quizId: string, updates: AdminQuizUpdate) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Core quiz fields (passing_score, status, course_id)
  const core: Record<string, unknown> = {}
  if (typeof updates.passing_score === 'number') core.passing_score = updates.passing_score
  if (typeof updates.status === 'string') core.status = updates.status
  if (typeof updates.course_id !== 'undefined') core.course_id = updates.course_id
  if (Object.keys(core).length > 0) {
    const { error } = await admin.from('quizzes').update(core).eq('id', quizId)
    if (error) return { data: null, error: error.message }
  }

  // EN translation upsert
  if (
    typeof updates.title_en === 'string' ||
    typeof updates.instructions_en !== 'undefined'
  ) {
    const { data: existing } = await admin
      .from('quiz_translations')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('language_code', 'en')
      .maybeSingle()

    const fields: Record<string, unknown> = {}
    if (typeof updates.title_en === 'string') fields.title = updates.title_en
    if (typeof updates.instructions_en !== 'undefined')
      fields.instructions = updates.instructions_en

    if (existing) {
      const { error } = await admin
        .from('quiz_translations')
        .update(fields)
        .eq('id', existing.id)
      if (error) return { data: null, error: error.message }
    } else {
      const { error } = await admin.from('quiz_translations').insert({
        quiz_id: quizId,
        language_code: 'en',
        title: typeof updates.title_en === 'string' ? updates.title_en : '',
        instructions: updates.instructions_en ?? null,
        status: 'draft',
      })
      if (error) return { data: null, error: error.message }
    }
  }

  // HI translation upsert
  if (
    typeof updates.title_hi === 'string' ||
    typeof updates.instructions_hi !== 'undefined'
  ) {
    const { data: existing } = await admin
      .from('quiz_translations')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('language_code', 'hi')
      .maybeSingle()

    const fields: Record<string, unknown> = {}
    if (typeof updates.title_hi === 'string') fields.title = updates.title_hi
    if (typeof updates.instructions_hi !== 'undefined')
      fields.instructions = updates.instructions_hi

    if (existing) {
      const { error } = await admin
        .from('quiz_translations')
        .update(fields)
        .eq('id', existing.id)
      if (error) return { data: null, error: error.message }
    } else {
      const { error } = await admin.from('quiz_translations').insert({
        quiz_id: quizId,
        language_code: 'hi',
        title:
          typeof updates.title_hi === 'string'
            ? updates.title_hi
            : (updates.title_en ?? ''),
        instructions: updates.instructions_hi ?? null,
        status: 'draft',
      })
      if (error) return { data: null, error: error.message }
    }
  }

  await recordAudit({ action: 'quiz.update', entityType: 'quiz', entityId: quizId })

  // Re-fetch + return the updated quiz with translations.
  const { data, error } = await admin
    .from('quizzes')
    .select(
      `id, slug, status, passing_score, published_at, created_at, course_id,
       translations:quiz_translations(id, language_code, title, instructions, status),
       course:courses(id, slug,
         translations:course_translations(language_code, title, status)),
       lesson:lessons(id, slug)`,
    )
    .eq('id', quizId)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Publish a quiz + all of its translations. */
export async function adminPublishQuiz(quizId: string) {
  await requirePermission('question.review')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('quizzes')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', quizId)
    .select()
    .single()
  if (error) return { data: null, error: error.message }

  // Publish all translations as well.
  await admin
    .from('quiz_translations')
    .update({ status: 'published' })
    .eq('quiz_id', quizId)

  await recordAudit({ action: 'quiz.publish', entityType: 'quiz', entityId: quizId })
  return { data, error: null }
}

/** Delete a quiz (cascade handles translations + quiz_questions). */
export async function adminDeleteQuiz(quizId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Clean up join rows first (some Supabase configs don't cascade).
  await admin.from('quiz_questions').delete().eq('quiz_id', quizId)
  await admin.from('quiz_translations').delete().eq('quiz_id', quizId)

  const { error } = await admin.from('quizzes').delete().eq('id', quizId)
  if (error) return { error: error.message }
  await recordAudit({ action: 'quiz.delete', entityType: 'quiz', entityId: quizId })
  return { error: null }
}

/** List quizzes attached to a lesson (including drafts), with translations +
 *  question count. Used by the lesson editor's Quiz section. */
export async function adminListQuizzesForLesson(lessonId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('quizzes')
    .select(
      `id, slug, status, passing_score, published_at, created_at,
       translations:quiz_translations(id, language_code, title, instructions, status),
       quiz_questions(question_id)`,
    )
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single quiz with translations + linked questions (for the edit dialog). */
export async function adminGetQuiz(quizId: string) {
  await requirePermission('lesson.update')
  const admin = createAdminClient()

  const { data: quiz, error: qErr } = await admin
    .from('quizzes')
    .select(
      `id, slug, status, passing_score, published_at, created_at,
       translations:quiz_translations(id, language_code, title, instructions, status)`,
    )
    .eq('id', quizId)
    .single()
  if (qErr) return { data: null, error: qErr.message }

  const { data: questions, error: qqErr } = await admin
    .from('quiz_questions')
    .select(
      `id, sort_order,
       question:questions(id, slug, question_type, difficulty, status,
         translations:question_translations(language_code, question_text))`,
    )
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true })
  if (qqErr) return { data: null, error: qqErr.message }

  return {
    data: { ...quiz, questions: questions ?? [] },
    error: null,
  }
}

// ── COURSE-LEVEL QUIZZES (lesson_id IS NULL) ─────────────────────────────

/** List course-level quizzes (lesson_id IS NULL) — for the /console/quizzes page.
 *  Returns translations, course context, and a question count. */
export async function adminListCourseQuizzes() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('quizzes')
    .select(
      `id, slug, status, passing_score, published_at, created_at, course_id,
       translations:quiz_translations(id, language_code, title, instructions, status),
       course:courses(id, slug,
         translations:course_translations(language_code, title, status)),
       quiz_questions(question_id)`,
    )
    .is('lesson_id', null)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** List published MCQ-type questions eligible for linking to a quiz.
 *  Used by the course quiz dialog to pick questions. */
export async function adminListEligibleMcqQuestions() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('questions')
    .select(
      `id, slug, question_type, difficulty, status, topic,
       translations:question_translations(id, language_code, question_text)`,
    )
    .in('question_type', ['single_choice', 'multiple_choice', 'true_false'])
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
