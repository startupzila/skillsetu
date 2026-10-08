import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getPublishedLessonBySlug,
  getPublishedCourseBySlug,
  getLessonUserState,
} from '@/lib/content'
import { ContentRenderer, LessonActions } from '@/components/learning'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string; module: string; lesson: string }>
}

/** Generate SEO metadata for the lesson page. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lesson } = await params
  const { data } = await getPublishedLessonBySlug(slug, lesson, 'en')
  const t = data?.translation

  if (!t) return { title: 'Lesson not found' }

  return {
    title: t.title,
    description: t.summary ?? '',
    openGraph: {
      title: t.title,
      description: t.summary ?? '',
      type: 'article',
    },
  }
}

/**
 * Lesson page: /courses/[slug]/[module]/[lesson]
 *
 * Shows: breadcrumbs, lesson title, structured content blocks,
 * prev/next navigation, and course curriculum sidebar (desktop).
 * Server-rendered for SEO.
 */
export default async function LessonPage({ params }: PageProps) {
  const { slug, lesson } = await params

  const [lessonResult, courseResult] = await Promise.all([
    getPublishedLessonBySlug(slug, lesson, 'en'),
    getPublishedCourseBySlug(slug, 'en'),
  ])

  if (!lessonResult.data || !courseResult.data) notFound()

  const { lesson: lessonData, translation, blocks, course, module: mod, prevLesson, nextLesson } = lessonResult.data
  const courseT = courseResult.data.translations[0]
  const modT = courseResult.data.modules.find((m) => m.id === mod.id)?.translations[0]

  // Fetch user state (bookmark + progress) — null if not authenticated
  const userState = await getLessonUserState(lessonData.id)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Courses', href: '/courses' },
          { label: courseT?.title ?? course.slug, href: `/courses/${course.slug}` },
          { label: modT?.title ?? mod.slug },
          { label: translation.title },
        ]}
      />

      <div className="mt-6 grid lg:grid-cols-[1fr_18rem] gap-8">
        {/* Main content */}
        <article className="min-w-0 space-y-6">
          {/* Lesson header */}
          <header className="space-y-3 pb-6 border-b">
            <div className="flex flex-wrap items-center gap-2">
              {lessonData.duration_minutes && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {lessonData.duration_minutes} min read
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {lessonData.lesson_type}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {translation.title}
            </h1>
            {translation.summary && (
              <p className="text-lg text-muted-foreground">{translation.summary}</p>
            )}

            {/* Action buttons (bookmark + notes + complete) */}
            <div className="pt-2">
              <LessonActions
                lessonId={lessonData.id}
                courseSlug={course.slug}
                initialBookmarked={userState.bookmarked}
                initialCompleted={userState.progress?.status === 'completed'}
              />
            </div>
          </header>

          {/* Content blocks */}
          <ContentRenderer blocks={blocks} />

          <Separator className="my-8" />

          {/* Prev / Next navigation */}
          <nav className="flex items-center justify-between gap-4" aria-label="Lesson navigation">
            {prevLesson ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${course.slug}/${mod.slug}/${prevLesson.slug}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${course.slug}/${mod.slug}/${nextLesson.slug}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href={`/courses/${course.slug}`}>
                  <ListChecks className="h-4 w-4 mr-1.5" />
                  Back to course
                </Link>
              </Button>
            )}
          </nav>
        </article>

        {/* Sidebar: course curriculum */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Course Content</h3>
              <Link
                href={`/courses/${course.slug}`}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {courseResult.data.modules.map((m, mi) => {
                const mT = m.translations[0]
                return (
                  <div key={m.id} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {mi + 1}. {mT?.title ?? m.slug}
                    </p>
                    <ul className="space-y-0.5">
                      {m.lessons.map((l) => {
                        const lT = l.translations[0]
                        const isCurrent = l.id === lessonData.id
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/courses/${course.slug}/${m.slug}/${l.slug}`}
                              className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                                isCurrent
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              }`}
                            >
                              {lT?.title ?? l.slug}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
