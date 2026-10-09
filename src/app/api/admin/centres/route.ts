import { NextResponse } from 'next/server'
import { adminListCentres, adminVerifyCentre, adminRejectCentre } from '@/lib/features/feature-service'

export async function GET() {
  const { data, error } = await adminListCentres()
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
