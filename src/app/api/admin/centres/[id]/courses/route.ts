import { NextResponse } from 'next/server'
import { adminAddCentreCourse, adminDeleteCentreCourse, adminUpdateCentreCourse } from '@/lib/features/feature-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: { title?: string; description?: string; duration_months?: number; fees?: number; mode?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  const { data, error } = await adminAddCentreCourse({ centre_id: id, ...body })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
