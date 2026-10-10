import { headers } from 'next/headers'
import { resolveLang, type Lang } from './dictionary'

// Re-export the pure path helpers so consumers can import from one place.
// (Client components should import from '@/lib/i18n/locale-path' directly
// to avoid pulling in next/headers.)
export { localePath, parseLocalePath } from './locale-path'

/**
 * Get the current locale for server components.
 *
 * The middleware sets the `x-locale` header based on the URL prefix
 * (`/hi/*` → `hi`, everything else → `en`). This is the single source of
 * truth for locale in server components.
 *
 * Falls back to the `miodemy-lang` cookie if the header is absent.
 *
 * ⚠️ SERVER-ONLY — uses next/headers. Do NOT import from client components.
 *    Client components should import localePath from '@/lib/i18n/locale-path'.
 */
export async function getLocale(): Promise<Lang> {
  const headerList = await headers()
  const fromHeader = headerList.get('x-locale')
  if (fromHeader) return resolveLang(fromHeader)

  // Fallback: cookie
  const cookie = headerList.get('cookie') ?? ''
  const match = cookie.match(/miodemy-lang=(en|hi)/)
  return resolveLang(match?.[1])
}
