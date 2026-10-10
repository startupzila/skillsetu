import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeFetch } from '@/lib/safe-fetch'

/**
 * Dynamic XML sitemap.
 *
 * Generates URLs for:
 *   - Static pages (/, /skills, /courses, /search)
 *   - All published categories (/skills/[slug])
 *   - All published courses (/courses/[slug])
 *   - All published lessons (/courses/[course]/[module]/[lesson])
 *
 * Only published content is included (RLS enforces this).
 *
 * Resilient: if Supabase is unreachable (e.g. env vars not yet wired on a
 * fresh deploy), the sitemap still returns 200 with just the static page
 * entries instead of crashing with a 500.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const entries: MetadataRoute.Sitemap = []

  // Static pages — always emitted, regardless of Supabase availability.
  // NOTE: auth pages (/login, /register, …) and /dashboard are intentionally
  // excluded — this is a company-internal system and those routes must never
  // appear in search results (also blocked via robots.txt + X-Robots-Tag).
  const staticPages = ['/', '/skills', '/courses', '/search', '/about', '/centres', '/books', '/store']
  for (const path of staticPages) {
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1.0 : 0.8,
    })
  }

  // Dynamic entries — wrapped in safeFetch so a Supabase outage never 500s
  // the sitemap route (which would block crawlers from indexing ANY page).
  const dynamic = await safeFetch(async () => {
    const supabase = await createServerSupabaseClient()
    const out: MetadataRoute.Sitemap = []

    // Published categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('status', 'published')

    for (const cat of categories ?? []) {
      out.push({
        url: `${siteUrl}/skills/${cat.slug}`,
        lastModified: new Date(cat.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    }

    // Published courses
    const { data: courses } = await supabase
      .from('courses')
      .select('slug, updated_at')
      .eq('status', 'published')

    for (const course of courses ?? []) {
      out.push({
        url: `${siteUrl}/courses/${course.slug}`,
        lastModified: new Date(course.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      })
    }

    // Published lessons (need course slug + module slug + lesson slug)
    const { data: modules } = await supabase
      .from('modules')
      .select('id, slug, course:courses(slug)')
      .eq('status', 'published')

    for (const mod of modules ?? []) {
      const courseSlug = (mod as { course: { slug: string } | null })?.course?.slug
      if (!courseSlug) continue

      const { data: lessons } = await supabase
        .from('lessons')
        .select('slug, updated_at')
        .eq('module_id', mod.id)
        .eq('status', 'published')

      for (const lesson of lessons ?? []) {
        out.push({
          url: `${siteUrl}/courses/${courseSlug}/${mod.slug}/${lesson.slug}`,
          lastModified: new Date(lesson.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })
      }
    }

    return out
  })

  if (dynamic) entries.push(...dynamic)

  return entries
}

