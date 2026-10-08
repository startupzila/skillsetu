import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListProducts } from '@/lib/commerce/commerce-service'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Send } from 'lucide-react'

export const metadata: Metadata = { title: 'Products — Console' }

function formatPrice(cents: number, currency: string) {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency })
}

export default async function ConsoleProductsPage() {
  const { data: products, error } = await adminListProducts()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage books, resources and digital products.</p>
        </div>
        <Button asChild><Link href="/console/products/new"><Plus className="h-4 w-4 mr-1.5" />New Product</Link></Button>
      </div>

      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error.includes('Authentication') ? 'Please sign in.' : error.includes('FORBIDDEN') ? 'Insufficient permissions.' : `Error: ${error}`}</CardContent></Card>}

      {products && products.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Price</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {products.map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium">{(p.variants as { name: string }[])?.[0]?.name ?? p.slug}</td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-muted-foreground">{p.product_type as string}</td>
                  <td className="px-4 py-3">{formatPrice(p.price_cents as number, p.currency as string)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status as string} /></td>
                  <td className="px-4 py-3 text-right">
                    {p.status !== 'published' && (
                      <form action={`/api/admin/products/${p.id}?action=publish`} method="post">
                        <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0"><Send className="h-4 w-4" /></Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error && <Card><CardContent className="py-12 text-center text-muted-foreground">No products yet.</CardContent></Card>}
    </div>
  )
}
