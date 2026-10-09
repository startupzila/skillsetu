import { NextResponse } from 'next/server'
import { listCities } from '@/lib/features/jurisdiction-service'

/** GET /api/jurisdictions/cities?districtId=<uuid> */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const districtId = searchParams.get('districtId')
  if (!districtId) return NextResponse.json({ error: 'Missing districtId' }, { status: 400 })
  const cities = await listCities(districtId)
  return NextResponse.json({ data: cities })
}
