import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListModules, adminGetCourse } from '@/lib/admin/content-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { CourseDetailsEditor } from '@/components/console/course-details-editor'
import { CurriculumManager } from '@/components/console/curriculum-manager'
import { Eye, Send } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Course Editor — Console` }
}

/**
 * /console/courses/[id] — integrated course editor.
 *
 * Three sections on one page (WordPress-style "edit post" surface):
 *   1. Course Details (editable inline — title, slug, difficulty, descriptions,
 *      outcomes, prerequisites, audience).
 *   2. Course meta summary (status, quick stats) + Publish action.
 *   3. Curriculum (modules + lessons CRUD). Each lesson links to the lesson
 *      editor (/console/courses/[id]/lessons/[lessonId]) where content + MCQ +
 *      QNA are managed together.
 */
export default async function CourseEditorPage({ params }: PageProps) {
  const { id: courseId } = await params

  const { data: course, error: courseErr } = await adminGetCourse(courseId)

  if (courseErr || !course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          {courseErr ? `Error: ${courseErr}` : 'Course not found.'}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/console/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  const { data: modules } = await adminListModules(courseId)

  const enTrans = (course.translations as { language_code: string; title: string; short_description: string; status: string }[])?.find((t) => t.language_code === 'en')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-7">
              <Link href="/console/courses">← Courses</Link>
            </Button>
            <StatusBadge status={course.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {enTrans?.title ?? course.slug}
          </h1>
          {enTrans?.short_description && (
            <p className="text-muted-foreground text-sm mt-1">{enTrans.short_description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {course.status === 'published' && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/${course.slug}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          )}
          {course.status !== 'published' && (
            <form action={`/api/admin/courses/${course.id}?action=publish`} method="post">
              <Button type="submit" size="sm">
                <Send className="h-4 w-4 mr-1" />
                Publish
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Course meta summary */}
      <Card>
        <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="font-medium capitalize">{course.difficulty.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">{course.estimated_duration ? `${course.estimated_duration}m` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Language</p>
            <p className="font-medium uppercase">{course.default_language}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Slug</p>
            <p className="font-medium text-xs">/{course.slug}</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Course details editor */}
      <CourseDetailsEditor
        courseId={course.id}
        initial={{
          slug: course.slug,
          difficulty: course.difficulty,
          estimated_duration: course.estimated_duration,
          default_language: course.default_language,
          status: course.status,
          translation: (course.translations as { language_code: string; title: string; short_description: string; description: string; learning_outcomes: string[]; prerequisites: string[]; target_audience: string[] }[])?.find((t) => t.language_code === 'en') ?? null,
        }}
      />

      {/* Section 2: Curriculum manager */}
      <CurriculumManager
        courseId={course.id}
        modules={(modules ?? []) as Parameters<typeof CurriculumManager>[0]['modules']}
      />
    </div>
  )
}
