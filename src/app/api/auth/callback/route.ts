import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/auth/callback
 *
 * Supabase Auth callback handler. Exchanges the `code` query param for a
 * session, then redirects to the `next` param (or /dashboard).
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      )
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
