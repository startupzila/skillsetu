import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/commerce/commerce-service'

/** POST /api/commerce/coupons/validate — validate a coupon code. */
export async function POST(request: Request) {
  let body: { code?: string; orderTotalCents?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.code) {
    return NextResponse.json({ error: 'Missing `code`' }, { status: 400 })
  }

  const { data, error } = await validateCoupon(body.code, body.orderTotalCents ?? 0)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ data })
}
