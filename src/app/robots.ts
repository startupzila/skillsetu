import type { MetadataRoute } from 'next'

/**
 * robots.txt — allows all crawlers, references the sitemap.
 *
 * In production, this ensures search engines can crawl all public
 * content while respecting noindex meta tags on individual pages.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/console/', '/api/', '/dashboard'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
