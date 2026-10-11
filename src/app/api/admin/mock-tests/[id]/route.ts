import { NextResponse } from 'next/server'
import {
  adminGetMockTest,
  adminUpdateMockTest,
  adminDeleteMockTest,
  adminPublishMockTest,
  adminListMockTestQuestions,
  adminAddQuestionToMockTest,
  adminRemoveQuestionFromMockTest,
  type AdminMockTestUpdate,
} from '@/lib/admin/mock-test-service'

const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

/** GET /api/admin/mock-tests/[id] — get a mock test with translations + linked questions. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await adminGetMockTest(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/**
 * PATCH /api/admin/mock-tests/[id] — update a mock test's core fields + translations.
 *
 * Body:
 *   {
 *     time_limit_minutes?, question_count?, passing_score?, attempts_allowed?,
 *     randomize?, review_mode?, difficulty?, course_id?, status?,
 *     title_en?, title_hi?, instructions_en?, instructions_hi?
 *   }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: AdminMockTestUpdate
  try {
    body = (await request.json()) as AdminMockTestUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = await adminUpdateMockTest(id, body)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/** DELETE /api/admin/mock-tests/[id] — delete a mock test (cascades translations + links). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteMockTest(id)
  if (error) return authError(error)
  return NextResponse.json({ data: { deleted: true } })
}

/**
 * POST /api/admin/mock-tests/[id]
 *   ?action=publish          → publish the mock test + all its translations
 *   ?action=add-question      body: { question_id }  → link a question
 *   ?action=remove-question   body: { question_id }  → unlink a question
 *   (no action) → list linked questions
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'publish') {
    const { data, error } = await adminPublishMockTest(id)
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
      const { data, error } = await adminAddQuestionToMockTest(id, body.question_id)
      if (error) return authError(error)
      return NextResponse.json({ data })
    }
    const { error } = await adminRemoveQuestionFromMockTest(id, body.question_id)
    if (error) return authError(error)
    return NextResponse.json({ data: { removed: true } })
  }

  if (!action) {
    const { data, error } = await adminListMockTestQuestions(id)
    if (error) return authError(error)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
