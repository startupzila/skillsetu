import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/commerce/commerce-service'

/** POST /api/commerce/orders — create an order (checkout). */
export async function POST(request: Request) {
  let body: { productId?: string; variantId?: string; couponCode?: string }
  try {
    body = await request.json()
  } catch {
    // Try form data
    const formData = await request.formData()
    body = {
      productId: formData.get('productId') as string,
      couponCode: formData.get('couponCode') as string || undefined,
    }
  }

  if (!body.productId) {
    return NextResponse.json({ error: 'Missing `productId`' }, { status: 400 })
  }

  const { data, error } = await createOrder({
    productId: body.productId,
    variantId: body.variantId,
    couponCode: body.couponCode,
  })

  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
