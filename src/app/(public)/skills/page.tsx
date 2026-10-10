import Link from 'next/link'
import type { Metadata } from 'next'
import { listPublishedCategories } from '@/lib/content'
import { EmptyState } from '@/components/shared'
import { FolderOpen, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SearchableCategoriesGrid } from '@/components/shared/searchable-categories-grid'

export const metadata: Metadata = {
  title: 'All Skills & Categories — Learn Excel, Tally, Digital Marketing & More',
  description: 'Browse all skill categories on MioDemy. Learn Excel, Word, PowerPoint, Tally, Digital Marketing, AI tools and more with free structured tutorials, practice exercises and quizzes.',
  keywords: ['learn skills', 'skill categories', 'Excel tutorial', 'Tally tutorial', 'Digital Marketing course', 'PowerPoint tutorial', 'Word tutorial', 'AI tools', 'free skills training'],
}

export default async function SkillsPage() {
  const { data: categories, error } = await listPublishedCategories('en')

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState icon={FolderOpen} title="Categories not available" description="We're setting up the content. Please check back soon." />
      </div>
    )
  }

  // Build simplified data for client component
  const categoryData = (categories ?? []).map(cat => ({
    id: cat.id, slug: cat.slug, name: cat.translations[0]?.name ?? cat.slug,
    description: cat.translations[0]?.description ?? null,
  }))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">All Skills</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Browse our skill categories to find the right learning path for you.
          Each category contains structured courses with lessons, practice and quizzes.
        </p>
      </div>

      {categoryData.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No categories yet" description="We're adding new skill categories soon. Please check back later." />
      ) : (
        <SearchableCategoriesGrid categories={categoryData} />
      )}

      {/* SEO content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Browse All Skill Categories</h2>
        <p>MioDemy organizes courses into skill categories to help you find the right learning path. Whether you want to master Office Skills like Excel, Word, and PowerPoint, learn Digital Marketing including SEO and social media, or explore AI tools, our categories cover practical, in-demand skills.</p>
        <p>Each category contains structured courses with tutorials, examples, practice exercises, quizzes, and downloadable PDF resources. Start with a category that matches your goals and build your skills step by step.</p>
      </div>
    </div>
  )
}
