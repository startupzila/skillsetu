import { NextResponse } from 'next/server'
import {
  adminGetQuiz,
  adminUpdateQuiz,
  adminDeleteQuiz,
  adminPublishQuiz,
  adminListQuizQuestions,
  adminAddQuestionToQuiz,
  adminRemoveQuestionFromQuiz,
  type AdminQuizUpdate,
} from '@/lib/admin/question-service'

const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

/** GET /api/admin/quizzes/[id] — get a quiz with translations + linked questions. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await adminGetQuiz(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/**
 * PATCH /api/admin/quizzes/[id] — update a quiz's core fields + translations.
 *
 * Body:
 *   {
 *     passing_score?, status?,
 *     title_en?, title_hi?, instructions_en?, instructions_hi?
 *   }
 *
 * Translations are upserted by (quiz_id, language_code) — sending title_hi on
 * a quiz with no HI translation row creates it on the fly.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: AdminQuizUpdate
  try {
    body = (await request.json()) as AdminQuizUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = await adminUpdateQuiz(id, body)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/** DELETE /api/admin/quizzes/[id] — delete a quiz (cascades translations + links). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteQuiz(id)
  if (error) return authError(error)
  return NextResponse.json({ data: { deleted: true } })
}

/**
 * POST /api/admin/quizzes/[id]
 *   ?action=publish          → publish the quiz + all its translations
 *   ?action=add-question      body: { question_id }  → link a question
 *   ?action=remove-question   body: { question_id }  → unlink a question
 *   (no action) → alias for ?action=publish (back-compat with question-service pattern)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'publish') {
    const { data, error } = await adminPublishQuiz(id)
    if (error) return authError(error)
    return NextResponse.json({ data })
  }

  if (action === 'add-question' || action === 'remove-question') {
    let body: { question_id?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!body.question_id) {
      return NextResponse.json(
        { error: 'Missing `question_id`' },
        { status: 400 },
      )
    }
    if (action === 'add-question') {
      const { data, error } = await adminAddQuestionToQuiz(id, body.question_id)
      if (error) return authError(error)
      return NextResponse.json({ data })
    }
    const { error } = await adminRemoveQuestionFromQuiz(id, body.question_id)
    if (error) return authError(error)
    return NextResponse.json({ data: { removed: true } })
  }

  // Default: list linked questions (helpful for the edit dialog).
  if (!action) {
    const { data, error } = await adminListQuizQuestions(id)
    if (error) return authError(error)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
