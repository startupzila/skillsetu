import { NextResponse } from 'next/server'
import { adminUpdateCentreCourse, adminDeleteCentreCourse } from '@/lib/features/feature-service'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; courseId: string }> }) {
  const { courseId } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { data, error } = await adminUpdateCentreCourse(courseId, body as Parameters<typeof adminUpdateCentreCourse>[1])
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; courseId: string }> }) {
  const { courseId } = await params
  const { error } = await adminDeleteCentreCourse(courseId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
