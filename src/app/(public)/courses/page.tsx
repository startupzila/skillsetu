import Link from 'next/link'
import type { Metadata } from 'next'
import { listPublishedCourses, listPublishedCategories } from '@/lib/content'
import { CourseCard } from '@/components/shared'
import { EmptyState } from '@/components/shared'
import { BookOpen } from 'lucide-react'
import { SearchableCourseGrid } from '@/components/shared/searchable-course-grid'
import { safeFetch } from '@/lib/safe-fetch'

export const metadata: Metadata = {
  title: 'All Courses — Free Excel, Tally, Digital Marketing & More | MioDemy',
  description: 'Browse all free courses on MioDemy. Learn Excel, Word, PowerPoint, Tally, Digital Marketing, AI tools and more with structured tutorials, practice exercises, quizzes and downloadable PDFs.',
  keywords: ['free courses', 'Excel course', 'Tally course', 'Digital Marketing course', 'PowerPoint course', 'Word course', 'AI tools course', 'free online courses', 'learn skills online'],
}

export default async function CoursesPage() {
  const [coursesRes, categoriesRes] = await Promise.all([
    safeFetch(() => listPublishedCourses('en')),
    safeFetch(() => listPublishedCategories('en')),
  ])
  const courses = coursesRes?.data ?? []
  const categories = categoriesRes?.data ?? []

  // Build simplified course data for the client component
  const courseData = (courses ?? []).map(c => ({
    id: c.id, slug: c.slug, difficulty: c.difficulty, estimated_duration: c.estimated_duration,
    title: c.translations[0]?.title ?? c.slug,
    short_description: c.translations[0]?.short_description ?? null,
    learning_outcomes: c.translations[0]?.learning_outcomes ?? null,
  }))

  // Build category data
  const categoryData = (categories ?? []).map(cat => ({
    id: cat.id, slug: cat.slug, name: cat.translations[0]?.name ?? cat.slug,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">All Courses</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Structured, practical courses with lessons, examples, practice and quizzes.
        </p>
      </div>

      {courses && courses.length > 0 ? (
        <SearchableCourseGrid courses={courses} categories={categoryData} />
      ) : (
        <EmptyState icon={BookOpen} title="No courses yet" description="We're adding new courses. Please check back soon." />
      )}

      {/* SEO content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Free Online Courses — Learn Skills with MioDemy</h2>
        <p>MioDemy offers free online courses in Excel, Tally, Digital Marketing, PowerPoint, Word, AI tools and more. Each course includes structured tutorials, practical examples, practice exercises, quizzes, and downloadable PDF resources. Learn at your own pace in English or Hindi.</p>
        <p>Our courses are designed for beginners and professionals alike. Whether you want to learn Excel formulas, master Tally accounting, understand Digital Marketing fundamentals, or improve your PowerPoint skills, MioDemy has a course for you. All courses are free and include downloadable PDF notes, cheat sheets, and workbooks.</p>
      </div>
    </div>
  )
}
