import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListModules, adminGetCourse } from '@/lib/admin/content-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { Plus, Pencil, Eye, Send, BookOpen } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Course Editor — Console` }
}

/**
 * /console/courses/[id] — course editor.
 *
 * Shows: course info + modules + lessons. Allows creating modules/lessons,
 * publishing lessons, and navigating to the lesson editor.
 */
export default async function CourseEditorPage({ params }: PageProps) {
  const { id: courseId } = await params

  // Fetch course (all fields, including draft) via admin service
  const { data: course, error: courseErr } = await adminGetCourse(courseId)

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/console/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  const { data: modules, error: modErr } = await adminListModules(courseId)

  const enTrans = (course.translations as { language_code: string; title: string; short_description: string; description: string; status: string }[])?.find((t) => t.language_code === 'en')

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

      {/* Course meta */}
      <Card>
        <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="font-medium capitalize">{course.difficulty}</p>
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

      {/* Curriculum */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Curriculum</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Module
          </Button>
        </CardHeader>
        <CardContent>
          {modErr ? (
            <p className="text-sm text-destructive">{modErr}</p>
          ) : !modules || modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No modules yet. Add a module to start building the curriculum.
            </p>
          ) : (
            <div className="space-y-4">
              {modules.map((mod: Record<string, unknown>, mIdx: number) => {
                const modTrans = mod.translations as { language_code: string; title: string }[]
                const modEn = modTrans?.find((t) => t.language_code === 'en')
                const lessons = mod.lessons as Array<Record<string, unknown>>
                return (
                  <div key={mod.id as string} className="rounded-lg border">
                    {/* Module header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {mIdx + 1}
                        </span>
                        <span className="font-medium text-sm">{modEn?.title ?? mod.slug}</span>
                        <StatusBadge status={mod.status as string} />
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Lesson
                      </Button>
                    </div>
                    {/* Lessons */}
                    {lessons && lessons.length > 0 ? (
                      <ul className="divide-y">
                        {lessons.map((lesson) => {
                          const lesTrans = lesson.translations as { language_code: string; title: string }[]
                          const lesEn = lesTrans?.find((t) => t.language_code === 'en')
                          return (
                            <li key={lesson.id as string} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30">
                              <div className="flex items-center gap-2 min-w-0">
                                <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm truncate">{lesEn?.title ?? lesson.slug}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={lesson.status as string} />
                                {lesson.duration_minutes && (
                                  <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                                )}
                                <Button
                                  asChild
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                >
                                  <Link href={`/console/courses/${course.id}/lessons/${lesson.id}`}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No lessons in this module.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
