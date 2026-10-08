import { NextResponse } from 'next/server'
import { adminListProducts, adminCreateProduct } from '@/lib/commerce/commerce-service'

export async function GET() {
  const { data, error } = await adminListProducts()
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
  let body: { slug?: string; product_type?: string; price_cents?: number; variant_name?: string; variant_format?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.slug || !body.product_type || body.price_cents === undefined || !body.variant_name)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await adminCreateProduct({
    slug: body.slug, product_type: body.product_type, price_cents: body.price_cents,
    variant_name: body.variant_name, variant_format: body.variant_format,
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
