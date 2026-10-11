import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { CentresDirectoryBrowser } from '@/components/shared/centres-directory-browser'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'
import { listStates } from '@/lib/features/jurisdiction-service'
import { Globe, Search, MapPin } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = lang === 'hi'
    ? 'सेंटर डायरेक्टरी — राज्य, ज़िला, शहर अनुसार खोजें | MioDemy'
    : 'Centres Directory — Search by State, District, City | MioDemy'
  const desc = lang === 'hi'
    ? 'भारत भर के स्किल और ट्रेनिंग सेंटर खोजें। राज्य, ज़िला और शहर के अनुसार फ़िल्टर करें, नाम से खोजें, और अपने नज़दीकी सेंटर का पेज देखें।'
    : 'Find skill and training centres across India. Filter by state, district and city, search by name, and view centre pages with courses, fees, reviews and contact details.'

  return {
    title,
    description: desc,
    keywords: lang === 'hi'
      ? ['सेंटर डायरेक्टरी', 'ट्रेनिंग सेंटर', 'स्किल सेंटर', 'भारत', 'राज्य', 'ज़िला', 'शहर']
      : ['centres directory', 'training centres', 'skill centres', 'India', 'state', 'district', 'city', 'find institutes'],
    alternates: {
      canonical: `${siteUrl}${localePath(lang, '/centres/directory')}`,
    },
    openGraph: { title, description: desc, type: 'website', locale: lang === 'hi' ? 'hi_IN' : 'en_US' },
  }
}

export default async function CentresDirectoryPage() {
  const lang = await getLocale()
  const hi = lang === 'hi'

  // Fetch states for the initial dropdown (SSR)
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
            ? 'राज्य, ज़िला और शहर के अनुसार सेंटर खोजें। नाम से भी खोज सकते हैं। अपने नज़दीकी सेंटर का पेज देखें — courses, fees, reviews और contact details।'
            : 'Search centres by state, district and city. Search by name too. View centre pages with courses, fees, reviews and contact details.'}
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> {hi ? 'देश अनुसार' : 'By Country'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'राज्य अनुसार' : 'By State'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'ज़िला अनुसार' : 'By District'}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {hi ? 'शहर अनुसार' : 'By City'}</span>
          <span className="flex items-center gap-1.5"><Search className="h-4 w-4 text-primary" /> {hi ? 'नाम से खोजें' : 'Search by name'}</span>
        </div>
      </div>

      {/* Directory browser (client component with cascading filters + search) */}
      <CentresDirectoryBrowser lang={lang} initialStates={states} />

      {/* SEO content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">
          {hi ? 'भारत भर के ट्रेनिंग सेंटर' : 'Training Centres Across India'}
        </h2>
        <p>
          {hi
            ? 'हमारी डायरेक्टरी में भारत के सभी प्रमुख राज्यों और शहरों के verified स्किल और ट्रेनिंग सेंटर शामिल हैं। Excel, Tally, Digital Marketing, Computer Training और बहुत कुछ सीखने के लिए अपने नज़दीकी सेंटर खोजें। हर सेंटर की details — courses, fees, reviews, contact — एक ही जगह पर उपलब्ध हैं।'
            : 'Our directory includes verified skill and training centres across all major states and cities in India. Find centres near you for Excel, Tally, Digital Marketing, Computer Training and more. Each centre\'s details — courses, fees, reviews, contact information — are available in one place.'}
        </p>
      </div>
    </div>
  )
}
