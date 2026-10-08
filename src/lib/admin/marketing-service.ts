import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requirePermission, requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Admin marketing service — affiliate links + ad slots.
 * @see prisma/schema.prisma (AffiliateLink, AdSlotConfig)
 */

// ── AFFILIATE LINKS ─────────────────────────────────────────

export async function adminListAffiliates() {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('affiliate_links').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateAffiliate(input: {
  provider: string; product_name: string; destination_url: string;
  tracking_url?: string; disclosure?: string; placement?: string; campaign?: string
}) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('affiliate_links').insert({
    ...input, is_active: true,
  }).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminDeleteAffiliate(id: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_links').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function adminToggleAffiliate(id: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data: current } = await admin.from('affiliate_links').select('is_active').eq('id', id).single()
  const { data, error } = await admin.from('affiliate_links')
    .update({ is_active: !current?.is_active }).eq('id', id).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Public: list active affiliate links (for rendering on pages). */
export async function listActiveAffiliates() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('affiliate_links').select('*').eq('is_active', true)
  return data ?? []
}

// ── AD SLOTS ───────────────────────────────────────────────

export async function adminListAds() {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('ad_slots').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateAd(input: {
  slot: string; name: string; code?: string; starts_at?: string; ends_at?: string
}) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('ad_slots').insert({
    ...input, is_active: false,
  }).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminToggleAd(id: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { data: current } = await admin.from('ad_slots').select('is_active').eq('id', id).single()
  const { data, error } = await admin.from('ad_slots')
    .update({ is_active: !current?.is_active }).eq('id', id).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminDeleteAd(id: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()
  const { error } = await admin.from('ad_slots').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

/** Public: list active ad slots (for rendering on pages). */
export async function listActiveAds() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('ad_slots').select('*').eq('is_active', true)
  return data ?? []
}
