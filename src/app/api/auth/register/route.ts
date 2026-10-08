import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/register
 *
 * Body: { email, password, displayName? }
 *
 * Creates a Supabase Auth user. A `profiles` row is auto-created by the
 * `on_auth_user_created` trigger (002_triggers.sql). Email verification is
 * sent automatically by Supabase.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string; displayName?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password, displayName } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { full_name: displayName } : undefined,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    data: {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            emailConfirmed: !!data.user.email_confirmed_at,
          }
        : null,
      session: !!data.session,
    },
    message: data.session
      ? 'Registration successful.'
      : 'Registration successful. Please check your email to verify your account.',
  })
}
