import { NextResponse } from 'next/server'
import {
  adminListQuizzes,
  adminListCourseQuizzes,
  adminCreateQuiz,
  type AdminQuizInput,
} from '@/lib/admin/question-service'

const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

/**
 * GET /api/admin/quizzes                  — list all quizzes
 * GET /api/admin/quizzes?course_only=1    — list course-level quizzes (lesson_id IS NULL)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const courseOnly = searchParams.get('course_only') === '1'

  const { data, error } = courseOnly
    ? await adminListCourseQuizzes()
    : await adminListQuizzes()
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/**
 * POST /api/admin/quizzes — create a quiz with EN + (optional) HI translations.
 *
 * Body:
 *   {
 *     lesson_id?, module_id?, course_id?, slug, passing_score?,
 *     title_en, title_hi?, instructions_en?, instructions_hi?
 *   }
 *
 * The quiz starts in `draft` status. Use POST /api/admin/quizzes/[id]?action=publish
 * to publish.
 */
export async function POST(request: Request) {
  let body: AdminQuizInput
  try {
    body = (await request.json()) as AdminQuizInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.title_en) {
    return NextResponse.json(
      { error: 'Missing `slug` or `title_en`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateQuiz(body)
  if (error) return authError(error)
  return NextResponse.json({ data })
}
