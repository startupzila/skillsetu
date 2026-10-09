import Link from 'next/link'
import type { Metadata } from 'next'
import { listVerifiedCentres } from '@/lib/features/feature-service'
import { listStates } from '@/lib/features/jurisdiction-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CentresBrowser } from '@/components/shared/centres-browser'

export const metadata: Metadata = {
  title: 'Skill & Training Centres in India — Find Institutes Near You | MioDemy',
  description: 'Browse verified skill and training centres across India. Find courses, fees, admission details, reviews, and contact information for training institutes in your city.',
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

      {/* Browser with search + hierarchical filter + load more */}
      <CentresBrowser initialCentres={centres ?? []} states={states} />

      {/* SEO Content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Find Skill & Training Centres Across India</h2>
        <p>MioDemy&apos;s Training Centre Directory helps you find verified skill training institutes across India. Whether you&apos;re looking for Excel training centres in Mumbai, Tally courses in Delhi, Digital Marketing institutes in Bengaluru, or computer training centres in your city, our directory connects you with verified training providers.</p>
        <p>Each centre profile includes complete details: courses offered with fees and duration, office hours, contact information, location with address, student reviews and ratings, and online admission options. Browse by state, district, or city to find training centres near you.</p>
        <h3 className="text-lg font-semibold text-foreground mt-4">Popular Searches</h3>
        <p>Training centres in Maharashtra, Training centres in Madhya Pradesh, Training centres in Delhi, Training centres in Karnataka, Training centres in Uttar Pradesh, Excel training institutes, Tally training centres, Digital Marketing institutes near me, computer training centres, skill development centres.</p>
      </div>

      {/* FAQs */}
      <div className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        {[
          { q: 'How do I find training centres near me?', a: 'Use the search bar or filter by State, District, and City to find verified training centres in your area. You can also use the "Use My Location" button for automatic detection.' },
          { q: 'Are these training centres verified?', a: 'Yes, all centres listed on MioDemy are verified by our team before going live. Each centre has a verified badge on their profile.' },
          { q: 'Can I register my training centre on MioDemy?', a: 'Yes! Click "Register Centre" and fill out the registration form. Our team will verify your details and your centre page will go live.' },
          { q: 'What information do training centre profiles include?', a: 'Each profile includes courses offered, fees, duration, mode (offline/online/hybrid), office hours, contact details, location, reviews, and ratings.' },
        ].map((faq, i) => (
          <div key={i} className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
            <p className="text-sm text-muted-foreground">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
