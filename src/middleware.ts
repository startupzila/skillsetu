import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * MioDemy — middleware (proxy).
 *
 * 1. **Locale detection**: `/hi/*` paths are rewritten to `/*` internally with
 *    an `x-locale: hi` header. English (default) has no prefix. This gives
 *    Hindi proper URLs (`/hi/courses/foo`) without duplicating route files.
 * 2. Refreshes the Supabase session on every request.
 * 3. Protects /console/* routes — redirects to /login if not authenticated.
 * 4. Sends `X-Robots-Tag: noindex, nofollow` on all internal / non-public
 *    paths so search engines never crawl the company's internal system.
 *
 * RESILIENCE: if the Supabase env vars are not configured, the middleware
 * skips Supabase-dependent logic but still does locale rewriting + auth gating.
 */

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const PUBLIC_PREFIXES = ['/api/auth/', '/api/health', '/api/courses', '/api/categories', '/api/quiz']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

/** Paths that must NEVER be indexed (internal company system). */
const NOINDEX_PREFIXES = ['/console', '/dashboard', '/api', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/unauthorized']

function isNoindexPath(pathname: string): boolean {
  return NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** Detect locale from the URL: `/hi/*` → 'hi', everything else → 'en'. */
function detectLocale(pathname: string): { lang: 'en' | 'hi'; internalPath: string } {
  if (pathname === '/hi' || pathname.startsWith('/hi/')) {
    const internalPath = pathname.slice(3) || '/'
    return { lang: 'hi', internalPath }
  }
  return { lang: 'en', internalPath: pathname }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Locale detection + URL rewrite ──
  // `/hi/courses/foo` → rewritten to `/courses/foo` with `x-locale: hi` header.
  // The browser URL stays `/hi/courses/foo`; Next.js renders the `/courses/foo`
  // route but the page reads the locale from the header.
  const { lang, internalPath } = detectLocale(pathname)

  // Build the response — if it's a `/hi/*` path, rewrite internally
  const response =
    lang === 'hi'
      ? NextResponse.rewrite(new URL(internalPath, request.url))
      : NextResponse.next({ request })

  // Stamp the locale so server components can read it via `headers().get('x-locale')`
  response.headers.set('x-locale', lang)

  /** Stamp the noindex header on whatever response we end up returning. */
  const withNoindex = (res: typeof response) => {
    if (isNoindexPath(internalPath)) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    }
    return res
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured yet, skip its dependent logic so the
  // site still loads (public pages render graceful fallbacks). We still
  // protect /console/* by redirecting to login.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (internalPath.startsWith('/console')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', internalPath)
      return withNoindex(NextResponse.redirect(loginUrl))
    }
    return withNoindex(response)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          response.cookies.set(name, value)
        })
      },
    },
  })

  // ── Redirect manager (301/302) ──────────────────────────
  // Check if the path matches a redirect before anything else.
  // Use the internal path (locale-stripped) for redirect matching.
  if (!internalPath.startsWith('/api/') && !internalPath.startsWith('/_next/')) {
    try {
      const { data: redirect } = await supabase
        .from('redirects')
        .select('to_url, status_code')
        .eq('from_path', internalPath)
        .eq('is_active', true)
        .single()

      if (redirect) {
        const statusCode = redirect.status_code === 302 ? 302 : 301
        const targetUrl = redirect.to_url.startsWith('http')
          ? redirect.to_url
          : new URL(redirect.to_url, request.url).toString()
        return withNoindex(NextResponse.redirect(targetUrl, statusCode))
      }
    } catch {
      // Redirect lookup is best-effort; never let it crash the request.
    }
  }

  // Refresh the session (this updates cookies via the setAll above)
  let user: { id: string } | null = null
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    user = u
  } catch {
    // Session refresh is best-effort; treat as logged out.
    user = null
  }

  // Protect /console/* — must be authenticated
  if (internalPath.startsWith('/console') && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', internalPath)
    return withNoindex(NextResponse.redirect(loginUrl))
  }

  // If already logged in, redirect away from auth pages → home
  if (user && (internalPath === '/login' || internalPath === '/register')) {
    return withNoindex(NextResponse.redirect(new URL('/', request.url)))
  }

  return withNoindex(response)
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
