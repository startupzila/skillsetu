import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/forgot-password
 *
 * Body: { email }
 *
 * Sends a password reset email. Always returns success (even if the email
 * doesn't exist) to prevent email enumeration.
 */
export async function POST(request: Request) {
  let body: { email?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  // Always return success to prevent email enumeration
  return NextResponse.json({
    message: 'If an account exists for that email, a reset link has been sent.',
  })
}
