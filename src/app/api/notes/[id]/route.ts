import { NextResponse } from 'next/server'
import { updateNote, deleteNote } from '@/lib/learning'

/**
 * PATCH /api/notes/[id]
 *   Body: { content: string }
 *   Updates a note (only the owner can, via RLS).
 *
 * DELETE /api/notes/[id]
 *   Deletes a note (only the owner can, via RLS).
 *
 * Requires authentication.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: { content?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.content || !body.content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  try {
    const { data, error } = await updateNote(id, body.content.trim())
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const { error } = await deleteNote(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
