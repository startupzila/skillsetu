import { NextResponse } from 'next/server'
import { adminListQuizzesForLesson } from '@/lib/admin/question-service'

/**
 * /api/admin/lessons/[id]/quizzes
 * GET — list all quizzes (incl. drafts) attached to a lesson, with their
 *       translations + question count. Used by the lesson editor's Quiz
 *       section to render the existing quizzes + "Add Quiz" button.
 */
const authError = (error: string) => {
  if (error.includes('UNAUTHENTICATED')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await adminListQuizzesForLesson(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}
