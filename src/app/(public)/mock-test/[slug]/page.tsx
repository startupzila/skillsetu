import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedMockTestBySlug } from '@/lib/content/mock-test-service'
import { MockTestRunner } from '@/components/learning/mock-test-runner'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Gauge, ListChecks, BookOpen, ArrowRight, AlertCircle } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLocale()
  const res = await safeFetch(() => getPublishedMockTestBySlug(slug, lang))
  const t = res?.data?.translation
  if (!t) return { title: 'Mock test not found' }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title =
    lang === 'hi'
      ? `${t.title} — मुफ्त मॉक टेस्ट | MioDemy`
      : `${t.title} — Free Mock Test | MioDemy`
  const desc =
    t.instructions ??
    (lang === 'hi' ? 'अपनी तैयारी परखें।' : 'Test your preparation.')
  return {
    title,
    description: desc,
    alternates: {
      canonical: `${siteUrl}${localePath(lang, `/mock-test/${slug}`)}`,
      languages: {
        en: `${siteUrl}/mock-test/${slug}`,
        hi: `${siteUrl}/hi/mock-test/${slug}`,
      },
    },
    openGraph: {
      title,
      description: desc,
      type: 'article',
      locale: lang === 'hi' ? 'hi_IN' : 'en_US',
    },
  }
}

const DIFFICULTY_LABEL: Record<string, { en: string; hi: string }> = {
  easy: { en: 'Easy', hi: 'आसान' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  hard: { en: 'Hard', hi: 'कठिन' },
}

export default async function MockTestPage({ params }: PageProps) {
  const { slug } = await params
  const lang = await getLocale()
  const hi = lang === 'hi'

  let data = null
  let unavailable = false
  try {
    const res = await getPublishedMockTestBySlug(slug, lang)
    data = res.data
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!data) notFound()

  const { test, translation, questions } = data

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
            {
              label: hi ? 'मॉक टेस्ट' : 'Mock Tests',
              href: localePath(lang, '/mock-tests'),
            },
            { label: translation?.title ?? test.slug },
          ]}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {hi
              ? 'इस मॉक टेस्ट में अभी कोई प्रश्न नहीं है।'
              : 'No questions in this mock test yet.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const diff = DIFFICULTY_LABEL[test.difficulty] ?? DIFFICULTY_LABEL.medium

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          {
            label: hi ? 'मॉक टेस्ट' : 'Mock Tests',
            href: localePath(lang, '/mock-tests'),
          },
          { label: translation?.title ?? test.slug },
        ]}
      />

      <div className="mt-4 grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: exam runner (2/3+) */}
        <div className="space-y-4">
          {/* Test info bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">
              {translation?.title ?? test.slug}
            </h1>
            <Badge variant="secondary">
              {questions.length} {hi ? 'प्रश्न' : 'Questions'}
            </Badge>
            {test.time_limit_minutes && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {test.time_limit_minutes} {hi ? 'मिनट' : 'min'}
              </Badge>
            )}
            <Badge variant="outline">
              <Gauge className="h-3 w-3 mr-1" />
              {hi ? diff.hi : diff.en}
            </Badge>
            <Badge variant="outline">
              {test.passing_score}% {hi ? 'पास' : 'pass'}
            </Badge>
          </div>

          {/* Exam runner */}
          <MockTestRunner
            testId={test.id}
            title={translation?.title ?? test.slug}
            instructions={translation?.instructions}
            timeLimitMinutes={test.time_limit_minutes}
            passingScore={test.passing_score}
            questions={questions}
            lang={lang}
          />
        </div>

        {/* Right: sidebar (info / back to all tests) */}
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {hi ? 'परीक्षा जानकारी' : 'Exam info'}
                </span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li>
                  {hi ? 'कुल प्रश्न' : 'Total questions'}:{' '}
                  <span className="font-medium text-foreground">
                    {questions.length}
                  </span>
                </li>
                {test.time_limit_minutes && (
                  <li>
                    {hi ? 'समय सीमा' : 'Time limit'}:{' '}
                    <span className="font-medium text-foreground">
                      {test.time_limit_minutes} {hi ? 'मिनट' : 'min'}
                    </span>
                  </li>
                )}
                <li>
                  {hi ? 'पास स्कोर' : 'Passing score'}:{' '}
                  <span className="font-medium text-foreground">
                    {test.passing_score}%
                  </span>
                </li>
                {test.attempts_allowed != null && (
                  <li>
                    {hi ? 'प्रयास सीमित' : 'Attempts allowed'}:{' '}
                    <span className="font-medium text-foreground">
                      {test.attempts_allowed}
                    </span>
                  </li>
                )}
              </ul>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2 text-xs text-amber-800 dark:text-amber-300">
                {hi
                  ? 'टाइमर शुरू होने पर परीक्षा शुरू होती है। समय समाप्त होने पर उत्तर स्वतः जमा होंगे।'
                  : 'The exam timer starts as soon as the page loads. Your answers will be auto-submitted when the timer reaches zero.'}
              </div>
            </CardContent>
          </Card>

          <Link
            href={localePath(lang, '/mock-tests')}
            className="block rounded-lg border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {hi ? 'सभी मॉक टेस्ट' : 'All Mock Tests'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hi
                ? 'अन्य विषयों पर अभ्यास करें।'
                : 'Practice on other subjects too.'}
            </p>
            <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1">
              {hi ? 'देखें' : 'Browse'}
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
