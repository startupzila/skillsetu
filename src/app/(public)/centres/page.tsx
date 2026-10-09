import Link from 'next/link'
import type { Metadata } from 'next'
import { listVerifiedCentres } from '@/lib/features/feature-service'
import { listStates } from '@/lib/features/jurisdiction-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CentresBrowser } from '@/components/shared/centres-browser'

export const metadata: Metadata = {
  title: 'Skill & Training Centres — Find Institutes Near You',
  description: 'Browse verified skill and training centres across India. Find courses, fees, admission details, reviews, and contact information for training institutes near you.',
}

export default async function CentresPage({ searchParams }: { searchParams: Promise<{ city?: string; state?: string; lat?: string; lng?: string }> }) {
  const { city, state } = await searchParams
  const [{ data: centres }, states] = await Promise.all([
    listVerifiedCentres({ city, state }),
    listStates(),
  ])

  // Get unique states from centres for filter display
  const centreStates = new Set<string>()
  ;(centres ?? []).forEach((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    locs?.forEach((l) => centreStates.add(l.state as string))
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Training Centres' }]} />

      <div className="mt-6 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill & Training Centres</h1>
          <p className="text-muted-foreground mt-2">
            Find verified skills and training institutes near you. Browse courses, fees, reviews, and admission details.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/centres/register"><Plus className="h-4 w-4 mr-1.5" />Register Centre</Link>
        </Button>
      </div>

      {/* State filter chips */}
      {centreStates.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/centres" className="rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent">All</Link>
          {Array.from(centreStates).map((s) => (
            <Link key={s} href={`/centres?state=${encodeURIComponent(s)}`} className="rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent capitalize">{s}</Link>
          ))}
        </div>
      )}

      {/* Browser with search + load more */}
      <CentresBrowser initialCentres={centres ?? []} />
    </div>
  )
}
