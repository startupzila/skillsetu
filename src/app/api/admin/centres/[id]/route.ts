import { NextResponse } from 'next/server'
import { adminVerifyCentre, adminRejectCentre } from '@/lib/features/feature-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  if (action === 'verify') {
    const { data, error } = await adminVerifyCentre(id)
    if (error) {
      if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
      if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }
  if (action === 'reject') {
    const { data, error } = await adminRejectCentre(id)
    if (error) {
      if (error.includes('Authentication')) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
      if (error.includes('FORBIDDEN')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
