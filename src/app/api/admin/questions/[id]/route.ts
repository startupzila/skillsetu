import { NextResponse } from 'next/server'
import {
  adminGetQuestion,
  adminUpdateQuestion,
  adminUpdateQuestionTranslation,
  adminDeleteQuestion,
  adminPublishQuestion,
} from '@/lib/admin/question-service'

const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

/** GET /api/admin/questions/[id] — get a question with translation + options. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await adminGetQuestion(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/**
 * PATCH /api/admin/questions/[id] — full update.
 *   body: {
 *     question_type?, difficulty?, topic?, status?, lesson_id?,  // core
 *     translation?: { id, question_text?, explanation?, model_answer? },
 *   }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result: Record<string, unknown> = {}

  // Core question fields (flat body or nested under `question`)
  const core: Record<string, unknown> = {}
  const coreAllowed = ['question_type', 'difficulty', 'topic', 'status', 'lesson_id']
  for (const k of coreAllowed) {
    if (k in body) core[k] = body[k]
  }
  if (Object.keys(core).length > 0) {
    const { data, error } = await adminUpdateQuestion(id, core as Parameters<typeof adminUpdateQuestion>[1])
    if (error) return authError(error)
    result.question = data
  }

  // Translation update
  const translation = body.translation as { id?: string } & Record<string, unknown> | undefined
  if (translation && typeof translation.id === 'string') {
    const { id: _transId, ...transFields } = translation
    const { data, error } = await adminUpdateQuestionTranslation(
      translation.id,
      transFields as { question_text?: string; explanation?: string | null; model_answer?: string | null },
    )
    if (error) return authError(error)
    result.translation = data
  }

  if (!result.question && !result.translation) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }
  return NextResponse.json({ data: result })
}

/** DELETE /api/admin/questions/[id] — delete a question. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteQuestion(id)
  if (error) return authError(error)
  return NextResponse.json({ success: true })
}

/** POST /api/admin/questions/[id]?action=publish — publish a question. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'publish') {
    const { data, error } = await adminPublishQuestion(id)
    if (error) return authError(error)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
