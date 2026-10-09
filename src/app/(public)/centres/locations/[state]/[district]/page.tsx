import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, ChevronRight } from 'lucide-react'

interface PageProps { params: Promise<{ state: string; district: string }> }

function humanize(slug: string) { return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state, district } = await params
  const stateName = humanize(state), districtName = humanize(district)
  return {
    title: `Skill & Training Centres in ${districtName}, ${stateName} | MioDemy`,
    description: `Find verified skill and training centres in ${districtName}, ${stateName}. Browse courses, fees, reviews and admission details for training institutes in ${districtName}.`,
  }
}

export default async function DistrictCentresPage({ params }: PageProps) {
  const { state, district } = await params
  const stateName = humanize(state), districtName = humanize(district)
  const supabase = await createServerSupabaseClient()

  // Get cities in this district
  const { data: distJur } = await supabase.from('jurisdictions').select('id').eq('name', districtName).eq('type', 'district').single()
  if (!distJur) notFound()

  const { data: cities } = await supabase.from('jurisdictions').select('id, name').eq('type', 'city').eq('parent_id', distJur.id).eq('is_active', true).order('name')

  // Get centres — match by district name in locations
  const { data: allCentres } = await supabase.from('training_centres')
    .select(`id, slug, name, about, established_year, locations:centre_locations(city, district, state, is_primary)`)
    .eq('status', 'verified')

  const centres = (allCentres ?? []).filter((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    return locs?.some(l => (l.district as string)?.toLowerCase() === districtName.toLowerCase() || (l.city as string)?.toLowerCase() === districtName.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: 'By Location', href: '/centres/locations' }, { label: stateName, href: `/centres/locations/${state}` }, { label: districtName }]} />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Training Centres in {districtName}, {stateName}</h1>
        <p className="text-muted-foreground mt-2">{centres.length} centre{centres.length !== 1 ? 's' : ''} found in {districtName}.</p>
      </div>

      {(cities ?? []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Browse by City/Tehsil</h2>
          <div className="flex flex-wrap gap-2">
            {cities?.map((c: Record<string, unknown>) => {
              const cSlug = (c.name as string).toLowerCase().replace(/\s+/g, '-')
              return <Link key={c.id as string} href={`/centres/locations/${state}/${district}/${cSlug}`} className="rounded-full border px-4 py-1.5 text-sm hover:bg-accent">{c.name as string}</Link>
            })}
          </div>
        </div>
      )}

      {centres.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {centres.map((c: Record<string, unknown>) => {
            const locs = c.locations as Array<Record<string, unknown>>
            const loc = locs?.find(l => l.is_primary) ?? locs?.[0]
            return (
              <Card key={c.id as string} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-3 shrink-0"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div><Link href={`/centres/${c.slug as string}`} className="font-semibold text-lg hover:text-primary">{c.name as string}</Link>
                      {c.established_year && <p className="text-xs text-muted-foreground">Since {c.established_year as number}</p>}</div>
                  </div>
                  {c.about && <p className="text-sm text-muted-foreground line-clamp-2">{c.about as string}</p>}
                  {loc && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{loc.city as string}, {districtName}</p>}
                  <Link href={`/centres/${c.slug as string}`} className="text-sm text-primary hover:underline">View Details →</Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : <p className="text-sm text-muted-foreground text-center py-8 mb-12">No centres found in {districtName} yet.</p>}

      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Training Centres in {districtName}, {stateName}</h2>
        <p>Find verified skill and training centres in {districtName}, {stateName}. Browse institutes offering courses in Excel, Tally, Digital Marketing, computer skills and more. Each centre profile includes courses, fees, reviews and contact information.</p>
      </div>
    </div>
  )
}
