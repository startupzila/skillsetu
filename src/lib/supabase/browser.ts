import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-facing Supabase client.
 *
 * Uses the anon (publishable) key — Row Level Security applies based
 * on the signed-in user's session. Safe to use in Client Components.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env and fill in your Supabase credentials.',
    )
  }

  return createBrowserClient(url, anonKey)
}
