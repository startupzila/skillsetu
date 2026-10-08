import { NextResponse } from 'next/server'
import { adminToggleCommentResolved, adminDeleteComment } from '@/lib/admin/editorial-service'

/** POST /api/admin/editorial/comments/[id]?action=resolve — toggle resolved. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'resolve') {
    const { data, error } = await adminToggleCommentResolved(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/** DELETE /api/admin/editorial/comments/[id] — delete a comment. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteComment(id)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
