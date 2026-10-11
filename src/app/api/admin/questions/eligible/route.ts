import { NextResponse } from 'next/server'
import { adminListEligibleMcqQuestions } from '@/lib/admin/question-service'

/**
 * GET /api/admin/questions/eligible
 *
 * Returns published MCQ-type questions (single_choice, multiple_choice,
 * true_false) eligible for linking to a quiz or mock test.
 *
 * Used by the /console/quizzes + /console/mock-tests dialogs to pick
 * questions for a course-level assessment.
 */
export async function GET() {
  const { data, error } = await adminListEligibleMcqQuestions()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
