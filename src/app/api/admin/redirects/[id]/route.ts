import { NextResponse } from 'next/server'
import { adminDeleteRedirect, adminToggleRedirect } from '@/lib/seo/seo-service'

/** POST /api/admin/redirects/[id]?action=toggle — toggle active status. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'toggle') {
    const { data, error } = await adminToggleRedirect(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/** DELETE /api/admin/redirects/[id] — delete a redirect. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteRedirect(id)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
