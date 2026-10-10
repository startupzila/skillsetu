import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, ChevronRight, Phone } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface PageProps { params: Promise<{ state: string }> }

function humanize(slug: string) { return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params
  const stateName = humanize(state)
  return {
    title: `Skill & Training Centres in ${stateName} — Find Institutes | MioDemy`,
    description: `Browse verified skill and training centres in ${stateName}. Find Excel, Tally, Digital Marketing, computer training institutes with courses, fees, reviews and contact details.`,
  }
}

export default async function StateCentresPage({ params }: PageProps) {
  const { state } = await params
  const stateName = humanize(state)

  // Wrap all Supabase access in safeFetch so a missing-env-var deploy
  // renders a friendly fallback instead of a 500.
  const data = await safeFetch(async () => {
    const supabase = await createServerSupabaseClient()
    const { data: stateJur } = await supabase.from('jurisdictions').select('id').eq('name', stateName).eq('type', 'state').single()
    const { data: districts } = await supabase.from('jurisdictions').select('id, name').eq('type', 'district').eq('parent_id', stateJur?.id ?? '').eq('is_active', true).order('name')
    const { data: centres } = await supabase.from('training_centres')
      .select(`id, slug, name, about, established_year, locations:centre_locations(city, state, is_primary)`)
      .eq('status', 'verified').contains('locations', [{ state: stateName }]).order('name')
    return { stateFound: !!stateJur, districts: districts ?? [], centres: centres ?? [] }
  })

  if (!data) return <ServiceUnavailable />
  const { stateFound, districts, centres } = data
  if (!stateFound) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: 'By Location', href: '/centres/locations' }, { label: stateName }]} />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Skill & Training Centres in {stateName}</h1>
        <p className="text-muted-foreground mt-2">Find verified training institutes in {stateName}. {(centres ?? []).length} centre{(centres ?? []).length !== 1 ? 's' : ''} listed.</p>
      </div>

      {/* Districts */}
      {(districts ?? []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Browse by District</h2>
          <div className="flex flex-wrap gap-2">
            {districts?.map((d: Record<string, unknown>) => {
              const dSlug = (d.name as string).toLowerCase().replace(/\s+/g, '-')
              return <Link key={d.id as string} href={`/centres/locations/${state}/${dSlug}`} className="rounded-full border px-4 py-1.5 text-sm hover:bg-accent">{d.name as string}</Link>
            })}
          </div>
        </div>
      )}

      {/* Centres */}
      {(centres ?? []).length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {centres?.map((c: Record<string, unknown>) => {
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
                  {loc && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{loc.city as string}, {stateName}</p>}
                  <Link href={`/centres/${c.slug as string}`} className="text-sm text-primary hover:underline">View Details →</Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : <p className="text-sm text-muted-foreground text-center py-8 mb-12">No centres found in {stateName} yet. <Link href="/centres/register" className="text-primary hover:underline">Register your centre</Link></p>}

      {/* SEO Content */}
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Training Centres in {stateName}</h2>
        <p>Looking for skill training centres in {stateName}? MioDemy&apos;s directory lists verified training institutes across {stateName} offering courses in Excel, Tally, Digital Marketing, computer skills, and more. Browse centre profiles to find courses, fees, duration, admission details, reviews and contact information.</p>
        <p>Whether you&apos;re searching for computer training centres in {stateName}, Excel coaching classes, Tally training institutes, or Digital Marketing academies, our directory helps you find the right training provider near you.</p>
      </div>
    </div>
  )
}
