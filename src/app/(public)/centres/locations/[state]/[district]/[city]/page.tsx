import Link from 'next/link'
import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateJurisdictionSeo } from '@/lib/templates/jurisdiction-seo-templates'
import { JsonLdFaq } from '@/components/seo/json-ld'

interface PageProps { params: Promise<{ state: string; district: string; city: string }> }

function humanize(slug: string) { return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state, district, city } = await params
  const cityName = humanize(city), stateName = humanize(state), districtName = humanize(district)
  const seo = generateJurisdictionSeo({ locationName: cityName, parentName: districtName, type: 'city' })
  return {
    title: seo.seo_title,
    description: seo.seo_description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.seo_title,
      description: seo.seo_description,
      type: 'website',
    },
  }
}

export default async function CityCentresPage({ params }: PageProps) {
  const { state, district, city } = await params
  const stateName = humanize(state), districtName = humanize(district), cityName = humanize(city)
  const seo = generateJurisdictionSeo({ locationName: cityName, parentName: districtName, type: 'city' })

  const allCentres = await safeFetch(async () => {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('training_centres')
      .select(`id, slug, name, about, established_year, email, phone, locations:centre_locations(city, district, state, is_primary)`)
      .eq('status', 'verified')
    return data ?? []
  })

  if (!allCentres) return <ServiceUnavailable />

  const centres = allCentres.filter((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    return locs?.some(l => (l.city as string)?.toLowerCase() === cityName.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLdFaq faqs={seo.faqs} />

      <Breadcrumbs items={[
        { label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: 'Directory', href: '/centres/locations' },
        { label: stateName, href: `/centres/locations/${state}` }, { label: districtName, href: `/centres/locations/${state}/${district}` }, { label: cityName }
      ]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Training Centres in {cityName}, {districtName}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{seo.intro_paragraph}</p>
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

      {/* ── Auto-generated SEO content ── */}
      <section className="border-t pt-10 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">About Training Centres in {cityName}, {districtName}, {stateName}</h2>
        <p>{seo.intro_paragraph}</p>

        <div className="not-prose flex flex-wrap gap-1.5 mt-4">
          {seo.keywords.slice(0, 20).map((kw) => (
            <Badge key={kw} variant="outline" className="text-xs font-normal">{kw}</Badge>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t pt-10 mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {seo.faqs.map((faq, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
