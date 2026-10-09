import { NextResponse } from 'next/server'
import { adminGetCentre, adminUpdateCentre, adminUpdateCentreLocation, adminDeleteCentre } from '@/lib/features/feature-service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await adminGetCentre(id)
  if (error) {
    if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Delete centre
  if (action === 'delete') {
    const { error } = await adminDeleteCentre(id)
    if (error) {
      if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
      if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  // Update location
  if (action === 'update-location') {
    const locId = searchParams.get('locationId')
    if (!locId) return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
    const { data, error } = await adminUpdateCentreLocation(locId, body as Parameters<typeof adminUpdateCentreLocation>[1])
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Update centre info
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { data, error } = await adminUpdateCentre(id, body as Parameters<typeof adminUpdateCentre>[1])
  if (error) {
    if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await adminDeleteCentre(id)
  if (error) {
    if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
