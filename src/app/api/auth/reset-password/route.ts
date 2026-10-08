import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/reset-password
 *
 * Body: { password }
 *
 * Updates the user's password. This route is called after the user clicks
 * the reset link in their email (Supabase sets the session via the URL
 * hash / access_token).
 */
export async function POST(request: Request) {
  let body: { password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { password } = body

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    )
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Password updated successfully.' })
}
