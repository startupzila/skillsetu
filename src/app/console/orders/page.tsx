import type { Metadata } from 'next'
import { adminListOrders } from '@/lib/commerce/commerce-service'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

export const metadata: Metadata = { title: 'Orders — Console' }

function formatPrice(cents: number, currency: string) {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency })
}

export default async function ConsoleOrdersPage() {
  const { data: orders, error } = await adminListOrders()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage customer orders. Mark orders as paid to grant entitlements.</p>
      </div>

      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error.includes('Authentication') ? 'Please sign in.' : `Error: ${error}`}</CardContent></Card>}

      {orders && orders.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left px-4 py-3 font-semibold">Order ID</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Total</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {orders.map((o: Record<string, unknown>) => (
                <tr key={o.id as string} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-xs">{(o.id as string).slice(0, 8)}…</td>
                  <td className="px-4 py-3 hidden md:table-cell">{(o.user as { display_name: string | null })?.display_name ?? '—'}</td>
                  <td className="px-4 py-3">{formatPrice(o.total_cents as number, o.currency as string)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status as string} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{new Date(o.created_at as string).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {o.status === 'pending' && (
                      <form action={`/api/admin/orders/${o.id}?action=markPaid`} method="post">
                        <Button type="submit" size="sm" variant="ghost" className="h-8">
                          <Check className="h-4 w-4 mr-1" />Mark paid
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error && <Card><CardContent className="py-12 text-center text-muted-foreground">No orders yet.</CardContent></Card>}
    </div>
  )
}
