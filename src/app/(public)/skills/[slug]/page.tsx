import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedCategoryBySlug, listPublishedCoursesByCategory } from '@/lib/content'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { CourseCard } from '@/components/shared'
import { EmptyState } from '@/components/shared'
import { FolderOpen } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the category page. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: category } = await getPublishedCategoryBySlug(slug, 'en')
  const t = category?.translations[0]

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
  const [{ data: category }, { data: courses }] = await Promise.all([
    getPublishedCategoryBySlug(slug, 'en'),
    listPublishedCoursesByCategory(slug, 'en'),
  ])

  if (!category) notFound()

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
