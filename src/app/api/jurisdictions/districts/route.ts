import { NextResponse } from 'next/server'
import { listDistricts } from '@/lib/features/jurisdiction-service'

/** GET /api/jurisdictions/districts?stateId=<uuid> */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stateId = searchParams.get('stateId')
  if (!stateId) return NextResponse.json({ error: 'Missing stateId' }, { status: 400 })
  const districts = await listDistricts(stateId)
  return NextResponse.json({ data: districts })
}
