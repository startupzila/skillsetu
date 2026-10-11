import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/centres/search
 *
 * Query params (all optional):
 *   state    — state name (e.g. "Maharashtra")
 *   district — district name (e.g. "Mumbai")
 *   city     — city name (e.g. "Andheri")
 *   q        — search query (centre name)
 *
 * Returns verified training centres matching the filters, with their
 * primary location info.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const district = searchParams.get('district')
  const city = searchParams.get('city')
  const q = searchParams.get('q')

  const supabase = await createServerSupabaseClient()

  // Query training_centres with their locations, filtered by location fields
  let query = supabase
    .from('training_centres')
    .select(`
      id, slug, name,
      locations:centre_locations(
        city, district, state, country, is_primary
      )
    `)
    .eq('status', 'verified')
    .order('name', { ascending: true })

  // We need to filter by location fields — Supabase doesn't support filtering
  // on nested relation columns directly, so we fetch all and filter in JS.
  // For a small dataset (few hundred centres), this is fine.
  const { data, error } = await query

  if (error) {
    return NextResponse.json({ data: [], error: error.message }, { status: 500 })
  }

  // Filter in JS based on location params
  let filtered = (data ?? []).map((centre) => {
    const locations = (centre.locations ?? []) as Array<{
      city: string | null
      district: string | null
      state: string | null
      country: string | null
      is_primary: boolean
    }>

    // Use the primary location, or the first one
    const primaryLoc = locations.find((l) => l.is_primary) ?? locations[0] ?? {
      city: null, district: null, state: null, country: null, is_primary: false,
    }

    return {
      centre_id: centre.id as string,
      centre_name: centre.name as string,
      centre_slug: centre.slug as string,
      city: primaryLoc.city,
      district: primaryLoc.district,
      state: primaryLoc.state,
      country: primaryLoc.country,
    }
  })

  // Apply location filters
  if (state) {
    filtered = filtered.filter((c) =>
      c.state?.toLowerCase() === state.toLowerCase()
    )
  }
  if (district) {
    filtered = filtered.filter((c) =>
      c.district?.toLowerCase() === district.toLowerCase()
    )
  }
  if (city) {
    filtered = filtered.filter((c) =>
      c.city?.toLowerCase() === city.toLowerCase()
    )
  }
  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter((c) =>
      c.centre_name.toLowerCase().includes(query)
    )
  }

  return NextResponse.json({ data: filtered })
}
