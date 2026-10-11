import Link from 'next/link'
import type { Metadata } from 'next'
import {
  safeListPublishedMockTests,
  type MockTestListItem,
} from '@/lib/content/mock-test-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, ArrowRight, BookOpen, Gauge, FileQuestion } from 'lucide-react'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title =
    lang === 'hi'
      ? 'मॉक टेस्ट — मुफ्त ऑनलाइन प्रैक्टिस टेस्ट | MioDemy'
      : 'Mock Tests — Free Online Practice Tests | MioDemy'
  const desc =
    lang === 'hi'
      ? 'अपनी तैयारी करें — Excel, PowerPoint, Word, Digital Marketing और बहुत कुछ पर मुफ्त ऑनलाइन मॉक टेस्ट। समय सीमित परीक्षा जैसा अनुभव।'
      : 'Prepare with free online mock tests on Excel, PowerPoint, Word, Digital Marketing and more. Timed, exam-style practice tests.'

  return {
    title,
    description: desc,
    keywords:
      lang === 'hi'
        ? ['मॉक टेस्ट', 'प्रैक्टिस टेस्ट', 'ऑनलाइन परीक्षा', 'परीक्षा तैयारी']
        : ['mock test', 'practice test', 'online exam', 'exam preparation'],
    alternates: {
      canonical: `${siteUrl}${localePath(lang, '/mock-tests')}`,
      languages: { en: `${siteUrl}/mock-tests`, hi: `${siteUrl}/hi/mock-tests` },
    },
    openGraph: {
      title,
      description: desc,
      type: 'website',
      locale: lang === 'hi' ? 'hi_IN' : 'en_US',
    },
  }
}

const DIFFICULTY_LABEL: Record<string, { en: string; hi: string }> = {
  easy: { en: 'Easy', hi: 'आसान' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  hard: { en: 'Hard', hi: 'कठिन' },
}

export default async function MockTestsPage() {
  const lang = await getLocale()
  const hi = lang === 'hi'
  const mockTests = await safeListPublishedMockTests(lang)

  if (mockTests === null) return <ServiceUnavailable />

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: hi ? 'मॉक टेस्ट' : 'Mock Tests' },
        ]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {hi ? 'सभी मॉक टेस्ट' : 'All Mock Tests'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {hi
            ? 'अपनी तैयारी करें — समय सीमित परीक्षा जैसा अनुभव।'
            : 'Practice under exam conditions — timed mock tests with instant scoring.'}
        </p>
      </div>

      {mockTests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {hi
              ? 'अभी कोई मॉक टेस्ट उपलब्ध नहीं है।'
              : 'No mock tests available yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockTests.map((test: MockTestListItem) => {
            const diff = DIFFICULTY_LABEL[test.difficulty] ?? DIFFICULTY_LABEL.medium
            return (
              <Link
                key={test.id}
                href={localePath(lang, `/mock-test/${test.slug}`)}
                className="group rounded-lg border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {test.question_count} {hi ? 'प्रश्न' : 'Qs'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {test.time_limit_minutes ?? '—'} {hi ? 'मिनट' : 'min'}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {test.translation?.title ?? test.slug}
                </h3>
                {test.translation?.instructions && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {test.translation.instructions}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs capitalize">
                    <Gauge className="h-3 w-3 mr-1" />
                    {hi ? diff.hi : diff.en}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {test.passing_score}% {hi ? 'पास' : 'pass'}
                  </Badge>
                  {test.course_title && (
                    <span className="flex items-center gap-1 truncate">
                      <BookOpen className="h-3.5 w-3.5" />
                      {test.course_title}
                    </span>
                  )}
                </div>
                <span className="text-sm text-primary font-medium mt-3 inline-flex items-center gap-1">
                  {hi ? 'परीक्षा दें' : 'Start test'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
