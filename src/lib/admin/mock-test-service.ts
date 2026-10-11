import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Admin mock-test service — CRUD for mock_tests + test_translations +
 * test_questions link rows.
 *
 * Mirrors the question-service.ts quiz CRUD pattern, but for the
 * mock_tests table (course-level timed exams).
 */

export interface AdminMockTestInput {
  course_id?: string | null
  slug: string
  time_limit_minutes?: number
  question_count?: number
  passing_score?: number
  attempts_allowed?: number | null
  randomize?: boolean
  review_mode?: boolean
  difficulty?: 'easy' | 'medium' | 'hard'
  title_en: string
  title_hi?: string
  instructions_en?: string
  instructions_hi?: string
}

export interface AdminMockTestUpdate {
  course_id?: string | null
  time_limit_minutes?: number
  question_count?: number
  passing_score?: number
  attempts_allowed?: number | null
  randomize?: boolean
  review_mode?: boolean
  difficulty?: 'easy' | 'medium' | 'hard'
  status?: string
  title_en?: string
  title_hi?: string
  instructions_en?: string | null
  instructions_hi?: string | null
}

const VALID_DIFFICULTIES: ReadonlyArray<'easy' | 'medium' | 'hard'> = [
  'easy',
  'medium',
  'hard',
]

function normalizeDifficulty(
  d: 'easy' | 'medium' | 'hard' | undefined,
): 'easy' | 'medium' | 'hard' {
  return d && VALID_DIFFICULTIES.includes(d) ? d : 'medium'
}

/** List all mock tests (with translations + course + question count). */
export async function adminListMockTests() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('mock_tests')
    .select(
      `id, slug, status, course_id, time_limit_minutes, question_count,
       passing_score, attempts_allowed, randomize, review_mode, difficulty,
       published_at, created_at,
       translations:test_translations(id, language_code, title, instructions, status),
       course:courses(id, slug,
         translations:course_translations(language_code, title, status)),
       test_questions(question_id)`,
    )
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single mock test with translations + linked questions. */
export async function adminGetMockTest(testId: string) {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data: test, error: tErr } = await admin
    .from('mock_tests')
    .select(
      `id, slug, status, course_id, time_limit_minutes, question_count,
       passing_score, attempts_allowed, randomize, review_mode, difficulty,
       published_at, created_at,
       translations:test_translations(id, language_code, title, instructions, status),
       course:courses(id, slug,
         translations:course_translations(language_code, title, status))`,
    )
    .eq('id', testId)
    .single()
  if (tErr) return { data: null, error: tErr.message }

  const { data: questions, error: qErr } = await admin
    .from('test_questions')
    .select(
      `id, sort_order,
       question:questions(id, slug, question_type, difficulty, status,
         translations:question_translations(language_code, question_text))`,
    )
    .eq('test_id', testId)
    .order('sort_order', { ascending: true })
  if (qErr) return { data: null, error: qErr.message }

  return {
    data: { ...test, questions: questions ?? [] },
    error: null,
  }
}

/** Create a mock test with EN + (optional) HI translations.
 *  The test row starts in `draft` status. Use `adminPublishMockTest` to publish. */
export async function adminCreateMockTest(input: AdminMockTestInput) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { data: test, error: tErr } = await admin
    .from('mock_tests')
    .insert({
      slug: input.slug,
      course_id: input.course_id ?? null,
      status: 'draft',
      time_limit_minutes: input.time_limit_minutes ?? 60,
      question_count: input.question_count ?? 0,
      passing_score: input.passing_score ?? 60,
      attempts_allowed: input.attempts_allowed ?? null,
      randomize: input.randomize ?? false,
      review_mode: input.review_mode ?? true,
      difficulty: normalizeDifficulty(input.difficulty),
    })
    .select()
    .single()
  if (tErr) return { data: null, error: tErr.message }

  // Insert EN translation (always required)
  const { error: enErr } = await admin.from('test_translations').insert({
    test_id: test.id,
    language_code: 'en',
    title: input.title_en,
    instructions: input.instructions_en ?? null,
    status: 'draft',
  })
  if (enErr) return { data: null, error: enErr.message }

  // Insert HI translation (if provided)
  if (input.title_hi || input.instructions_hi) {
    const { error: hiErr } = await admin.from('test_translations').insert({
      test_id: test.id,
      language_code: 'hi',
      title: input.title_hi ?? input.title_en,
      instructions: input.instructions_hi ?? null,
      status: 'draft',
    })
    if (hiErr) return { data: null, error: hiErr.message }
  }

  await recordAudit({
    action: 'mock_test.create',
    entityType: 'mock_test',
    entityId: test.id,
  })
  return { data: test, error: null }
}

/** Update a mock test's core fields + (optional) EN/HI translations.
 *  - Translations are upserted by (test_id, language_code). */
