import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * Signs in via Supabase Auth. The session cookie is set by the SSR client.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({
    data: {
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
      },
    },
    message: 'Login successful.',
  })
}
