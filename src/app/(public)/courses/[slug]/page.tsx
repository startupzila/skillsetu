import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedCourseBySlug, listPublishedCourses } from '@/lib/content'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { CourseCard } from '@/components/shared'
import { JsonLdCourse, JsonLdBreadcrumbs } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the course page. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: course } = await getPublishedCourseBySlug(slug, 'en')
  const t = course?.translations[0]

  if (!t) return { title: 'Course not found' }

  return {
    title: t.title,
    description: t.short_description ?? t.description ?? '',
    openGraph: {
      title: t.title,
      description: t.short_description ?? '',
      type: 'article',
    },
  }
}

/**
 * /courses/[slug] — course detail page.
 *
 * Shows: title, description, difficulty, duration, learning outcomes,
 * prerequisites, target audience, full curriculum (modules + lessons),
 * and related courses. Server-rendered for SEO.
 */
export default async function CoursePage({ params }: PageProps) {
  const { slug } = await params
  const { data: course } = await getPublishedCourseBySlug(slug, 'en')

  if (!course) notFound()

  const t = course.translations[0]
  if (!t) notFound()

  // Fetch related courses (same first category, excluding this one)
  const categories = (course as Record<string, unknown>).categories as
    | { id: string; slug: string; translations: { language_code: string; name: string }[] }[]
    | undefined
  const catSlug = categories?.[0]?.slug
  let relatedCourses: typeof course[] = []
  if (catSlug) {
    // Use listPublishedCourses to find related (simplified: just fetch all and filter)
    const { data: all } = await listPublishedCourses('en')
    relatedCourses = (all ?? []).filter((c) => c.id !== course.id).slice(0, 3)
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
  const courseUrl = `${siteUrl}/courses/${course.slug}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD structured data */}
      <JsonLdCourse course={course} courseUrl={courseUrl} />
      <JsonLdBreadcrumbs
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Courses', url: `${siteUrl}/courses` },
          ...(catSlug
            ? [{ name: categories![0].translations[0]?.name ?? catSlug, url: `${siteUrl}/skills/${catSlug}` }]
            : []),
          { name: t.title, url: courseUrl },
        ]}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Courses', href: '/courses' },
          ...(catSlug
            ? [{ label: categories![0].translations[0]?.name ?? catSlug, href: `/skills/${catSlug}` }]
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
              {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
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
              <Link href={`/courses/${course.slug}/${course.modules[0]?.slug}/${course.modules[0]?.lessons[0]?.slug ?? ''}`}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start learning
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Sign up free</Link>
            </Button>
          </div>
        </div>

        {/* Sidebar: quick facts */}
        <aside className="space-y-4">
          <div className="rounded-lg border p-5 space-y-3">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Course Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Difficulty
                </dt>
                <dd className="font-medium capitalize">{course.difficulty.replace('_', ' ')}</dd>
              </div>
              {totalDuration > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Duration
                  </dt>
                  <dd className="font-medium">
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> Lessons
                </dt>
                <dd className="font-medium">{totalLessons}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Language
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
            What you&apos;ll learn
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
          <h2 className="text-xl font-bold tracking-tight mb-3">Prerequisites</h2>
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
          <h2 className="text-xl font-bold tracking-tight mb-3">Who this is for</h2>
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
        <h2 className="text-2xl font-bold tracking-tight mb-6">Course Content</h2>
        {course.modules.length === 0 ? (
          <p className="text-muted-foreground">Curriculum coming soon.</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((module, mIdx) => {
              const modT = module.translations[0]
              return (
                <div key={module.id} className="rounded-lg border overflow-hidden">
                  {/* Module header */}
                  <div className="bg-muted/50 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {mIdx + 1}
                      </span>
                      <h3 className="font-semibold">{modT?.title ?? module.slug}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>
                  {/* Lessons list */}
                  <ul className="divide-y">
                    {module.lessons.map((lesson, lIdx) => {
                      const lesT = lesson.translations[0]
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/courses/${course.slug}/${module.slug}/${lesson.slug}`}
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

      {/* Related courses */}
      {relatedCourses.length > 0 && (
        <section className="border-t pt-10">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Related Courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((rc) => (
              <CourseCard key={rc.id} course={rc} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
