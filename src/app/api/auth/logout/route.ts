import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/logout
 *
 * Signs out the current user (clears the session cookie) and redirects
 * to the home page with a success message query param.
 *
 * The home page reads the `logged_out` param and shows a toast.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()

  const requestUrl = new URL(request.url)
  const redirectUrl = new URL('/', requestUrl.origin)
  redirectUrl.searchParams.set('logged_out', '1')

  return NextResponse.redirect(redirectUrl, { status: 303 })
}
