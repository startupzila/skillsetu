import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Commerce service — products, orders, coupons, entitlements.
 *
 * Payment is abstracted behind an interface — the concrete provider
 * (Razorpay/Stripe) is chosen at launch. For MVP, orders are created
 * as 'pending' and can be manually marked 'paid' in the console.
 *
 * @see prisma/schema.prisma (Commerce section)
 */

// ── PRODUCTS (public) ──────────────────────────────────────

export interface PublicProduct {
  id: string
  slug: string
  product_type: string
  price_cents: number
  currency: string
  variants: Array<{
    id: string
    name: string
    price_cents: number
    format: string | null
    is_default: boolean
  }>
}

/** List published products (optionally filtered by type). */
export async function listPublishedProducts(opts?: { productType?: string }) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('products')
    .select(
      `id, slug, product_type, price_cents, currency, published_at,
       variants:product_variants(id, name, price_cents, format, is_default)`,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (opts?.productType) query = query.eq('product_type', opts.productType)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as PublicProduct[], error: null }
}

/** Get a single published product by slug. */
export async function getPublishedProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `id, slug, product_type, price_cents, currency, published_at,
       variants:product_variants(id, name, price_cents, format, storage_path, is_default)`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: product, error: null }
}

// ── ORDERS ─────────────────────────────────────────────────

export async function createOrder(input: {
  productId: string
  variantId?: string
  couponCode?: string
}) {
  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, slug, price_cents, currency, status')
    .eq('id', input.productId)
    .eq('status', 'published')
    .single()

  if (!product) return { data: null, error: 'Product not found' }

  let unitPriceCents = product.price_cents
  let variantId = input.variantId

  if (!variantId) {
    const { data: dv } = await supabase
      .from('product_variants')
      .select('id, price_cents')
      .eq('product_id', product.id)
      .eq('is_default', true)
      .single()
    if (dv) { variantId = dv.id; unitPriceCents = dv.price_cents }
  } else {
    const { data: v } = await supabase
      .from('product_variants')
      .select('price_cents')
      .eq('id', variantId)
      .single()
    if (v) unitPriceCents = v.price_cents
  }

  const totalCents = unitPriceCents
  let discountCents = 0
  let couponId: string | null = null

  if (input.couponCode) {
    const cr = await validateCoupon(input.couponCode, totalCents)
    if (cr.error) return { data: null, error: cr.error }
    if (cr.data) { discountCents = cr.data.discount_cents; couponId = cr.data.coupon_id }
  }

  const finalTotal = totalCents - discountCents

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: session.user.id,
      status: 'pending',
      total_cents: finalTotal,
      currency: product.currency,
      coupon_id: couponId,
      discount_cents: discountCents,
    })
    .select()
    .single()

  if (orderErr) return { data: null, error: orderErr.message }

  await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    product_variant_id: variantId,
    quantity: 1,
    unit_price_cents: unitPriceCents,
    total_price_cents: unitPriceCents,
  })

  return { data: order, error: null }
}

