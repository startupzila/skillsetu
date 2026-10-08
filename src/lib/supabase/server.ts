import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client bound to the incoming request's cookies.
 *
 * Uses the anon key — Row Level Security applies based on the user's
 * session. Use in Server Components, Route Handlers and Server Actions
 * where the signed-in user's identity must be respected.
 *
 * Never import the service-role key here.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env and fill in your Supabase credentials.',
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll was called from a Server Component (read-only cookies).
          // This can be ignored if middleware refreshes user sessions.
        }
      },
    },
  })
}
