import { NextResponse } from 'next/server'
import { listPublishedCategories } from '@/lib/content'

/**
 * GET /api/categories?lang=en
 *
 * Returns published categories with their translations.
 * If `lang` is specified, only that language's translation is returned.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') as 'en' | 'hi' | null

  const { data, error, code } = await listPublishedCategories(lang ?? undefined)

  if (error) {
    // Table not yet applied (schema migration pending)
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