export async function listMyOrders() {
  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, status, total_cents, currency, discount_cents, created_at,
       items:order_items(product_id, product:products(slug, product_type))`,
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── COUPONS ────────────────────────────────────────────────

export async function validateCoupon(code: string, orderTotalCents: number) {
  const supabase = await createServerSupabaseClient()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, discount_type, discount_value, min_order_cents, max_discount_cents, usage_limit, used_count, starts_at, expires_at, status')
    .eq('code', code.toUpperCase())
    .eq('status', 'active')
    .single()

  if (error || !coupon) return { data: null, error: 'Invalid coupon code' }

  const now = new Date()
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { data: null, error: 'Coupon not yet active' }
  if (coupon.expires_at && new Date(coupon.expires_at) < now)
    return { data: null, error: 'Coupon has expired' }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { data: null, error: 'Coupon usage limit reached' }
  if (orderTotalCents < coupon.min_order_cents)
    return { data: null, error: 'Order does not meet minimum amount' }

  let discountCents = 0
  if (coupon.discount_type === 'fixed') {
    discountCents = coupon.discount_value
  } else {
    discountCents = Math.round((orderTotalCents * coupon.discount_value) / 100)
    if (coupon.max_discount_cents) discountCents = Math.min(discountCents, coupon.max_discount_cents)
  }
  discountCents = Math.min(discountCents, orderTotalCents)

  return {
    data: { coupon_id: coupon.id, discount_cents: discountCents, discount_type: coupon.discount_type, discount_value: coupon.discount_value },
    error: null,
  }
}

// ── ENTITLEMENTS ───────────────────────────────────────────

export async function checkEntitlement(productId: string) {
  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('entitlements')
    .select('id, expires_at')
    .eq('user_id', session.user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) return { entitled: false, error: error.message }
  if (!data) return { entitled: false, error: null }
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { entitled: false, error: 'Entitlement expired' }

  return { entitled: true, error: null, entitlement: data }
}

export async function listMyEntitlements() {
  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('entitlements')
    .select(
      `id, source, expires_at, download_count, created_at,
       product:products(id, slug, product_type,
         variants:product_variants(id, name, format, storage_path, is_default))`,
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function generateDownloadUrl(entitlementId: string) {
  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id, product_id, download_count')
    .eq('id', entitlementId)
    .eq('user_id', session.user.id)
    .single()

  if (!entitlement) return { url: null, error: 'Entitlement not found' }

  const { data: variant } = await supabase
    .from('product_variants')
    .select('storage_path')
    .eq('product_id', entitlement.product_id)
    .eq('is_default', true)
    .single()

  if (!variant?.storage_path) return { url: null, error: 'No downloadable file for this product' }

  const admin = createAdminClient()
  const { data: urlData, error: urlErr } = await admin.storage
    .from('downloads')
    .createSignedUrl(variant.storage_path, 3600)

  if (urlErr || !urlData) return { url: null, error: 'Failed to generate download URL' }

  // Increment download count
  await supabase
    .from('entitlements')
    .update({ download_count: (entitlement.download_count ?? 0) + 1 })
    .eq('id', entitlementId)

  await recordAudit({ action: 'resource.download', entityType: 'product', entityId: entitlement.product_id })
  return { url: urlData.signedUrl, error: null }
}

// ── ADMIN ──────────────────────────────────────────────────

export async function adminListProducts() {
  await requirePermission('book.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('products')
    .select(`id, slug, product_type, price_cents, currency, status, published_at, created_at,
       variants:product_variants(id, name, price_cents, format, is_default)`)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateProduct(input: {
  slug: string; product_type: string; price_cents: number; currency?: string;
  variant_name: string; variant_format?: string; variant_storage_path?: string
}) {
  await requirePermission('book.manage')
  const admin = createAdminClient()

  const { data: product, error: pErr } = await admin
    .from('products').insert({
      slug: input.slug, product_type: input.product_type,
      price_cents: input.price_cents, currency: input.currency ?? 'INR', status: 'draft',
    }).select().single()
  if (pErr) return { data: null, error: pErr.message }

  const { error: vErr } = await admin.from('product_variants').insert({
    product_id: product.id, name: input.variant_name, price_cents: input.price_cents,
    format: input.variant_format ?? null, storage_path: input.variant_storage_path ?? null, is_default: true,
  })
  if (vErr) return { data: null, error: vErr.message }
  await recordAudit({ action: 'product.create', entityType: 'product', entityId: product.id })
  return { data: product, error: null }
}

export async function adminPublishProduct(productId: string) {
  await requirePermission('book.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('products').update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', productId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminListOrders() {
  await requirePermission('order.read')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`id, status, total_cents, currency, discount_cents, created_at,
       user:profiles!orders_user_id_fkey(display_name)`)
    .order('created_at', { ascending: false }).limit(50)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminMarkOrderPaid(orderId: string) {
  await requirePermission('book.manage')
  const admin = createAdminClient()

  const { data: order, error: oErr } = await admin
    .from('orders').update({ status: 'paid' }).eq('id', orderId).select().single()
  if (oErr) return { data: null, error: oErr.message }

  await admin.from('payments').insert({
    order_id: orderId, provider: 'manual', amount_cents: order.total_cents,
    currency: order.currency, status: 'succeeded', paid_at: new Date().toISOString(),
  })

  const { data: items } = await admin.from('order_items').select('product_id').eq('order_id', orderId)
  for (const item of items ?? []) {
    await admin.from('entitlements').insert({
      user_id: order.user_id, product_id: (item as { product_id: string }).product_id,
      order_id: orderId, source: 'purchase',
    })
  }

  await recordAudit({ action: 'order.paid', entityType: 'order', entityId: orderId })
  return { data: order, error: null }
}

export async function adminListCoupons() {
  await requirePermission('book.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateCoupon(input: {
  code: string; description?: string; discount_type: string; discount_value: number;
  usage_limit?: number; expires_at?: string
}) {
  await requirePermission('book.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').insert({
    code: input.code.toUpperCase(), description: input.description ?? null,
    discount_type: input.discount_type, discount_value: input.discount_value,
    usage_limit: input.usage_limit ?? null, expires_at: input.expires_at ?? null, status: 'active',
  }).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminToggleCoupon(couponId: string) {
  await requirePermission('book.manage')
  const admin = createAdminClient()
  const { data: current } = await admin.from('coupons').select('status').eq('id', couponId).single()
  const newStatus = current?.status === 'active' ? 'inactive' : 'active'
  const { data, error } = await admin.from('coupons').update({ status: newStatus }).eq('id', couponId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
