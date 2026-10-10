import { NextResponse } from 'next/server'
import { adminListQuestionsForLesson } from '@/lib/admin/question-service'

/**
 * /api/admin/lessons/[id]/questions
 * GET — list all questions (incl. drafts) attached to a lesson, with their
 *       EN translation + options. Used by the integrated lesson editor to
 *       render the inline MCQ + QNA manager.
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
  const { data, error } = await adminListQuestionsForLesson(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}
