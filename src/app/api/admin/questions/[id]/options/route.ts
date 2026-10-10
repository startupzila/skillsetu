import { NextResponse } from 'next/server'
import { adminCreateOption, adminUpdateOption, adminDeleteOption } from '@/lib/admin/question-service'

/**
 * /api/admin/questions/[id]/options
 *
 * POST   — add an option to question [id]:
 *            body: { text: { en, hi? }, is_correct }
 * PATCH  — update an option (body: { option_id, text?, is_correct?, sort_order? })
 * DELETE — delete an option (body: { option_id })
 */
const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

export async function POST(
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

  const { data, error } = await adminCreateOption(id, {
    text: body.text as { en: string; hi?: string },
    is_correct: Boolean(body.is_correct),
  })
  if (error) return authError(error)
  return NextResponse.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _questionId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const optionId = body.option_id as string
  if (!optionId) return NextResponse.json({ error: 'option_id is required' }, { status: 400 })

  const updates: { text?: Record<string, string>; is_correct?: boolean; sort_order?: number } = {}
  if (body.text) updates.text = body.text as Record<string, string>
  if (typeof body.is_correct === 'boolean') updates.is_correct = body.is_correct
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order

  const { data, error } = await adminUpdateOption(optionId, updates)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _questionId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const optionId = body.option_id as string
  if (!optionId) return NextResponse.json({ error: 'option_id is required' }, { status: 400 })

  const { error } = await adminDeleteOption(optionId)
  if (error) return authError(error)
  return NextResponse.json({ data: { deleted: true } })
}
