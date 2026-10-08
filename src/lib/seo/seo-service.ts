import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, requirePermission } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * SEO service — reads per-entity SEO metadata and redirects.
 *
 * @see prisma/schema.prisma (SeoMetadata, Redirect models)
 */

export interface SeoMetadata {
  seo_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  noindex?: boolean
  og_title?: string | null
  og_description?: string | null
  og_image_url?: string | null
  twitter_card?: string | null
}

/** Get SEO metadata for an entity (course, lesson, category, etc.). */
export async function getSeoMetadata(
  entityType: string,
  entityId: string,
  language = 'en',
): Promise<SeoMetadata | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('seo_metadata')
    .select(
      'seo_title, meta_description, canonical_url, noindex, og_title, og_description, og_image_media_id, twitter_card',
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('language_code', language)
    .single()

  if (error || !data) return null

  // Resolve OG image URL if media_id is set
  let og_image_url: string | null = null
  if (data.og_image_media_id) {
    const { data: media } = await supabase
      .from('media_assets')
      .select('storage_path, bucket')
      .eq('id', data.og_image_media_id)
      .single()
    if (media) {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      og_image_url = `${projectUrl}/storage/v1/object/public/${media.bucket}/${media.storage_path}`
    }
  }

  return {
    seo_title: data.seo_title,
    meta_description: data.meta_description,
    canonical_url: data.canonical_url,
    noindex: data.noindex,
    og_title: data.og_title,
    og_description: data.og_description,
    og_image_url,
    twitter_card: data.twitter_card,
  }
}

/** Check if a path matches a redirect. Returns the redirect or null. */
export async function matchRedirect(pathname: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('redirects')
    .select('to_url, status_code')
    .eq('from_path', pathname)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as { to_url: string; status_code: number }
}

// ── Admin (service-role) ────────────────────────────────────

/** List all redirects (for console). */
export async function adminListRedirects() {
  await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a redirect. */
export async function adminCreateRedirect(input: {
  from_path: string
  to_url: string
  status_code?: number
  notes?: string
}) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('redirects')
    .insert({
      from_path: input.from_path,
      to_url: input.to_url,
      status_code: input.status_code ?? 301,
      is_active: true,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'redirect.create', entityType: 'redirect', entityId: data.id })
  return { data, error: null }
}

/** Delete a redirect. */
export async function adminDeleteRedirect(redirectId: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()

  const { error } = await admin.from('redirects').delete().eq('id', redirectId)
  if (error) return { error: error.message }
  return { error: null }
}

/** Toggle redirect active status. */
export async function adminToggleRedirect(redirectId: string) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()

  const { data: current } = await admin
    .from('redirects')
    .select('is_active')
    .eq('id', redirectId)
    .single()

  const { data, error } = await admin
    .from('redirects')
    .update({ is_active: !current?.is_active })
    .eq('id', redirectId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** List SEO metadata entries (for console). */
export async function adminListSeoMetadata() {
  await requirePermission('seo.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('seo_metadata')
    .select('id, entity_type, entity_id, language_code, seo_title, noindex, canonical_url')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create or update SEO metadata for an entity. */
export async function adminUpsertSeoMetadata(input: {
  entity_type: string
  entity_id: string
  language_code?: string
  seo_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  noindex?: boolean
  og_title?: string | null
  og_description?: string | null
}) {
  await requirePermission('seo.manage')
  const admin = createAdminClient()

  // Check if exists
  const { data: existing } = await admin
    .from('seo_metadata')
    .select('id')
    .eq('entity_type', input.entity_type)
    .eq('entity_id', input.entity_id)
    .eq('language_code', input.language_code ?? 'en')
    .single()

  if (existing) {
    const { data, error } = await admin
      .from('seo_metadata')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  }

  const { data, error } = await admin.from('seo_metadata').insert(input).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
