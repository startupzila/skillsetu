import { NextResponse } from 'next/server'
import { adminGetLesson, adminUpdateLesson, adminUpdateLessonTranslation, adminPublishLesson, adminDeleteLesson } from '@/lib/admin/content-service'

/**
 * /api/admin/lessons/[id]
 *
 * GET    — fetch the lesson (incl. draft) + EN translation (incl. content_html).
 * PATCH  — update lesson core fields (slug, sort_order, status, duration_minutes,
 *          video_url) AND/OR translation (title, summary, content_html):
 *            body: { lesson?: {...core}, translation?: {...trans} }
 * POST   ?action=publish  → publish the lesson.
 * DELETE — delete the lesson (cascades).
 */
const authError = (error: string) => {
  if (error.includes('UNAUTHENTICATED')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data, error } = await adminGetLesson(id)
  if (error) return authError(error)
  return NextResponse.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result: Record<string, unknown> = {}

  // Lesson core fields (flat body or nested under `lesson`)
  const lessonFields = (body.lesson as Record<string, unknown>) ?? (() => {
    const allowed = ['slug', 'sort_order', 'lesson_type', 'status', 'duration_minutes', 'video_url']
    const out: Record<string, unknown> = {}
    for (const k of allowed) if (k in body) out[k] = body[k]
    return out
  })()
  if (Object.keys(lessonFields).length > 0) {
    const { data, error } = await adminUpdateLesson(id, lessonFields)
    if (error) return authError(error)
    result.lesson = data
  }

  // Translation (title, summary, content_html, status)
  const translation = body.translation as Record<string, unknown> | undefined
  if (translation && typeof translation.id === 'string') {
    const { id: transId, ...transFields } = translation
    const { data, error } = await adminUpdateLessonTranslation(
      transId,
      transFields as { title?: string; summary?: string | null; content_html?: string | null; status?: string },
    )
    if (error) return authError(error)
    result.translation = data
  }

  if (!result.lesson && !result.translation) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }
  return NextResponse.json({ data: result })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'publish') {
    const { data, error } = await adminPublishLesson(id)
    if (error) return authError(error)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteLesson(id)
  if (error) return authError(error)
  return NextResponse.json({ data: { deleted: true } })
}
