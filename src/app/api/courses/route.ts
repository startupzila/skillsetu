import { NextResponse } from 'next/server'
import { listPublishedCourses } from '@/lib/content'

/**
 * GET /api/courses?lang=en&q=excel
 *
 * Returns published courses with their translations.
 * Only courses that have a published translation in the requested
 * language are returned.
 *
 * If `q` is provided, results are filtered to courses whose title
 * (in the requested language, case-insensitive) contains the query.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') as 'en' | 'hi' | null
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

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

  // Filter by title (case-insensitive contains) when `q` is provided.
  if (q) {
    const filtered = (data ?? []).filter((course) => {
      const t = course.translations?.[0]
      return t?.title?.toLowerCase().includes(q) ?? false
    })
    return NextResponse.json({ data: filtered })
  }

  return NextResponse.json({ data })
}
