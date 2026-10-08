import type { Metadata } from 'next'
import { adminListAffiliates } from '@/lib/admin/marketing-service'
import { AffiliatesManager } from '@/components/console/affiliates-manager'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Affiliate Links — Console' }

export default async function AffiliatesPage() {
  const { data: affiliates, error } = await adminListAffiliates()
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Affiliate Links</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage affiliate links with clear disclosure.</p>
      </div>
      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent></Card>}
      <AffiliatesManager initialAffiliates={affiliates ?? []} />
    </div>
  )
}
