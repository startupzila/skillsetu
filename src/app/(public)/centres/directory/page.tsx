import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { JurisdictionDirectoryBrowser } from '@/components/shared/jurisdiction-directory-browser'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'
import { listStates } from '@/lib/features/jurisdiction-service'
import { Globe, Search, MapPin, Building2 } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = lang === 'hi'
    ? 'सेंटर डायरेक्टरी — राज्य, ज़िला, शहर अनुसार खोजें | MioDemy'
    : 'Centres Directory — Browse by State, District & City | MioDemy'
  const desc = lang === 'hi'
    ? 'भारत भर के स्किल और ट्रेनिंग सेंटर खोजें। राज्य, ज़िला और शहर के अनुसार ब्राउज़ करें। हर स्थान का विशेष SEO-अनुकूलित पेज।'
    : 'Browse skill and training centres across India by state, district and city. Each location has a dedicated SEO-optimized page with centres directory.'

  return {
    title,
    description: desc,
    keywords: lang === 'hi'
      ? ['सेंटर डायरेक्टरी', 'ट्रेनिंग सेंटर', 'स्किल सेंटर', 'भारत', 'राज्य', 'ज़िला', 'शहर', 'SEO']
      : ['centres directory', 'training centres directory', 'skill centres', 'India', 'state', 'district', 'city', 'SEO', 'browse by location'],
    alternates: {
      canonical: `${siteUrl}${localePath(lang, '/centres/directory')}`,
    },
    openGraph: { title, description: desc, type: 'website', locale: lang === 'hi' ? 'hi_IN' : 'en_US' },
  }
}

export default async function CentresDirectoryPage() {
  const lang = await getLocale()
  const hi = lang === 'hi'

  // Fetch states for the initial accordion (SSR)
  const states = await safeFetch(() => listStates('IN')) ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: tt(lang, 'nav.centres'), href: localePath(lang, '/centres') },
          { label: hi ? 'डायरेक्टरी' : 'Directory' },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {hi ? 'सेंटर डायरेक्टरी' : 'Centres Directory'}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {hi
            ? 'राज्य, ज़िला और शहर के अनुसार ब्राउज़ करें। हर स्थान का विशेष पेज है जो search engines में index होता है। नीचे किसी भी राज्य पर click करके expand करें।'
            : 'Browse by state, district and city. Each location has a dedicated SEO-optimized page indexed by search engines. Click any state below to expand.'}
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> {hi ? 'देश' : 'Country'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'राज्य' : 'State'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'ज़िला' : 'District'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'शहर' : 'City'}</span>
          <span className="flex items-center gap-1.5"><Search className="h-4 w-4 text-primary" /> {hi ? 'खोजें' : 'Search'}</span>
        </div>
      </div>

      {/* Jurisdiction directory browser (accordion + search + filter) */}
      <JurisdictionDirectoryBrowser lang={lang} initialStates={states} />

      {/* SEO content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">
          {hi ? 'भारत भर के ट्रेनिंग सेंटर — SEO अनुकूलित पेज' : 'Training Centres Across India — SEO-Optimized Location Pages'}
        </h2>
        <p>
          {hi
            ? 'हमारी डायरेक्टरी में भारत के सभी प्रमुख राज्यों, ज़िलों और शहरों के लिए विशेष पेज हैं। ये पेज search engines में index होते हैं ताकि आप "Skill Centres in Nagod", "Training Centres in Satna", "Skill & Training Centres in Madhya Pradesh" जैसे keywords पर आसानी से अपने नज़दीकी सेंटर ढूंढ सकें।'
            : 'Our directory includes dedicated, SEO-optimized pages for every state, district and city in India. These pages are indexed by search engines so you can easily find centres near you by searching keywords like "Skill Centres in Nagod", "Training Centres in Satna", "Skill & Training Centres in Madhya Pradesh" etc.'}
        </p>
        <p>
          {hi
            ? 'हर पेज पर उस स्थान के verified सेंटर की सूची, courses, fees, reviews और contact details उपलब्ध हैं। नीचे दिए गए accordion से किसी भी राज्य को expand करें, फिर ज़िला और शहर चुनें।'
            : 'Each page lists verified centres in that location with courses, fees, reviews and contact details. Expand any state in the accordion below, then select a district and city.'}
        </p>
      </div>
    </div>
  )
}
