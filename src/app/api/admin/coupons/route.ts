import { NextResponse } from 'next/server'
import { adminListCoupons, adminCreateCoupon } from '@/lib/commerce/commerce-service'

export async function GET() {
  const { data, error } = await adminListCoupons()
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
  let body: { code?: string; description?: string; discount_type?: string; discount_value?: number; usage_limit?: number; expires_at?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.code || !body.discount_type || body.discount_value === undefined)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await adminCreateCoupon({
    code: body.code, description: body.description, discount_type: body.discount_type,
    discount_value: body.discount_value, usage_limit: body.usage_limit, expires_at: body.expires_at,
  })
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
