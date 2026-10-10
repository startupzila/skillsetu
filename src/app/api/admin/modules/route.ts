import { NextResponse } from 'next/server'
import { adminCreateModule } from '@/lib/admin/content-service'

/**
 * /api/admin/modules  (collection)
 * POST — create a module: { course_id, slug, title, description?, sort_order? }
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = await adminCreateModule({
    course_id: body.course_id as string,
    slug: body.slug as string,
    title: body.title as string,
    description: (body.description as string) ?? undefined,
    sort_order: (body.sort_order as number) ?? undefined,
  })

  if (error) {
    if (error.includes('UNAUTHENTICATED')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
