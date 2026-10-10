import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedCourseBySlug, listPublishedCourses } from '@/lib/content'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { CourseCard } from '@/components/shared'
import { safeFetch } from '@/lib/safe-fetch'
import { JsonLdCourse, JsonLdBreadcrumbs, JsonLdFaq } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ArrowRight } from 'lucide-react'
import {
  Clock,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Target,
  Users,
  ChevronRight,
  PlayCircle,
} from 'lucide-react'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the course page (per-language, resilient). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLocale()
  const res = await safeFetch(() => getPublishedCourseBySlug(slug, lang))
  const t = res?.data?.translations[0]

  if (!t) return { title: 'Course not found' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = t.seo_title ?? t.title
  const description = t.seo_description ?? t.short_description ?? t.description ?? ''
  const keywords = t.seo_keywords ?? []

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: `${siteUrl}${localePath(lang, `/courses/${slug}`)}`,
      languages: {
        en: `${siteUrl}/courses/${slug}`,
        hi: `${siteUrl}/hi/courses/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: lang === 'hi' ? 'hi_IN' : 'en_US',
      url: `${siteUrl}${localePath(lang, `/courses/${slug}`)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

/**
 * /courses/[slug] — course detail page.
 *
 * Shows: title, description, difficulty, duration, learning outcomes,
 * prerequisites, target audience, full curriculum (modules + lessons),
 * SEO content (intro + keywords + FAQs), and related courses.
 * Server-rendered for SEO. Locale-aware (/hi shows Hindi content).
 */
export default async function CoursePage({ params }: PageProps) {
  const { slug } = await params
  const lang = await getLocale()

  // Fetch resiliently
  let course
  let unavailable = false
  try {
    const res = await getPublishedCourseBySlug(slug, lang)
    course = res.data
  } catch {
    unavailable = true
    course = null
  }

  if (unavailable) return <ServiceUnavailable />
  if (!course) notFound()

  const t = course.translations[0]
  if (!t) notFound()

  // Fetch related courses
  const categories = (course as Record<string, unknown>).categories as
    | { id: string; slug: string; translations: { language_code: string; name: string }[] }[]
    | undefined
  const catSlug = categories?.[0]?.slug
  let relatedCourses: typeof course[] = []
  if (catSlug) {
    const allRes = await safeFetch(() => listPublishedCourses(lang))
    relatedCourses = (allRes?.data ?? []).filter((c) => c.id !== course.id).slice(0, 3)
  }

  // Calculate total lessons + duration
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  )
  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0),
    0,
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const courseUrl = `${siteUrl}${localePath(lang, `/courses/${course.slug}`)}`
  const firstLessonHref = course.modules[0]?.lessons[0]
    ? localePath(lang, `/courses/${course.slug}/${course.modules[0].slug}/${course.modules[0].lessons[0].slug}`)
    : localePath(lang, `/courses/${course.slug}`)

  // SEO content fields (may be null for legacy courses without migration 005)
  const seoKeywords = (t as Record<string, unknown>).seo_keywords as string[] | null
  const seoFaqs = (t as Record<string, unknown>).seo_faqs as Array<{ q: string; a: string }> | null
  const seoIntro = (t as Record<string, unknown>).seo_intro_paragraph as string | null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD structured data */}
      <JsonLdCourse course={course} courseUrl={courseUrl} />
      <JsonLdBreadcrumbs
        items={[
          { name: tt(lang, 'breadcrumb.home'), url: siteUrl },
          { name: tt(lang, 'breadcrumb.courses'), url: `${siteUrl}${localePath(lang, '/courses')}` },
          ...(catSlug
            ? [{ name: categories![0].translations[0]?.name ?? catSlug, url: `${siteUrl}${localePath(lang, `/skills/${catSlug}`)}` }]
            : []),
          { name: t.title, url: courseUrl },
        ]}
      />
      {seoFaqs && seoFaqs.length > 0 && <JsonLdFaq faqs={seoFaqs} />}

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: tt(lang, 'breadcrumb.courses'), href: localePath(lang, '/courses') },
          ...(catSlug
            ? [{ label: categories![0].translations[0]?.name ?? catSlug, href: localePath(lang, `/skills/${catSlug}`) }]
            : []),
          { label: t.title },
        ]}
      />

      {/* Course header */}
      <div className="mt-6 grid lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize gap-1">
              <BarChart3 className="h-3 w-3" />
              {course.difficulty.replace('_', ' ')}
            </Badge>
            {totalDuration > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {totalLessons} {totalLessons === 1 ? tt(lang, 'course.lesson') : tt(lang, 'course.lessons')}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t.title}
          </h1>

          {t.short_description && (
            <p className="text-lg text-muted-foreground">{t.short_description}</p>
          )}

          {t.description && (
            <p className="text-muted-foreground leading-relaxed">{t.description}</p>
          )}

          {/* CTA */}
          <div className="flex gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={firstLessonHref}>
                <PlayCircle className="h-4 w-4 mr-2" />
                {tt(lang, 'course.startLearning')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">{tt(lang, 'course.signUpFree')}</Link>
            </Button>
          </div>
        </div>

        {/* Sidebar: quick facts */}
        <aside className="space-y-4">
          <div className="rounded-lg border p-5 space-y-3">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              {tt(lang, 'course.courseInfo')}
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> {tt(lang, 'course.difficulty')}
                </dt>
                <dd className="font-medium capitalize">{course.difficulty.replace('_', ' ')}</dd>
              </div>
              {totalDuration > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {tt(lang, 'course.duration')}
                  </dt>
                  <dd className="font-medium">
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {tt(lang, 'course.lessons')}
                </dt>
                <dd className="font-medium">{totalLessons}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {tt(lang, 'course.language')}
                </dt>
                <dd className="font-medium uppercase">{course.default_language}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <Separator className="my-10" />

      {/* Learning outcomes */}
      {t.learning_outcomes && t.learning_outcomes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {tt(lang, 'course.whatYoullLearn')}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {t.learning_outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prerequisites */}
      {t.prerequisites && t.prerequisites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold tracking-tight mb-3">{tt(lang, 'course.prerequisites')}</h2>
          <ul className="space-y-2">
            {t.prerequisites.map((pre, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
                {pre}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Target audience */}
      {t.target_audience && t.target_audience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold tracking-tight mb-3">{tt(lang, 'course.whoThisIsFor')}</h2>
          <div className="flex flex-wrap gap-2">
            {t.target_audience.map((aud, i) => (
              <Badge key={i} variant="secondary">{aud}</Badge>
            ))}
          </div>
        </section>
      )}

      <Separator className="my-10" />

      {/* Curriculum */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6">{tt(lang, 'course.courseContent')}</h2>
        {course.modules.length === 0 ? (
          <p className="text-muted-foreground">{tt(lang, 'course.curriculumComingSoon')}</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((module, mIdx) => {
              const modT = module.translations[0]
              return (
                <div key={module.id} className="rounded-lg border overflow-hidden">
                  <div className="bg-muted/50 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {mIdx + 1}
                      </span>
                      <h3 className="font-semibold">{modT?.title ?? module.slug}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {module.lessons.length} {module.lessons.length === 1 ? tt(lang, 'course.lesson') : tt(lang, 'course.lessons')}
                    </span>
                  </div>
                  <ul className="divide-y">
                    {module.lessons.map((lesson) => {
                      const lesT = lesson.translations[0]
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={localePath(lang, `/courses/${course.slug}/${module.slug}/${lesson.slug}`)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors group"
                          >
                            <PlayCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                            <span className="text-sm flex-1">{lesT?.title ?? lesson.slug}</span>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration_minutes}m
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Free PDF Download CTA */}
      <section className="border-t pt-10">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <FileText className="h-5 w-5 text-primary" />
                  {tt(lang, 'course.freePdfDownload')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {tt(lang, 'course.freePdfDesc')} {t.title}.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={localePath(lang, `/courses/${course.slug}/pdf`)}>
                  {tt(lang, 'course.downloadFreePdfs')} <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEO Content Section (auto-generated, per-language) ── */}
      {seoIntro && (
        <section className="border-t pt-10 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <h2 className="text-xl font-bold text-foreground">{tt(lang, 'course.aboutCourse')} — {t.title}</h2>
          <p>{seoIntro}</p>
          {seoKeywords && seoKeywords.length > 0 && (
            <div className="not-prose flex flex-wrap gap-1.5 mt-4">
              {seoKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FAQ Section (auto-generated, per-language) */}
      {seoFaqs && seoFaqs.length > 0 && (
        <section className="border-t pt-10 mb-10">
          <h2 className="text-2xl font-bold tracking-tight mb-4">{tt(lang, 'course.faqTitle')}</h2>
          <div className="space-y-3">
            {seoFaqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Related courses */}
      {relatedCourses.length > 0 && (
        <section className="border-t pt-10">
          <h2 className="text-2xl font-bold tracking-tight mb-6">{tt(lang, 'course.relatedCourses')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((rc) => (
              <CourseCard key={rc.id} course={rc} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
