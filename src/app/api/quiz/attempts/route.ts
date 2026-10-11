import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

/**
 * Quiz + Mock Test Attempts API
 *
 * POST /api/quiz/attempts
 *   Start a new attempt. Body:
 *     { quizId: string }                                     → quiz attempt
 *     { assessment_type: 'mock_test', mockTestId: string }   → mock-test attempt
 *   Creates an attempt row (status: in_progress) and returns it.
 *
 * PUT /api/quiz/attempts
 *   Submit an attempt: { attemptId: string, answers: AttemptAnswer[] }
 *   Grades all answers, computes score, marks attempt completed.
 *   Looks up passing_score from the attempt's assessment_type:
 *     'quiz'      → quizzes.passing_score
 *     'mock_test' → mock_tests.passing_score
 */

export async function POST(request: Request) {
  let body: {
    quizId?: string
    assessment_type?: 'quiz' | 'mock_test'
    mockTestId?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const isMockTest =
    body.assessment_type === 'mock_test' && body.mockTestId
  const quizId = body.quizId
  const mockTestId = body.mockTestId

  if (!quizId && !isMockTest) {
    return NextResponse.json(
      {
        error:
          'Missing `quizId` or `{ assessment_type: "mock_test", mockTestId }`',
      },
      { status: 400 },
    )
  }

  try {
    const session = await requireUser()
    const supabase = await createServerSupabaseClient()

    let assessmentId: string
    let assessmentType: 'quiz' | 'mock_test'
    let questionCount = 0

    if (isMockTest) {
      // Verify the mock test is published
      const { data: test, error: tErr } = await supabase
        .from('mock_tests')
        .select('id, passing_score')
        .eq('id', mockTestId as string)
        .eq('status', 'published')
        .single()
      if (tErr || !test) {
        return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
      }
      assessmentId = test.id
      assessmentType = 'mock_test'

      const { count } = await supabase
        .from('test_questions')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', test.id)
      questionCount = count ?? 0
    } else {
      // Verify the quiz is published
      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .select('id, passing_score')
        .eq('id', quizId as string)
        .eq('status', 'published')
        .single()
      if (quizErr || !quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
      }
      assessmentId = quiz.id
      assessmentType = 'quiz'

      const { count } = await supabase
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id)
      questionCount = count ?? 0
    }

    // Create attempt
    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .insert({
        user_id: session.user.id,
        assessment_type: assessmentType,
        assessment_id: assessmentId,
        status: 'in_progress',
        total_questions: questionCount,
        language_code: 'en',
      })
      .select()
      .single()

    if (attErr) {
      return NextResponse.json({ error: attErr.message }, { status: 500 })
    }

    return NextResponse.json({ data: attempt })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required') || msg.includes('UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  let body: {
    attemptId?: string
    answers?: Array<{ questionId: string; selectedOptionIds: string[] }>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { attemptId, answers } = body
  if (!attemptId || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: 'Missing `attemptId` or `answers`' },
      { status: 400 },
    )
  }

  try {
    await requireUser()
    const supabase = await createServerSupabaseClient()

    // Verify the attempt exists and belongs to the user (RLS enforces user_id)
    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('id, user_id, assessment_id, assessment_type, status')
      .eq('id', attemptId)
      .single()
    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Fetch the passing_score based on assessment_type
    let passingScore = 60
    if (attempt.assessment_type === 'mock_test') {
      const { data: test } = await supabase
        .from('mock_tests')
        .select('passing_score')
        .eq('id', attempt.assessment_id)
        .single()
      passingScore = test?.passing_score ?? 60
    } else {
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('passing_score')
        .eq('id', attempt.assessment_id)
        .single()
      passingScore = quiz?.passing_score ?? 60
    }

    // Grade each answer
    const graded: Array<{
      question_id: string
      is_correct: boolean
      selected_options: string[]
      correct_option_ids: string[]
    }> = []
    let correctCount = 0

    for (const ans of answers) {
      // Fetch the question's options to find correct ones
      const { data: options } = await supabase
        .from('question_options')
        .select('id, is_correct')
        .eq('question_id', ans.questionId)

      const correctIds = (options ?? [])
        .filter((o: { is_correct: boolean; id: string }) => o.is_correct)
        .map((o: { id: string }) => o.id)

      const isCorrect =
        ans.selectedOptionIds.length === correctIds.length &&
        ans.selectedOptionIds.every((id) => correctIds.includes(id))

      if (isCorrect) correctCount++

      graded.push({
        question_id: ans.questionId,
        is_correct: isCorrect,
        selected_options: ans.selectedOptionIds,
        correct_option_ids: correctIds,
      })
    }

    // Insert attempt_answers
    if (graded.length > 0) {
      await supabase.from('attempt_answers').insert(
        graded.map((g) => ({
          attempt_id: attemptId,
          question_id: g.question_id,
          selected_options: g.selected_options,
          is_correct: g.is_correct,
        })),
      )
    }

    // Compute score
    const total = answers.length
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const passed = score >= passingScore

    // Update attempt
    const { data: updated, error: upErr } = await supabase
      .from('attempts')
      .update({
        status: 'completed',
        score,
        correct_count: correctCount,
        total_questions: total,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        ...updated,
        passed,
        results: graded.map((g) => ({
          questionId: g.question_id,
          isCorrect: g.is_correct,
          selected: g.selected_options,
          correctOptionIds: g.correct_option_ids,
        })),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required') || msg.includes('UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
