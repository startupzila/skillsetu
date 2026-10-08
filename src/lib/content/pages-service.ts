import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Static pages service — read + admin CRUD for CMS-managed pages.
 *
 * @see prisma/schema.prisma (StaticPage, StaticPageTranslation)
 */

export interface StaticPageData {
  id: string
  slug: string
  status: string
  show_in_footer: boolean
  title: string
  content: string
  meta_description: string | null
}

/** Get a published static page by slug. */
export async function getPublishedPageBySlug(slug: string, language = 'en') {
  const supabase = await createServerSupabaseClient()

  const { data: page, error: pErr } = await supabase
    .from('static_pages')
    .select('id, slug, status, show_in_footer')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (pErr || !page) return { data: null, error: 'Page not found' }

  const { data: trans } = await supabase
    .from('static_page_translations')
    .select('title, content, meta_description')
    .eq('page_id', page.id)
    .eq('language_code', language)
    .eq('status', 'published')
    .single()

  if (!trans) return { data: null, error: 'Translation not found' }

  return {
    data: { ...page, ...trans } as StaticPageData,
    error: null,
  }
}

/** List all published pages that should show in footer. */
export async function listFooterPages(language = 'en') {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('static_pages')
    .select(
      `slug,
       translations:static_page_translations(title)`,
    )
    .eq('status', 'published')
    .eq('show_in_footer', true)
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []).map((p: Record<string, unknown>) => {
    const translations = p.translations as { title: string }[]
    return { slug: p.slug, title: translations?.[0]?.title ?? p.slug }
  })
}

// ── Admin ───────────────────────────────────────────────────

/** List all static pages (including drafts). */
export async function adminListPages() {
  await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('static_pages')
    .select(
      `id, slug, status, sort_order, show_in_footer, published_at, created_at,
       translations:static_page_translations(title, language_code, status)`,
    )
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single page with translation. */
export async function adminGetPage(pageId: string) {
  await requireUser()
  const admin = createAdminClient()

  const { data: page, error: pErr } = await admin
    .from('static_pages')
    .select('id, slug, status, sort_order, show_in_footer')
    .eq('id', pageId)
    .single()
  if (pErr) return { data: null, error: pErr.message }

  const { data: trans } = await admin
    .from('static_page_translations')
    .select('id, title, content, meta_description, status')
    .eq('page_id', pageId)
    .eq('language_code', 'en')
    .single()

  return {
    data: { ...page, translation: trans },
    error: null,
  }
}

/** Create a page. */
export async function adminCreatePage(input: {
  slug: string
  title: string
  content: string
  meta_description?: string
  show_in_footer?: boolean
  sort_order?: number
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data: page, error: pErr } = await admin
    .from('static_pages')
    .insert({
      slug: input.slug,
      status: 'draft',
      sort_order: input.sort_order ?? 0,
      show_in_footer: input.show_in_footer ?? true,
    })
    .select()
    .single()
  if (pErr) return { data: null, error: pErr.message }

  const { error: tErr } = await admin.from('static_page_translations').insert({
    page_id: page.id,
    language_code: 'en',
    title: input.title,
    content: input.content,
    meta_description: input.meta_description ?? null,
    status: 'draft',
  })
  if (tErr) return { data: null, error: tErr.message }

  return { data: page, error: null }
}

/** Update a page translation. */
export async function adminUpdatePageTranslation(
  translationId: string,
  updates: { title?: string; content?: string; meta_description?: string | null },
) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('static_page_translations')
    .update(updates)
    .eq('id', translationId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Publish a page. */
export async function adminPublishPage(pageId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('static_pages')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', pageId)
    .select()
    .single()

  // Also publish the EN translation
  await admin
    .from('static_page_translations')
    .update({ status: 'published' })
    .eq('page_id', pageId)
    .eq('language_code', 'en')

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'page.publish', entityType: 'page', entityId: pageId })
  return { data, error: null }
}

// ── Custom Code ────────────────────────────────────────────

/** List active custom code for a location (head, body_start, body_end). */
export async function getActiveCustomCode() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('custom_code')
    .select('name, location, code, page_pattern')
    .eq('is_active', true)

  if (error || !data) return []
  return data as Array<{
    name: string
    location: string
    code: string
    page_pattern: string | null
  }>
}

/** Admin: list all custom code entries. */
export async function adminListCustomCode() {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('custom_code')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Admin: create custom code. */
export async function adminCreateCustomCode(input: {
  name: string
  location: string // head | body_start | body_end
  code: string
  page_pattern?: string | null
  is_active?: boolean
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('custom_code')
    .insert({
      name: input.name,
      location: input.location,
      code: input.code,
      page_pattern: input.page_pattern ?? null,
      is_active: input.is_active ?? false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'custom_code.create', entityType: 'custom_code', entityId: data.id })
  return { data, error: null }
}

/** Admin: update custom code. */
export async function adminUpdateCustomCode(
  codeId: string,
  updates: { name?: string; code?: string; is_active?: boolean; page_pattern?: string | null },
) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('custom_code')
    .update(updates)
    .eq('id', codeId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Admin: delete custom code. */
export async function adminDeleteCustomCode(codeId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()

  const { error } = await admin.from('custom_code').delete().eq('id', codeId)
  if (error) return { error: error.message }
  return { error: null }
}
