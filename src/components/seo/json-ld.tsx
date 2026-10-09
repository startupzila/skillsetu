import type { CourseWithCurriculum } from '@/lib/content/types'

interface JsonLdCourseProps {
  course: CourseWithCurriculum
  courseUrl: string
}

/**
 * JsonLdCourse — JSON-LD structured data for a course.
 *
 * Renders a <script type="application/ld+json"> tag with
 * schema.org/Course structured data for SEO.
 */
export function JsonLdCourse({ course, courseUrl }: JsonLdCourseProps) {
  const translation = course.translations[0]
  if (!translation) return null

  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0),
    0,
  )

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: translation.title,
    description: translation.short_description ?? translation.description ?? '',
    url: courseUrl,
    ...(totalDuration > 0
      ? { hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          duration: `PT${totalDuration}M`,
        } }
      : {}),
    ...(course.difficulty
      ? { educationalLevel: course.difficulty }
      : {}),
    provider: {
      '@type': 'Organization',
      name: 'MioDemy',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface JsonLdBreadcrumbsProps {
  items: Array<{ name: string; url: string }>
}

/**
 * JsonLdBreadcrumbs — JSON-LD BreadcrumbList structured data.
 */
export function JsonLdBreadcrumbs({ items }: JsonLdBreadcrumbsProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * JsonLdWebsite — JSON-LD WebSite structured data (for the homepage).
 */
export function JsonLdWebsite() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MioDemy',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    description: 'Structured, multilingual, practical skills learning platform.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
