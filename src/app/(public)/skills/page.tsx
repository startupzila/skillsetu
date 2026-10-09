import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { listPublishedCategories } from '@/lib/content'
import { EmptyState } from '@/components/shared'
import { FolderOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Skills & Categories — Learn Excel, Tally, Digital Marketing & More',
  description: 'Browse all skill categories on MioDemy. Learn Excel, Word, PowerPoint, Tally, Digital Marketing, AI tools and more with free structured tutorials, practice exercises and quizzes.',
  keywords: ['learn skills', 'skill categories', 'Excel tutorial', 'Tally tutorial', 'Digital Marketing course', 'PowerPoint tutorial', 'Word tutorial', 'AI tools', 'free skills training'],
}

/**
 * /skills — lists all published categories.
 *
 * Server-rendered for SEO. Each category links to /skills/[slug].
 */
export default async function SkillsPage() {
  const { data: categories, error } = await listPublishedCategories('en')

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={FolderOpen}
          title="Categories not available"
          description="We're setting up the content. Please check back soon."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page header */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">All Skills</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Browse our skill categories to find the right learning path for you.
          Each category contains structured courses with lessons, practice and quizzes.
        </p>
      </div>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="We're adding new skill categories soon. Please check back later."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const t = cat.translations[0]
            return (
              <Link
                key={cat.id}
                href={`/skills/${cat.slug}`}
                className="group rounded-xl border p-8 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="inline-flex rounded-lg bg-primary/10 p-3 mb-4">
                  <FolderOpen className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {t?.name ?? cat.slug}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {t?.description ?? 'Explore courses in this category.'}
                </p>
                <span className="text-sm text-primary font-medium mt-4 inline-flex items-center gap-1">
                  Explore courses <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
