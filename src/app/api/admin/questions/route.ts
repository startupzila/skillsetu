import { NextResponse } from 'next/server'
import {
  adminListQuestions,
  adminCreateQuestion,
  type QuestionInput,
} from '@/lib/admin/question-service'

/** GET /api/admin/questions — list all questions. */
export async function GET() {
  const { data, error } = await adminListQuestions()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

/** POST /api/admin/questions — create a question with translation + options. */
export async function POST(request: Request) {
  let body: QuestionInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.question_text || !body.options) {
    return NextResponse.json(
      { error: 'Missing `slug`, `question_text`, or `options`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateQuestion(body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
