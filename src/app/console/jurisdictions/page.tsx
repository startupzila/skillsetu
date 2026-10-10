import type { Metadata } from 'next'
import { adminListJurisdictions, adminCreateJurisdiction, adminDeleteJurisdiction } from '@/lib/features/jurisdiction-service'
import { Card, CardContent } from '@/components/ui/card'
import { JurisdictionsManager } from '@/components/console/jurisdictions-manager'

export const metadata: Metadata = { title: 'Jurisdictions — Console' }

export default async function ConsoleJurisdictionsPage() {
  const { data: jurisdictions, error } = await adminListJurisdictions()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jurisdictions</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage Country &gt; State &gt; District &gt; City taxonomy for locations.</p>
      </div>
      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent></Card>}
      <JurisdictionsManager initialJurisdictions={jurisdictions ?? []} />
    </div>
  )
}
