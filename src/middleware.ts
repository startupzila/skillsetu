import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * MioDemy — middleware (proxy).
 *
 * 1. Refreshes the Supabase session on every request (so server components
 *    see the latest auth state without waiting for a client-side refresh).
 * 2. Protects /console/* routes — redirects to /login if not authenticated.
 *    (Role-based checks happen in the console layout / route handlers,
 *    because they require DB lookups that middleware cannot do efficiently.)
 * 3. Sends `X-Robots-Tag: noindex, nofollow` on all internal / non-public
 *    paths (console, dashboard, api, auth) so search engines never crawl or
 *    index the company's internal system.
 *
 * RESILIENCE: if the Supabase env vars are not configured (e.g. during a
 * fresh deploy before env vars are wired up), the middleware no longer
 * crashes the entire site. It skips the Supabase-dependent redirect lookup
 * and session refresh, still protects /console/*, and lets public pages
 * render their own graceful fallbacks.
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

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  /** Stamp the noindex header on whatever response we end up returning. */
  const withNoindex = (res: ReturnType<typeof NextResponse.next> | ReturnType<typeof NextResponse.redirect>) => {
    if (isNoindexPath(pathname)) {
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
    if (pathname.startsWith('/console')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
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
  // Skip API routes and static assets.
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    try {
      const { data: redirect } = await supabase
        .from('redirects')
        .select('to_url, status_code')
        .eq('from_path', pathname)
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
  if (pathname.startsWith('/console') && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return withNoindex(NextResponse.redirect(loginUrl))
  }

  // If already logged in, redirect away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    return withNoindex(NextResponse.redirect(new URL('/dashboard', request.url)))
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
