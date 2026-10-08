import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListCourses } from '@/lib/admin/content-service'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Eye, Send, Archive } from 'lucide-react'

export const metadata: Metadata = { title: 'Courses — Console' }

/**
 * /console/courses — list all courses (including drafts).
 * Server component: fetches via admin service (service-role, all statuses).
 */
export default async function ConsoleCoursesPage() {
  const { data: courses, error } = await adminListCourses()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all courses, including drafts and archived.
          </p>
        </div>
        <Button asChild>
          <Link href="/console/courses/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in to view courses.'
              : error.includes('FORBIDDEN') || error.includes('Insufficient')
                ? 'You do not have permission to view courses.'
                : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      {/* Courses table */}
      {courses && courses.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Duration</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course: Record<string, unknown>) => {
                const translations = course.translations as { language_code: string; title: string; status: string }[]
                const enTrans = translations?.find((t) => t.language_code === 'en')
                return (
                  <tr key={course.id as string} className="hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/courses/${course.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {enTrans?.title ?? course.slug}
                      </Link>
                      <p className="text-xs text-muted-foreground">/{course.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={course.status as string} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell capitalize text-muted-foreground">
                      {course.difficulty as string}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {course.estimated_duration ? `${course.estimated_duration}m` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Link href={`/console/courses/${course.id}`} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {course.status === 'published' && (
                          <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Link href={`/courses/${course.slug}`} title="View">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {course.status !== 'published' && (
                          <form action={`/api/admin/courses/${course.id}?action=publish`} method="post">
                            <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Publish">
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                        {course.status !== 'archived' && (
                          <form action={`/api/admin/courses/${course.id}?action=archive`} method="post">
                            <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No courses yet. Click &ldquo;New Course&rdquo; to create one.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
