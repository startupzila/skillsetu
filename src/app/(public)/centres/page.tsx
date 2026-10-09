import Link from 'next/link'
import type { Metadata } from 'next'
import { listVerifiedCentres } from '@/lib/features/feature-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Globe, Building2, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Training Centres — Find Skills & Training Institutes Near You',
  description: 'Browse verified skills and training centres across India. Find courses, fees, admission details, reviews, and contact information for training institutes near you.',
}

export default async function CentresPage({ searchParams }: { searchParams: Promise<{ city?: string; state?: string }> }) {
  const { city, state } = await searchParams
  const { data: centres, error } = await listVerifiedCentres({ city, state })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Training Centres' }]} />

      <div className="mt-6 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Centres</h1>
          <p className="text-muted-foreground mt-2">
            Find verified skills and training institutes near you. Browse courses, fees, reviews, and admission details.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/centres/register">
            <Plus className="h-4 w-4 mr-1.5" />
            Register Centre
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/centres" className="rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent">All</Link>
        {state && <Badge variant="secondary" className="capitalize">{state}</Badge>}
        {city && <Badge variant="secondary" className="capitalize">{city}</Badge>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {centres && centres.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {centres.map((c: Record<string, unknown>) => {
            const locs = c.locations as Array<Record<string, unknown>>
            const primaryLoc = locs?.find((l) => l.is_primary) ?? locs?.[0]
            return (
              <Card key={c.id as string} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/centres/${c.slug}`} className="font-semibold text-lg hover:text-primary">
                        {c.name as string}
                      </Link>
                      {c.established_year && (
                        <p className="text-xs text-muted-foreground">Since {c.established_year as number}</p>
                      )}
                    </div>
                  </div>
                  {c.about && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.about as string}</p>
                  )}
                  {primaryLoc && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {primaryLoc.city as string}, {primaryLoc.state as string}
                      </p>
                    </div>
                  )}
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/centres/${c.slug}`}>View Details</Link>
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
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No training centres found. Register your centre to get listed!
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
