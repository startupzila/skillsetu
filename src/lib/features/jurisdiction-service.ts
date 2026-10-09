import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'

/**
 * Jurisdiction service — hierarchical taxonomy for locations.
 * Country > State > District > City/Tehsil
 * International-ready: any country can have its own structure.
 */

export interface Jurisdiction {
  id: string
  name: string
  type: string
  parent_id: string | null
  country_code: string
  sort_order: number
}

/** List states for a country (default: India). */
export async function listStates(countryCode = 'IN') {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('jurisdictions')
    .select('id, name, type, parent_id, country_code, sort_order')
    .eq('type', 'state')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) return []
  return data as Jurisdiction[]
}

/** List districts for a state. */
export async function listDistricts(stateId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('jurisdictions')
    .select('id, name, type, parent_id, country_code, sort_order')
    .eq('type', 'district')
    .eq('parent_id', stateId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) return []
  return data as Jurisdiction[]
}

/** List cities for a district. */
export async function listCities(districtId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('jurisdictions')
    .select('id, name, type, parent_id, country_code, sort_order')
    .eq('type', 'city')
    .eq('parent_id', districtId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) return []
  return data as Jurisdiction[]
}

/** Get jurisdiction by ID (for display). */
export async function getJurisdiction(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('jurisdictions')
    .select('id, name, type, parent_id, country_code')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Jurisdiction | null
}

/** Get full jurisdiction path (city → district → state → country). */
export async function getJurisdictionPath(cityId?: string, districtId?: string, stateId?: string) {
  const result: { country?: Jurisdiction; state?: Jurisdiction; district?: Jurisdiction; city?: Jurisdiction } = {}
  const supabase = await createServerSupabaseClient()

  async function getById(id: string): Promise<Jurisdiction | null> {
    const { data } = await supabase.from('jurisdictions').select('id, name, type, parent_id, country_code').eq('id', id).single()
    return data as Jurisdiction | null
  }

  if (stateId) {
    result.state = await getById(stateId)
    if (result.state?.parent_id) result.country = await getById(result.state.parent_id)
  }
  if (districtId) {
    result.district = await getById(districtId)
    if (result.district?.parent_id && !result.state) result.state = await getById(result.district.parent_id)
    if (result.state?.parent_id && !result.country) result.country = await getById(result.state.parent_id)
  }
  if (cityId) {
    result.city = await getById(cityId)
    if (result.city?.parent_id && !result.district) result.district = await getById(result.city.parent_id)
    if (result.district?.parent_id && !result.state) result.state = await getById(result.district.parent_id)
    if (result.state?.parent_id && !result.country) result.country = await getById(result.state.parent_id)
  }
  return result
}

// ── ADMIN: Jurisdiction Management ──────────────────────────

export async function adminListJurisdictions(opts?: { type?: string; parentId?: string }) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  let query = admin.from('jurisdictions').select('*').order('sort_order', { ascending: true })
  if (opts?.type) query = query.eq('type', opts.type)
  if (opts?.parentId) query = query.eq('parent_id', opts.parentId)
  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateJurisdiction(input: {
  name: string
  type: string
  parent_id?: string | null
  country_code?: string
  sort_order?: number
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('jurisdictions').insert({
    name: input.name,
    type: input.type,
    parent_id: input.parent_id ?? null,
    country_code: input.country_code ?? 'IN',
    sort_order: input.sort_order ?? 0,
    is_active: true,
  }).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminDeleteJurisdiction(id: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { error } = await admin.from('jurisdictions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
