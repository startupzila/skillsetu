import { NextResponse } from 'next/server'
import {
  adminListMockTests,
  adminCreateMockTest,
  type AdminMockTestInput,
} from '@/lib/admin/mock-test-service'

const authError = (error: string) => {
  if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

/** GET /api/admin/mock-tests — list all mock tests. */
export async function GET() {
  const { data, error } = await adminListMockTests()
  if (error) return authError(error)
  return NextResponse.json({ data })
}

/**
 * POST /api/admin/mock-tests — create a mock test with EN + (optional) HI translations.
 *
 * Body:
 *   {
 *     course_id?, slug, time_limit_minutes?, question_count?,
 *     passing_score?, attempts_allowed?, randomize?, review_mode?, difficulty?,
 *     title_en, title_hi?, instructions_en?, instructions_hi?
 *   }
 *
 * The mock test starts in `draft` status. Use POST /api/admin/mock-tests/[id]?action=publish
 * to publish.
 */
export async function POST(request: Request) {
  let body: AdminMockTestInput
  try {
    body = (await request.json()) as AdminMockTestInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.title_en) {
    return NextResponse.json(
      { error: 'Missing `slug` or `title_en`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateMockTest(body)
  if (error) return authError(error)
  return NextResponse.json({ data })
}
