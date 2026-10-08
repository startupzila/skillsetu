import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/logout
 *
 * Signs out the current user (clears the session cookie).
 */
export async function POST() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  return NextResponse.json({ message: 'Logged out successfully.' })
}
