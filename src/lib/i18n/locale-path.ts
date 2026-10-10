import type { Lang } from './dictionary'

/**
 * Locale path helpers — pure functions, safe for both server AND client.
 *
 * (Separated from locale.ts which uses next/headers and is server-only.)
 */

/**
 * Prefix a path with the locale. English (default) has no prefix;
 * Hindi gets `/hi`.
 *
 *   localePath('en', '/courses/foo')  →  '/courses/foo'
 *   localePath('hi', '/courses/foo')  →  '/hi/courses/foo'
 */
export function localePath(lang: Lang, path: string): string {
  if (lang === 'hi') {
    const clean = path.startsWith('/') ? path : `/${path}`
    return `/hi${clean}`
  }
  return path
}

/**
 * Strip a locale prefix from a pathname, returning { lang, path }.
 *
 *   '/hi/courses/foo'  →  { lang: 'hi', path: '/courses/foo' }
 *   '/courses/foo'     →  { lang: 'en', path: '/courses/foo' }
 */
export function parseLocalePath(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/hi' || pathname.startsWith('/hi/')) {
    return { lang: 'hi', path: pathname.slice(3) || '/' }
  }
  return { lang: 'en', path: pathname }
}
