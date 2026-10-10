import { NextResponse } from 'next/server'
import { adminUpdateCourse, adminUpdateCourseTranslation, adminPublishCourse, adminArchiveCourse } from '@/lib/admin/content-service'

/**
 * /api/admin/courses/[id]
 *
 * PATCH — update a course. Accepts two shapes:
 *   { ...courseFields }                       → updates the courses row
 *   { translation: { lang, title, ... } }     → updates the course_translations row
 *   { course: {...}, translation: {...} }      → updates both in one call
 * POST (action=publish) — publish a course.
 * POST (action=archive) — archive a course.
 *
 * All require course.update or course.publish permissions.
 */
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

  const authError = (error: string) => {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return NextResponse.json({ error }, { status: 500 })
  }

  const result: { course?: unknown; translation?: unknown; error?: string } = {}

  // Course core fields
  const courseFields = (body.course as Record<string, unknown>) ?? pickCourseFields(body)
  if (Object.keys(courseFields).length > 0) {
    const { data, error } = await adminUpdateCourse(id, courseFields)
    if (error) return authError(error)
    result.course = data
  }

  // Translation fields
  const translation = (body.translation as { lang?: string } & Record<string, unknown>) | undefined
  if (translation && translation.lang) {
    const { lang, ...transFields } = translation
    const { data, error } = await adminUpdateCourseTranslation(id, lang as string, transFields as Record<string, unknown> as Parameters<typeof adminUpdateCourseTranslation>[2])
    if (error) return authError(error)
    result.translation = data
  }

  if (!result.course && !result.translation) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }
  return NextResponse.json({ data: result })
}

/** Pull only course-table fields from a flat body (so a flat PATCH still works). */
function pickCourseFields(body: Record<string, unknown>): Record<string, unknown> {
  const allowed = ['slug', 'status', 'difficulty', 'estimated_duration', 'default_language', 'thumbnail_media_id', 'published_at', 'last_reviewed_at', 'next_review_at']
  const out: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) out[k] = body[k]
  }
  return out
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'publish') {
    const { data, error } = await adminPublishCourse(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  if (action === 'archive') {
    const { data, error } = await adminArchiveCourse(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
