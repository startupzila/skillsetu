import type { Metadata } from 'next'
import { adminListCoupons } from '@/lib/commerce/commerce-service'
import { Card, CardContent } from '@/components/ui/card'
import { CouponsManager } from '@/components/console/coupons-manager'

export const metadata: Metadata = { title: 'Coupons — Console' }

export default async function CouponsPage() {
  const { data: coupons, error } = await adminListCoupons()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage discount coupons for the store.</p>
      </div>

      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error.includes('Authentication') ? 'Please sign in.' : `Error: ${error}`}</CardContent></Card>}

      <CouponsManager initialCoupons={coupons ?? []} />
    </div>
  )
}
