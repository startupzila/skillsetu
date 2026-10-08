import { NextResponse } from 'next/server'
import { adminListPages, adminCreatePage } from '@/lib/content/pages-service'

export async function GET() {
  const { data, error } = await adminListPages()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  let body: { slug?: string; title?: string; content?: string; meta_description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.title || !body.content) {
    return NextResponse.json({ error: 'Missing `slug`, `title`, or `content`' }, { status: 400 })
  }

  const { data, error } = await adminCreatePage(body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
