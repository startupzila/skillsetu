import { NextResponse } from 'next/server'
import { adminUpdateMedia, adminDeleteMedia } from '@/lib/admin/media-service'

/** PATCH /api/admin/media/[id] — update metadata (alt_text, caption, etc.) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: {
    alt_text?: string | null
    caption?: string | null
    source?: string | null
    license?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = await adminUpdateMedia(id, body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

/** DELETE /api/admin/media/[id] — delete media asset + Storage file */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteMedia(id)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
