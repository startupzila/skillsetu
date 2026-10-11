import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/register
 *
 * Body: { email, password, displayName? }
 *
 * Creates a Supabase Auth user with email auto-confirmed (no email verification
 * needed — the Supabase dashboard redirect URL points to a stale Vercel URL,
 * so we bypass email verification entirely). The user can sign in immediately
 * after registration.
 *
 * A `profiles` row is auto-created by the `on_auth_user_created` trigger.
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

  // Create user via admin API (service-role) with email auto-confirmed
  const admin = createAdminClient()
  const { data: userData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ← auto-confirm email, no verification needed
    user_metadata: displayName ? { full_name: displayName } : undefined,
  })

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  // Now sign in the user immediately (create a session)
  const supabase = await createServerSupabaseClient()
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInErr) {
    // User created but couldn't sign in — tell them to sign in manually
    return NextResponse.json({
      data: {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          emailConfirmed: true,
        },
        session: null,
      },
      message: 'Registration successful. Please sign in to continue.',
    })
  }

  return NextResponse.json({
    data: {
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        emailConfirmed: true,
      },
      session: !!signInData.session,
    },
    message: 'Registration successful. Welcome to MioDemy!',
  })
}
