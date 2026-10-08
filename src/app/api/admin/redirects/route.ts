import { NextResponse } from 'next/server'
import { adminCreateRedirect, adminListRedirects } from '@/lib/seo/seo-service'

/** GET /api/admin/redirects — list all redirects. */
export async function GET() {
  const { data, error } = await adminListRedirects()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

/** POST /api/admin/redirects — create a redirect. */
export async function POST(request: Request) {
  let body: { from_path?: string; to_url?: string; status_code?: number; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.from_path || !body.to_url) {
    return NextResponse.json({ error: 'Missing `from_path` or `to_url`' }, { status: 400 })
  }

  const { data, error } = await adminCreateRedirect({
    from_path: body.from_path,
    to_url: body.to_url,
    status_code: body.status_code,
    notes: body.notes,
  })

  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
