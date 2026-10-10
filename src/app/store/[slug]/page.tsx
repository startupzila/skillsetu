import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedProductBySlug, checkEntitlement } from '@/lib/commerce/commerce-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { safeFetch } from '@/lib/safe-fetch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Download, CheckCircle2, Lock } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await safeFetch(() => getPublishedProductBySlug(slug))
  const product = res?.data
  if (!product) return { title: 'Product not found' }
  return {
    title: product.variants?.[0]?.name ?? product.slug,
    description: `${product.product_type} — ${formatPrice(product.price_cents, product.currency)}`,
  }
}

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString('en-IN', { style: 'currency', currency })}`
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch resiliently: a throw (Supabase env vars missing on a fresh deploy)
  // renders a friendly fallback instead of a 500. A genuine "product not
  // found" still returns a proper 404 via notFound().
  let product = null
  let unavailable = false
  try {
    const res = await getPublishedProductBySlug(slug)
    product = res.data
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!product) notFound()

  // Check if the current user is entitled (null if not logged in)
  const entitlement = await safeFetch(() => checkEntitlement(product.id)) ?? { entitled: false, error: null }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Store', href: '/store' },
          { label: product.variants?.[0]?.name ?? product.slug },
        ]}
      />

      <div className="mt-6 grid md:grid-cols-2 gap-8">
        {/* Product info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {product.product_type.replace('_', ' ')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {product.variants?.[0]?.name ?? product.slug}
          </h1>
          <p className="text-2xl font-bold text-primary">
            {formatPrice(product.price_cents, product.currency)}
          </p>
        </div>

        {/* Purchase / Download card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Variants */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Available formats:</p>
              {product.variants?.map((v: { id: string; name: string; price_cents: number; format: string | null; is_default: boolean }) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {v.format && <Badge variant="outline" className="text-xs uppercase">{v.format}</Badge>}
                    {v.name}
                  </span>
                  <span className="font-medium">{formatPrice(v.price_cents, product.currency)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Actions */}
            {entitlement.entitled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  You own this product
                </div>
                <form action={`/api/commerce/download?entitlementId=${entitlement.entitlement?.id ?? ''}`} method="post">
                  <Button type="submit" className="w-full" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </form>
              </div>
            ) : (
              <form action="/api/commerce/orders" method="post">
                <input type="hidden" name="productId" value={product.id} />
                <Button type="submit" className="w-full" size="lg">
                  <Lock className="h-4 w-4 mr-2" />
                  Buy now
                </Button>
              </form>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Secure checkout · Instant access after purchase
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
