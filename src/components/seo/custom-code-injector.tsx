import { getActiveCustomCode } from '@/lib/content/pages-service'

interface CustomCodeInjectorProps {
  location: 'head' | 'body_start' | 'body_end'
}

/**
 * CustomCodeInjector — injects active custom code (scripts, analytics,
 * verification tags) from the `custom_code` table into the page.
 *
 * Server component: fetches active code for the given location and
 * renders it as raw HTML. Used in layout.tsx for body_start + body_end.
 * Head injection is handled via Next.js metadata or a custom <head> tag.
 *
 * @see docs/security.md — only authorized roles can manage custom code
 */
export async function CustomCodeInjector({ location }: CustomCodeInjectorProps) {
  const entries = await getActiveCustomCode()
  const filtered = entries.filter((e) => e.location === location)

  if (filtered.length === 0) return null

  return (
    <>
      {filtered.map((entry, i) => (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: `<!-- ${entry.name} -->\n${entry.code}` }}
        />
      ))}
    </>
  )
}