export async function adminUpdateMockTest(
  testId: string,
  updates: AdminMockTestUpdate,
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Core mock_test fields
  const core: Record<string, unknown> = {}
  if (typeof updates.time_limit_minutes === 'number')
    core.time_limit_minutes = updates.time_limit_minutes
  if (typeof updates.question_count === 'number')
    core.question_count = updates.question_count
  if (typeof updates.passing_score === 'number')
    core.passing_score = updates.passing_score
  if (typeof updates.attempts_allowed !== 'undefined')
    core.attempts_allowed = updates.attempts_allowed
  if (typeof updates.randomize === 'boolean') core.randomize = updates.randomize
  if (typeof updates.review_mode === 'boolean')
    core.review_mode = updates.review_mode
  if (typeof updates.course_id !== 'undefined')
    core.course_id = updates.course_id
  if (updates.difficulty) core.difficulty = normalizeDifficulty(updates.difficulty)
  if (typeof updates.status === 'string') core.status = updates.status

  if (Object.keys(core).length > 0) {
    const { error } = await admin.from('mock_tests').update(core).eq('id', testId)
    if (error) return { data: null, error: error.message }
  }

  // EN translation upsert
  if (
    typeof updates.title_en === 'string' ||
    typeof updates.instructions_en !== 'undefined'
  ) {
    const { data: existing } = await admin
      .from('test_translations')
      .select('id')
      .eq('test_id', testId)
      .eq('language_code', 'en')
      .maybeSingle()

    const fields: Record<string, unknown> = {}
    if (typeof updates.title_en === 'string') fields.title = updates.title_en
    if (typeof updates.instructions_en !== 'undefined')
      fields.instructions = updates.instructions_en

    if (existing) {
      const { error } = await admin
        .from('test_translations')
        .update(fields)
        .eq('id', existing.id)
      if (error) return { data: null, error: error.message }
    } else {
      const { error } = await admin.from('test_translations').insert({
        test_id: testId,
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
      .from('test_translations')
      .select('id')
      .eq('test_id', testId)
      .eq('language_code', 'hi')
      .maybeSingle()

    const fields: Record<string, unknown> = {}
    if (typeof updates.title_hi === 'string') fields.title = updates.title_hi
    if (typeof updates.instructions_hi !== 'undefined')
      fields.instructions = updates.instructions_hi

    if (existing) {
      const { error } = await admin
        .from('test_translations')
        .update(fields)
        .eq('id', existing.id)
      if (error) return { data: null, error: error.message }
    } else {
      const { error } = await admin.from('test_translations').insert({
        test_id: testId,
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

  await recordAudit({
    action: 'mock_test.update',
    entityType: 'mock_test',
    entityId: testId,
  })

  // Re-fetch + return the updated mock test with translations + course.
  const { data, error } = await admin
    .from('mock_tests')
    .select(
      `id, slug, status, course_id, time_limit_minutes, question_count,
       passing_score, attempts_allowed, randomize, review_mode, difficulty,
       published_at, created_at,
       translations:test_translations(id, language_code, title, instructions, status),
       course:courses(id, slug,
         translations:course_translations(language_code, title, status)),
       test_questions(question_id)`,
    )
    .eq('id', testId)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Publish a mock test + all of its translations. */
export async function adminPublishMockTest(testId: string) {
  await requirePermission('question.review')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('mock_tests')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', testId)
    .select()
    .single()
  if (error) return { data: null, error: error.message }

  // Publish all translations as well.
  await admin
    .from('test_translations')
    .update({ status: 'published' })
    .eq('test_id', testId)

  await recordAudit({
    action: 'mock_test.publish',
    entityType: 'mock_test',
    entityId: testId,
  })
  return { data, error: null }
}

/** Delete a mock test (cascade handles translations + test_questions). */
export async function adminDeleteMockTest(testId: string) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Clean up join rows first (some Supabase configs don't cascade).
  await admin.from('test_questions').delete().eq('test_id', testId)
  await admin.from('test_translations').delete().eq('test_id', testId)

  const { error } = await admin.from('mock_tests').delete().eq('id', testId)
  if (error) return { error: error.message }
  await recordAudit({
    action: 'mock_test.delete',
    entityType: 'mock_test',
    entityId: testId,
  })
  return { error: null }
}

/** List questions linked to a mock test. */
export async function adminListMockTestQuestions(testId: string) {
  await requirePermission('course.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('test_questions')
    .select(
      `id, sort_order,
       question:questions(id, slug, question_type, difficulty, status,
         translations:question_translations(language_code, question_text))`,
    )
    .eq('test_id', testId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Link a question to a mock test. */
export async function adminAddQuestionToMockTest(
  testId: string,
  questionId: string,
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  // Get next sort_order
  const { data: existing } = await admin
    .from('test_questions')
    .select('sort_order')
    .eq('test_id', testId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder =
    (existing && existing.length > 0
      ? (existing[0] as { sort_order: number }).sort_order
      : 0) + 1

  const { data, error } = await admin
    .from('test_questions')
    .insert({ test_id: testId, question_id: questionId, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  // Keep question_count column in sync with the actual count of linked rows.
  await admin
    .from('mock_tests')
    .update({ question_count: nextOrder })
    .eq('id', testId)
  return { data, error: null }
}

/** Remove a question from a mock test. */
export async function adminRemoveQuestionFromMockTest(
  testId: string,
  questionId: string,
) {
  await requirePermission('question.create')
  const admin = createAdminClient()

  const { error } = await admin
    .from('test_questions')
    .delete()
    .eq('test_id', testId)
    .eq('question_id', questionId)

  if (error) return { error: error.message }

  // Recompute question_count after removal.
  const { count } = await admin
    .from('test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', testId)
  await admin
    .from('mock_tests')
    .update({ question_count: count ?? 0 })
    .eq('id', testId)

  return { error: null }
}
