import type { Metadata } from 'next'
import { listPublishedProducts } from '@/lib/commerce/commerce-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Books',
  description: 'Browse books, eBooks, workbooks and practice packs on SkillSetu.',
}

export default async function BooksPage() {
  const { data: products, error } = await listPublishedProducts({ productType: 'book' })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Books' }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Books & Resources</h1>
        <p className="text-muted-foreground mt-2">
          Practice workbooks, cheat sheets and study materials to complement your courses.
        </p>
      </div>

      {products && products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <a href={`/store/${p.slug}`} className="block">
                  <h3 className="font-semibold text-lg hover:text-primary">
                    {p.variants[0]?.name ?? p.slug}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {p.variants[0]?.format ?? 'digital'} · {(p.price_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: p.currency })}
                  </p>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No books available yet.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
