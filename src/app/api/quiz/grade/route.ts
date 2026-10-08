import { NextResponse } from 'next/server'
import { gradeAnswer } from '@/lib/learning'

/**
 * POST /api/quiz/grade
 *
 * Grades a learner's answer for a single question. Returns correctness,
 * the correct option IDs, and the explanation (revealed only after submission).
 *
 * Body: { questionId: string, selectedOptionIds: string[], lang?: 'en' | 'hi' }
 *
 * Security: the correct answer is NEVER sent to the client before this call.
 * The client sends its selected options; the server compares against the DB.
 */
export async function POST(request: Request) {
  let body: { questionId?: string; selectedOptionIds?: string[]; lang?: 'en' | 'hi' }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { questionId, selectedOptionIds, lang = 'en' } = body

  if (!questionId || !Array.isArray(selectedOptionIds)) {
    return NextResponse.json(
      { error: 'Missing `questionId` or `selectedOptionIds`' },
      { status: 400 },
    )
  }

  const { data, error } = await gradeAnswer(questionId, selectedOptionIds, lang)

  if (error) {
    if (
      error.includes('does not exist') ||
      error.includes('Could not find the table') ||
      error.includes('schema cache')
    ) {
      return NextResponse.json(
        {
          status: 'schema_pending',
          message: 'Assessment tables not yet created. Apply db/migrations/004_tables_s3.sql in Supabase Dashboard.',
          data: null,
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ data })
}
