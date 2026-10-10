import { NextResponse } from 'next/server'
import { adminCreateJurisdiction, adminDeleteJurisdiction } from '@/lib/features/jurisdiction-service'

export async function POST(request: Request) {
  let body: { name?: string; type?: string; parent_id?: string | null }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.name || !body.type) return NextResponse.json({ error: 'Missing name or type' }, { status: 400 })
  const { data, error } = await adminCreateJurisdiction({ name: body.name, type: body.type, parent_id: body.parent_id ?? null })
  if (error) {
    if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await adminDeleteJurisdiction(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
