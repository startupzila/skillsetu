import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * MioDemy — middleware (S4)
 *
 * 1. Refreshes the Supabase session on every request (so server components
 *    see the latest auth state without waiting for a client-side refresh).
 * 2. Protects /console/* routes — redirects to /login if not authenticated.
 *    (Role-based checks happen in the console layout / route handlers,
 *    because they require DB lookups that middleware cannot do efficiently.)
 */

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const PUBLIC_PREFIXES = ['/api/auth/', '/api/health', '/api/courses', '/api/categories', '/api/quiz']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )

  const pathname = request.nextUrl.pathname

  // ── Redirect manager (301/302) ──────────────────────────
  // Check if the path matches a redirect before anything else.
  // Skip API routes and static assets.
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
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
      return NextResponse.redirect(targetUrl, statusCode)
    }
  }

  // Refresh the session (this updates cookies via the setAll above)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /console/* — must be authenticated
  if (pathname.startsWith('/console') && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If already logged in, redirect away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
