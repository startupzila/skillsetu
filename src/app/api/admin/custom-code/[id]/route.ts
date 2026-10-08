import { NextResponse } from 'next/server'
import { adminUpdateCustomCode, adminDeleteCustomCode } from '@/lib/content/pages-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: { name?: string; code?: string; is_active?: boolean; page_pattern?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = await adminUpdateCustomCode(id, body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteCustomCode(id)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
