import { NextResponse } from 'next/server'
import { adminListCourses, adminCreateCourse, type CourseInput } from '@/lib/admin/content-service'

/**
 * GET /api/admin/courses — list all courses (including drafts) for console.
 * POST /api/admin/courses — create a new course.
 *
 * Both require authentication + course.read / course.create permissions.
 */
export async function GET() {
  const { data, error } = await adminListCourses()
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

export async function POST(request: Request) {
  let body: CourseInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.title) {
    return NextResponse.json({ error: 'Missing `slug` or `title`' }, { status: 400 })
  }

  const { data, error } = await adminCreateCourse(body)
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
