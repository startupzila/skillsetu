import { NextResponse } from 'next/server'
import { getOrCreateLessonProgress, completeLesson } from '@/lib/learning'

/**
 * POST /api/progress/lesson
 *
 * Either:
 *   - marks a lesson as in_progress (if not started) and returns the progress record, OR
 *   - marks a lesson as completed (if { completed: true } is sent).
 *
 * Requires authentication. RLS enforces self-only access.
 *
 * Body: { lessonId: string, completed?: boolean, enrollmentId?: string }
 */
export async function POST(request: Request) {
  let body: { lessonId?: string; completed?: boolean; enrollmentId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { lessonId, completed, enrollmentId } = body

  if (!lessonId) {
    return NextResponse.json({ error: 'Missing `lessonId`' }, { status: 400 })
  }

  try {
    const { data, error } = completed
      ? await completeLesson(lessonId, enrollmentId)
      : await getOrCreateLessonProgress(lessonId)

    if (error) {
      if (error.includes('JWT') || error.includes('not authenticated') || error.includes('Authentication required')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (
        error.includes('does not exist') ||
        error.includes('Could not find the table') ||
        error.includes('schema cache')
      ) {
        return NextResponse.json(
          {
            status: 'schema_pending',
            message: 'Learner tables not yet created. Apply db/migrations/004_tables_s3.sql in Supabase Dashboard.',
            data: null,
          },
          { status: 200 },
        )
      }
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
