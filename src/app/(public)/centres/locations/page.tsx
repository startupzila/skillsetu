import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ChevronRight } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Training Centres by Location — Browse All States & Cities | MioDemy',
  description: 'Browse training centres across India by state, district and city. Find skill training institutes near you.',
}

export default async function CentresLocationsPage() {
  // Wrap all Supabase access in safeFetch so a missing-env-var deploy
  // renders a friendly fallback instead of a 500.
  const data = await safeFetch(async () => {
    const supabase = await createServerSupabaseClient()
    const { data: states } = await supabase
      .from('jurisdictions').select('id, name')
      .eq('type', 'state').eq('is_active', true).order('name')
    const { data: centres } = await supabase
      .from('training_centres').select(`locations:centre_locations(state, is_primary)`)
      .eq('status', 'verified')
    return { states: states ?? [], centres: centres ?? [] }
  })

  if (!data) return <ServiceUnavailable />
  const { states, centres } = data

  const stateCounts: Record<string, number> = {}
  centres.forEach((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    locs?.forEach((l) => { if (l.state) stateCounts[l.state as string] = (stateCounts[l.state as string] ?? 0) + 1 })
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: 'By Location' }]} />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Training Centres by Location</h1>
        <p className="text-muted-foreground mt-2">Browse training centres across India. Select a state to find centres in your area.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(states ?? []).map((s: Record<string, unknown>) => {
          const name = s.name as string; const slug = name.toLowerCase().replace(/\s+/g, '-')
          const count = stateCounts[name] ?? 0
          return (
            <Card key={s.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <Link href={`/centres/locations/${slug}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" />
                    <div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">{count} centre{count !== 1 ? 's' : ''}</p></div>
                  </div><ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Find Training Centres Across India</h2>
        <p>Browse our directory of verified skill and training centres across India. From computer training institutes to Excel coaching centres, Tally training providers, Digital Marketing academies and more — find verified training centres in your state, district, and city.</p>
      </div>
    </div>
  )
}
