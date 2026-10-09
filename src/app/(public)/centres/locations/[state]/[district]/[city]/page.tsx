import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin } from 'lucide-react'

interface PageProps { params: Promise<{ state: string; district: string; city: string }> }

function humanize(slug: string) { return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state, district, city } = await params
  const cityName = humanize(city), stateName = humanize(state), districtName = humanize(district)
  return {
    title: `Skill & Training Centres in ${cityName}, ${districtName}, ${stateName} | MioDemy`,
    description: `Find verified skill and training centres in ${cityName}, ${districtName}, ${stateName}. Browse courses, fees, reviews and contact details for training institutes in ${cityName}.`,
  }
}

export default async function CityCentresPage({ params }: PageProps) {
  const { state, district, city } = await params
  const stateName = humanize(state), districtName = humanize(district), cityName = humanize(city)
  const supabase = await createServerSupabaseClient()

  const { data: allCentres } = await supabase.from('training_centres')
    .select(`id, slug, name, about, established_year, email, phone, locations:centre_locations(city, district, state, is_primary)`)
    .eq('status', 'verified')

  const centres = (allCentres ?? []).filter((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    return locs?.some(l => (l.city as string)?.toLowerCase() === cityName.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: 'By Location', href: '/centres/locations' },
        { label: stateName, href: `/centres/locations/${state}` }, { label: districtName, href: `/centres/locations/${state}/${district}` }, { label: cityName }
      ]} />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Training Centres in {cityName}, {districtName}</h1>
        <p className="text-muted-foreground mt-2">{centres.length} centre{centres.length !== 1 ? 's' : ''} found in {cityName}.</p>
      </div>

      {centres.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {centres.map((c: Record<string, unknown>) => (
            <Card key={c.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div><Link href={`/centres/${c.slug as string}`} className="font-semibold text-lg hover:text-primary">{c.name as string}</Link>
                    {c.established_year && <p className="text-xs text-muted-foreground">Since {c.established_year as number}</p>}</div>
                </div>
                {c.about && <p className="text-sm text-muted-foreground line-clamp-2">{c.about as string}</p>}
                {c.phone && <p className="text-sm text-muted-foreground">📞 {c.phone as string}</p>}
                <Link href={`/centres/${c.slug as string}`} className="text-sm text-primary hover:underline">View Details →</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground text-center py-8 mb-12">No centres found in {cityName} yet. <Link href="/centres/register" className="text-primary hover:underline">Register your centre</Link></p>}

      {/* SEO content */}
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Skill & Training Centres in {cityName}, {districtName}, {stateName}</h2>
        <p>Looking for training centres in {cityName}? Find verified skill training institutes in {cityName}, {districtName}, {stateName}. Browse courses in Excel, Tally, Digital Marketing, computer skills and more. Each centre profile includes course details, fees, duration, mode (offline/online/hybrid), office hours, contact information, and student reviews.</p>
        <p>Popular searches: training centres in {cityName}, computer training institutes in {cityName}, Excel coaching in {cityName}, Tally classes in {cityName}, Digital Marketing courses in {cityName}, skill development centres in {cityName}.</p>

        <h3 className="text-lg font-semibold text-foreground mt-4">Frequently Asked Questions</h3>
        <div className="space-y-2 mt-2">
          <div><strong>How to find training centres in {cityName}?</strong><br />Browse the list above or use our search to find verified training centres in {cityName}, {districtName}.</div>
          <div><strong>Are these centres verified?</strong><br />Yes, all centres listed are verified by MioDemy before going live.</div>
          <div><strong>Can I register my training centre in {cityName}?</strong><br />Yes! Click "Register Centre" to list your institute on MioDemy.</div>
        </div>
      </div>
    </div>
  )
}
