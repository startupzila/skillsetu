import Link from 'next/link'
import type { Metadata } from 'next'
import { listPublishedProducts } from '@/lib/commerce/commerce-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, BookOpen, Package } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'

export const metadata: Metadata = {
  title: 'Store',
  description: 'Browse books, resources and practice packs on MioDemy.',
}

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString('en-IN', { style: 'currency', currency })}`
}

export default async function StorePage() {
  const res = await safeFetch(() => listPublishedProducts())
  const products = res?.data ?? []
  const error = res?.error ?? null

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Store' }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Store</h1>
        <p className="text-muted-foreground mt-2">
          Books, workbooks, practice packs and resources to support your learning.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {products && products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.product_type === 'book' ? BookOpen : Package
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {product.product_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/store/${product.slug}`} className="hover:text-primary">
                      {product.variants[0]?.name ?? product.slug}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {v.format && <Badge variant="outline" className="text-xs uppercase">{v.format}</Badge>}
                        {v.name}
                      </span>
                      <span className="font-medium">{formatPrice(v.price_cents, product.currency)}</span>
                    </div>
                  ))}
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/store/${product.slug}`}>
                      <Download className="h-4 w-4 mr-1.5" />
                      View details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No products available yet.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
