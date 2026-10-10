import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedCategoryBySlug, listPublishedCoursesByCategory } from '@/lib/content'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { CourseCard } from '@/components/shared'
import { EmptyState } from '@/components/shared'
import { FolderOpen } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the category page (resilient to data errors). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await safeFetch(() => getPublishedCategoryBySlug(slug, 'en'))
  const t = res?.data?.translations[0]

  if (!t) return { title: 'Category not found' }

  return {
    title: t.name,
    description: t.description ?? `Browse ${t.name} courses on MioDemy.`,
  }
}

/**
 * /skills/[slug] — category detail page.
 *
 * Shows the category name, description, and all published courses
 * within that category. Server-rendered for SEO.
 */
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch resiliently: a throw here (e.g. Supabase env vars not yet set on
  // a fresh deploy) renders a friendly fallback instead of a 500. A genuine
  // "category not found" still returns a proper 404 via notFound().
  let category = null
  let unavailable = false
  try {
    const res = await getPublishedCategoryBySlug(slug, 'en')
    category = res.data
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!category) notFound()

  const coursesRes = await safeFetch(() => listPublishedCoursesByCategory(slug, 'en'))
  const courses = coursesRes?.data ?? []

  const translation = category.translations[0]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Skills', href: '/skills' },
          { label: translation?.name ?? slug },
        ]}
      />

      {/* Category header */}
      <div className="mt-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {translation?.name ?? slug}
        </h1>
        {translation?.description && (
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            {translation.description}
          </p>
        )}
      </div>

      {/* Courses in this category */}
      {courses && courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No courses yet"
          description="We're working on adding courses to this category. Please check back soon."
        />
      )}
    </div>
  )
}
