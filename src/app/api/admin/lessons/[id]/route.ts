import { NextResponse } from 'next/server'
import { adminGetLesson, adminUpdateLesson, adminUpdateLessonTranslation, adminUpsertLessonTranslation, adminPublishLesson, adminDeleteLesson } from '@/lib/admin/content-service'

/**
 * /api/admin/lessons/[id]
 *
 * GET    — fetch the lesson (incl. draft) + ALL translations (en/hi/…)
 *          as an array under `translations`. The editor uses this to render
 *          its EN/HI tabs without a second round-trip.
 * PATCH  — update lesson core fields (slug, sort_order, status, duration_minutes,
 *          video_url) AND/OR translation (title, summary, content_html):
 *            body: { lesson?: {...core}, translation?: {...trans} }
 *          Two translation shapes are accepted:
 *            (a) translation: { id, ...fields }    → update by translation id
 *            (b) translation: { lesson_id?, language_code, ...fields }
 *                → upsert by (lesson_id, language_code). If `lesson_id` is
 *                omitted, the path's `id` param is used as lesson_id.
 *          This lets the editor save the Hindi tab the first time, when no
 *          HI translation row exists yet.
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
  // Two flows:
  //   (a) by translation.id           → existing translation update
  //   (b) by language_code (upsert)  → create-or-update translation row
  //       for the given lesson. `lesson_id` defaults to the path `id`.
  const translation = body.translation as Record<string, unknown> | undefined
  if (translation) {
    const transLang = typeof translation.language_code === 'string' ? translation.language_code : null
    const transId = typeof translation.id === 'string' ? translation.id : null

    if (transId) {
      const { id: _transId, ...transFields } = translation
      const { data, error } = await adminUpdateLessonTranslation(
        transId,
        transFields as { title?: string; summary?: string | null; content_html?: string | null; status?: string },
      )
      if (error) return authError(error)
      result.translation = data
    } else if (transLang) {
      const lessonIdForTrans =
        typeof translation.lesson_id === 'string' ? translation.lesson_id : id
      const { language_code: _lc, lesson_id: _li, ...transFields } = translation
      const { data, error } = await adminUpsertLessonTranslation(
        lessonIdForTrans,
        transLang,
        transFields as { title?: string; summary?: string | null; content_html?: string | null; status?: string },
      )
      if (error) return authError(error)
      result.translation = data
    }
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
