import { NextResponse } from 'next/server'
import { listPublishedCourses } from '@/lib/content'

/**
 * GET /api/courses?lang=en
 *
 * Returns published courses with their translations.
 * Only courses that have a published translation in the requested
 * language are returned.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') as 'en' | 'hi' | null

  const { data, error, code } = await listPublishedCourses(lang ?? undefined)

  if (error) {
    if (
      code === '42P01' ||
      error.includes('does not exist') ||
      error.includes('Could not find the table') ||
      error.includes('schema cache')
    ) {
      return NextResponse.json(
        {
          status: 'schema_pending',
          message: 'Database tables not yet created. Apply db/migrations/*.sql in Supabase Dashboard.',
          data: [],
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ data })
}
