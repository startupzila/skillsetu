import Link from 'next/link'
import type { Metadata } from 'next'
import { listPublishedCourses, listPublishedCategories } from '@/lib/content'
import { CourseCard } from '@/components/shared'
import { EmptyState } from '@/components/shared'
import { BookOpen, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Courses',
  description: 'Browse all SkillSetu courses — Excel, Word, PowerPoint, Digital Marketing and more. Learn in English and Hindi.',
}

/**
 * /courses — lists all published courses with category filters.
 *
 * Server-rendered for SEO. Category filters are links to /skills/[slug].
 */
export default async function CoursesPage() {
  const [{ data: courses }, { data: categories }] = await Promise.all([
    listPublishedCourses('en'),
    listPublishedCategories('en'),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">All Courses</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Structured, practical courses with lessons, examples, practice and quizzes.
        </p>
      </div>

      {/* Category filter chips */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <Link
            href="/courses"
            className="rounded-full border bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium"
          >
            All
          </Link>
          {categories.map((cat) => {
            const t = cat.translations[0]
            return (
              <Link
                key={cat.id}
                href={`/skills/${cat.slug}`}
                className="rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {t?.name ?? cat.slug}
              </Link>
            )
          })}
        </div>
      )}

      {/* Course grid */}
      {courses && courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="We're adding new courses. Please check back soon."
        />
      )}
    </div>
  )
}
