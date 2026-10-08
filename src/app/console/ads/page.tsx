import type { Metadata } from 'next'
import { adminListAds } from '@/lib/admin/marketing-service'
import { AdsManager } from '@/components/console/ads-manager'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Ad Slots — Console' }

export default async function AdsPage() {
  const { data: ads, error } = await adminListAds()
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ad Slots</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage ad placements across the site.</p>
      </div>
      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent></Card>}
      <AdsManager initialAds={ads ?? []} />
    </div>
  )
}
