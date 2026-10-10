import type { MetadataRoute } from 'next'

/**
 * robots.txt
 *
 * MioDemy's public storefront (courses, skills, lessons, store, books,
 * centres) IS crawlable and indexable. Everything internal is NOT:
 *
 *   - /console/*   — company editorial/admin console (internal system)
 *   - /dashboard    — private learner dashboard
 *   - /api/*        — JSON API surface (no crawlable HTML)
 *   - /login, /register, /forgot-password, /reset-password, /verify-email
 *   - /unauthorized
 *
 * This is reinforced at three layers:
 *   1. robots.txt  disallow  (here)
 *   2. X-Robots-Tag: noindex, nofollow HTTP header (middleware)
 *   3. <meta name="robots" content="noindex,nofollow"> (console/dashboard/auth
 *      layout metadata)
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/console',
          '/dashboard',
          '/api',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/unauthorized',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
