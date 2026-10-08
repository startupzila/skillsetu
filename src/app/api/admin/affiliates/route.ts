import { NextResponse } from 'next/server'
import { adminListAffiliates, adminCreateAffiliate } from '@/lib/admin/marketing-service'

export async function GET() {
  const { data, error } = await adminListAffiliates()
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
  let body: { provider?: string; product_name?: string; destination_url?: string; tracking_url?: string; disclosure?: string; placement?: string; campaign?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.provider || !body.product_name || !body.destination_url)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await adminCreateAffiliate(body)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
