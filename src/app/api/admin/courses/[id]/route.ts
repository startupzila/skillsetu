import { NextResponse } from 'next/server'
import { adminUpdateCourse, adminPublishCourse, adminArchiveCourse } from '@/lib/admin/content-service'

/**
 * /api/admin/courses/[id]
 *
 * PATCH — update a course (status, difficulty, etc.).
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

  const { data, error } = await adminUpdateCourse(id, body)
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
