import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getPublishedLessonBySlug,
  getPublishedCourseBySlug,
  getLessonUserState,
} from '@/lib/content'
import {
  ContentRenderer,
  LessonActions,
  CourseSidebar,
  PrevNextNav,
  MobileCourseNav,
  type SidebarModule,
} from '@/components/learning'
import { LessonVideo } from '@/components/learning/lesson-video'
import { LessonPractice } from '@/components/learning/lesson-practice'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { safeFetch } from '@/lib/safe-fetch'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string; module: string; lesson: string }>
}

/** Generate SEO metadata for the lesson page (resilient to data errors). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lesson } = await params
  const res = await safeFetch(() => getPublishedLessonBySlug(slug, lesson, 'en'))
  const t = res?.data?.translation

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
 * w3schools-style layout:
 *   - Desktop: fixed left sidebar with all chapters (modules + lessons)
 *   - Mobile/tablet: hamburger "Chapters" button opens sidebar as a Sheet
 *   - Prev/Next navigation at TOP and BOTTOM of content
 *   - Breadcrumbs above the content
 *
 * Server-rendered for SEO.
 */
export default async function LessonPage({ params }: PageProps) {
  const { slug, lesson } = await params

  // Fetch resiliently: a throw here (e.g. Supabase env vars not yet set on a
  // fresh deploy) renders a friendly fallback instead of a 500. A genuine
  // "lesson or course not found" still returns a proper 404 via notFound().
  let lessonResult = null
  let courseResult = null
  let unavailable = false
  try {
    ;[lessonResult, courseResult] = await Promise.all([
      getPublishedLessonBySlug(slug, lesson, 'en'),
      getPublishedCourseBySlug(slug, 'en'),
    ])
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!lessonResult?.data || !courseResult?.data) notFound()

  const {
    lesson: lessonData,
    translation,
    blocks,
    questions,
    course,
    module: mod,
  } = lessonResult.data
  const courseT = courseResult.data.translations[0]
  const modT = courseResult.data.modules.find((m) => m.id === mod.id)?.translations[0]

  // Fetch user state (bookmark + progress) — null if not authenticated
  // (or if Supabase is unreachable — never block rendering for this)
  const userState = await safeFetch(() => getLessonUserState(lessonData.id)) ?? { bookmarked: false, progress: null }

  // Build sidebar modules data
  const sidebarModules: SidebarModule[] = courseResult.data.modules.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.translations[0]?.title ?? m.slug,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.translations[0]?.title ?? l.slug,
    })),
  }))

  // Build prev/next with module slug + title (for cross-module navigation)
  // prev/next from the service are within the same module; for full course
  // flow, we flatten all lessons and find adjacent across modules.
  const allLessonsFlat = courseResult.data.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      lessonSlug: l.slug,
      lessonTitle: l.translations[0]?.title ?? l.slug,
      moduleSlug: m.slug,
    })),
  )
  const currentIdx = allLessonsFlat.findIndex(
    (l) => l.moduleSlug === mod.slug && l.lessonSlug === lessonData.slug,
  )
  const prevNav =
    currentIdx > 0 ? allLessonsFlat[currentIdx - 1] : null
  const nextNav =
    currentIdx >= 0 && currentIdx < allLessonsFlat.length - 1
      ? allLessonsFlat[currentIdx + 1]
      : null

  return (
    <div className="min-h-screen">
      {/* w3schools-style: fixed sidebar on desktop, hidden on mobile */}
      <div className="lg:flex">
        {/* Left sidebar — desktop only (fixed) */}
        <aside className="hidden lg:block w-64 shrink-0 border-r bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
          <CourseSidebar
            courseSlug={course.slug}
            moduleSlug={mod.slug}
            lessonSlug={lessonData.slug}
            courseTitle={courseT?.title ?? course.slug}
            modules={sidebarModules}
            className="h-full"
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Mobile chapters toggle */}
            <div className="lg:hidden mb-4">
              <MobileCourseNav
                courseSlug={course.slug}
                moduleSlug={mod.slug}
                lessonSlug={lessonData.slug}
                courseTitle={courseT?.title ?? course.slug}
                modules={sidebarModules}
              />
            </div>

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

            {/* TOP prev/next nav */}
            <PrevNextNav
              courseSlug={course.slug}
              prevLesson={
                prevNav
                  ? {
                      slug: prevNav.lessonSlug,
                      title: prevNav.lessonTitle,
                      moduleSlug: prevNav.moduleSlug,
                    }
                  : null
              }
              nextLesson={
                nextNav
                  ? {
                      slug: nextNav.lessonSlug,
                      title: nextNav.lessonTitle,
                      moduleSlug: nextNav.moduleSlug,
                    }
                  : null
              }
              currentTitle={translation.title}
              position="top"
              className="mt-4"
            />

            {/* Lesson header */}
            <header className="mt-6 mb-6 space-y-3">
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

            {/* Video — shown right after the title/summary, before content */}
            <LessonVideo url={lessonData.video_url} />

            {/* WYSIWYG content (new) — takes precedence over legacy blocks */}
            {translation.content_html ? (
              <article
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:bg-muted prose-pre:text-foreground prose-img:rounded-lg prose-table:border-border"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(translation.content_html) }}
              />
            ) : (
              /* Legacy structured blocks (back-compat for older lessons) */
              <ContentRenderer blocks={blocks} />
            )}

            {/* Lesson-attached practice questions (MCQ + QNA), w3schools style */}
            <LessonPractice questions={questions ?? []} />

            <Separator className="my-8" />

            {/* BOTTOM prev/next nav */}
            <PrevNextNav
              courseSlug={course.slug}
              prevLesson={
                prevNav
                  ? {
                      slug: prevNav.lessonSlug,
                      title: prevNav.lessonTitle,
                      moduleSlug: prevNav.moduleSlug,
                    }
                  : null
              }
              nextLesson={
                nextNav
                  ? {
                      slug: nextNav.lessonSlug,
                      title: nextNav.lessonTitle,
                      moduleSlug: nextNav.moduleSlug,
                    }
                  : null
              }
              position="bottom"
            />
          </div>
        </main>
      </div>
    </div>
  )
}
