import Link from 'next/link'
import type { Metadata } from 'next'
import { search } from '@/lib/content'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t } from '@/lib/i18n/dictionary'
import { Search as SearchIcon, Clock, BarChart3, BookOpen, FileQuestion, FolderTree, Building2, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search MioDemy courses, lessons, skills, centres and PDFs.',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

/**
 * /search?q=<query> — search results page.
 *
 * Server-rendered. Searches courses, lessons and questions
 * using PostgreSQL ILIKE (MVP). Shows results grouped by type
 * with excerpts and links.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q ?? ''
  const lang = await getLocale()
  // Use safeFetch so a Supabase outage doesn't 500 the page — we just
  // render an empty result set with the same UI.
  const results = query ? await safeFetch(() => search(query, lang, 30)) : null

  const typeIcon: Record<string, typeof BookOpen> = {
    course: BookOpen,
    lesson: BookOpen,
    question: FileQuestion,
    skill: FolderTree,
    centre: Building2,
    pdf: FileText,
  }
  const typeLabel: Record<string, string> = {
    course: lang === 'hi' ? 'कोर्स' : 'Course',
    lesson: lang === 'hi' ? 'पाठ' : 'Lesson',
    question: lang === 'hi' ? 'प्रश्न' : 'Question',
    skill: lang === 'hi' ? 'स्किल' : 'Skill',
    centre: lang === 'hi' ? 'सेंटर' : 'Centre',
    pdf: 'PDF',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[{ label: t(lang, 'breadcrumb.home'), href: localePath(lang, '/') }, { label: t(lang, 'nav.search') }]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t(lang, 'nav.search')}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === 'hi' ? 'कोर्स, पाठ, स्किल, सेंटर और PDF खोजें।' : 'Find courses, lessons, skills, centres and PDFs.'}
        </p>
      </div>

      {/* Search form */}
      <form className="mb-8" role="search">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search for Excel, formulas, digital marketing…"
            className="w-full pl-11 pr-4 py-3 rounded-lg border bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search query"
            autoFocus
          />
        </div>
        <Button type="submit" className="mt-3" size="sm">
          Search
        </Button>
      </form>

      {/* Results */}
      {query && results && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.total > 0
              ? `${results.total} result${results.total === 1 ? '' : 's'} for “${query}”`
              : `No results for “${query}”`}
          </p>

          {results.results.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={lang === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No results found'}
              description={lang === 'hi' ? `"${query}" से मेल खाता कुछ नहीं मिला। अलग कीवर्ड आज़माएं या हमारे कोर्स देखें।` : `We couldn't find anything matching “${query}”. Try different keywords or browse our courses.`}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href={localePath(lang, '/courses')}>{lang === 'hi' ? 'सभी कोर्स देखें' : 'Browse all courses'}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {results.results.map((r) => {
                const Icon = typeIcon[r.type]
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <Link
                      href={r.url}
                      className="block rounded-lg border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-muted p-2 shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabel[r.type]}
                            </Badge>
                            {r.meta?.difficulty && (
                              <Badge variant="outline" className="text-xs capitalize">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                {r.meta.difficulty}
                              </Badge>
                            )}
                            {r.meta?.duration && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {r.meta.duration}m
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold hover:text-primary transition-colors">
                            {r.title}
                          </h3>
                          {r.excerpt && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {r.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {!query && (
        <EmptyState
          icon={SearchIcon}
          title={lang === 'hi' ? 'खोजने के लिए टाइप करें' : 'Start typing to search'}
          description={lang === 'hi' ? 'कोर्स, पाठ, स्किल, सेंटर और PDF में खोजें।' : 'Search across courses, lessons, skills, centres and PDFs.'}
        />
      )}

      {query && !results && (
        <EmptyState
          icon={SearchIcon}
          title="Search is temporarily unavailable"
          description="We couldn't run your search right now. Please try again in a moment."
        />
      )}
    </div>
  )
}
