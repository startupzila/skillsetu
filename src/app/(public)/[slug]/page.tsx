import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPageBySlug } from '@/lib/content/pages-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { safeFetch } from '@/lib/safe-fetch'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata from the page's meta_description (resilient to data errors). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await safeFetch(() => getPublishedPageBySlug(slug, 'en'))
  const page = res?.data

  if (!page) return { title: 'Page not found' }

  return {
    title: page.title,
    description: page.meta_description ?? page.content.slice(0, 160),
  }
}

/**
 * /[slug] — CMS-managed static page.
 *
 * Renders published static pages (about, privacy, terms, contact, etc.)
 * from the `static_pages` + `static_page_translations` tables.
 *
 * Note: this catch-all route is at the end of the (public) route group
 * so it doesn't shadow other routes like /skills, /courses, /search.
 */
export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch resiliently: a throw (Supabase unavailable) renders a friendly
  // fallback instead of a 500. A genuine not-found returns 404.
  let page = null
  let serviceError = false
  try {
    const res = await getPublishedPageBySlug(slug, 'en')
    page = res.data
    serviceError = !!res.error
  } catch {
    serviceError = true
  }

  // Distinguish "data store unreachable" (→ friendly fallback) from
  // "page genuinely does not exist" (→ 404). When env vars are missing,
  // the service throws or returns an error message; either way we show
  // the ServiceUnavailable fallback rather than risk a wrong 404.
  if (serviceError) return <ServiceUnavailable />
  if (!page) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: page.title },
        ]}
      />

      <article className="mt-6 prose prose-sm max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          {page.title}
        </h1>
        <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {page.content}
        </div>
      </article>
    </div>
  )
}
