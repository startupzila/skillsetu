import { NextResponse } from 'next/server'
import { getPublishedQuizBySlug } from '@/lib/learning'

/**
 * GET /api/quiz?slug=excel-intro-quiz&lang=en
 *
 * Returns a published quiz with its questions. Correct answers
 * (is_correct) are NEVER included in the response — the client
 * only sees option IDs and text.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const lang = (searchParams.get('lang') as 'en' | 'hi') ?? 'en'

  if (!slug) {
    return NextResponse.json({ error: 'Missing `slug` parameter' }, { status: 400 })
  }

  const { data, error } = await getPublishedQuizBySlug(slug, lang)

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
    return NextResponse.json({ error }, { status: 404 })
  }

  return NextResponse.json({ data })
}
