import { NextResponse } from 'next/server'
import { adminListCustomCode, adminCreateCustomCode } from '@/lib/content/pages-service'

export async function GET() {
  const { data, error } = await adminListCustomCode()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  let body: { name?: string; location?: string; code?: string; page_pattern?: string | null; is_active?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.name || !body.location || !body.code) {
    return NextResponse.json({ error: 'Missing `name`, `location`, or `code`' }, { status: 400 })
  }

  const { data, error } = await adminCreateCustomCode(body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
