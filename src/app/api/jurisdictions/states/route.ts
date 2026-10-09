import { NextResponse } from 'next/server'
import { listStates, listDistricts, listCities } from '@/lib/features/jurisdiction-service'

/** GET /api/jurisdictions/states?country=IN */
export async function GET() {
  const states = await listStates('IN')
  return NextResponse.json({ data: states })
}
