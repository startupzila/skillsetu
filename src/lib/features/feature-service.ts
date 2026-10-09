import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Course Resources service — free PDF downloads per course.
 * Bilingual (EN + HI) with SEO content.
 */

export async function listCourseResources(courseId: string, language = 'en') {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('course_resources')
    .select(`
      id, resource_type, file_url, is_external, is_free, sort_order,
      translations:course_resource_translations(title, description, keywords, seo_content, language_code)
    `)
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error) return { data: null, error: error.message }
  const filtered = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    translations: (r.translations as Array<Record<string, unknown>>)?.filter(
      (t) => t.language_code === language,
    ),
  }))
  return { data: filtered, error: null }
}

export async function adminListResources(courseId: string) {
  await requirePermission('course.update')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('course_resources')
    .select(`
      id, resource_type, file_url, is_external, is_free, sort_order, status, created_at,
      translations:course_resource_translations(id, language_code, title, description, keywords, seo_content)
    `)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminCreateResource(input: {
  course_id: string
  resource_type: string
  file_url: string
  is_external?: boolean
  sort_order?: number
  title_en: string
  description_en?: string
  keywords_en?: string[]
  seo_content_en?: string
  title_hi?: string
  description_hi?: string
  keywords_hi?: string[]
  seo_content_hi?: string
}) {
  await requirePermission('course.update')
  const admin = createAdminClient()
  const { data: resource, error: rErr } = await admin
    .from('course_resources')
    .insert({
      course_id: input.course_id,
      resource_type: input.resource_type,
      file_url: input.file_url,
      is_external: input.is_external ?? true,
      is_free: true,
      sort_order: input.sort_order ?? 0,
      status: 'published',
    })
    .select()
    .single()
  if (rErr) return { data: null, error: rErr.message }
  await admin.from('course_resource_translations').insert({
    resource_id: resource.id,
    language_code: 'en',
    title: input.title_en,
    description: input.description_en ?? null,
    keywords: input.keywords_en ?? null,
    seo_content: input.seo_content_en ?? null,
    status: 'published',
  })
  if (input.title_hi) {
    await admin.from('course_resource_translations').insert({
      resource_id: resource.id,
      language_code: 'hi',
      title: input.title_hi,
      description: input.description_hi ?? null,
      keywords: input.keywords_hi ?? null,
      seo_content: input.seo_content_hi ?? null,
      status: 'published',
    })
  }
  await recordAudit({ action: 'resource.create', entityType: 'course_resource', entityId: resource.id })
  return { data: resource, error: null }
}

export async function adminDeleteResource(resourceId: string) {
  await requirePermission('course.update')
  const admin = createAdminClient()
  const { error } = await admin.from('course_resources').delete().eq('id', resourceId)
  if (error) return { error: error.message }
  return { error: null }
}

// ── TRAINING CENTRES ────────────────────────────────────────

export async function listVerifiedCentres(opts?: { city?: string; state?: string; country?: string }) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('training_centres')
    .select(`
      id, slug, name, about, logo_url, cover_url, status, verified_at, established_year,
      locations:centre_locations(id, city, state, country, is_primary)
    `)
    .eq('status', 'verified')
    .order('verified_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  let filtered = data ?? []
  if (opts?.city) filtered = filtered.filter((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    return locs?.some((l) => (l.city as string)?.toLowerCase() === opts.city!.toLowerCase())
  })
  if (opts?.state) filtered = filtered.filter((c: Record<string, unknown>) => {
    const locs = c.locations as Array<Record<string, unknown>>
    return locs?.some((l) => (l.state as string)?.toLowerCase() === opts.state!.toLowerCase())
  })
  return { data: filtered, error: null }
}

export async function getVerifiedCentreBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: centre, error } = await supabase
    .from('training_centres')
    .select(`
      id, slug, name, about, logo_url, cover_url, status, verified_at, established_year, website, email, phone,
      translations:centre_translations(language_code, about),
      locations:centre_locations(id, address_line1, address_line2, city, district, state, country, pincode, latitude, longitude, google_maps_url, office_hours, is_primary),
      courses:centre_courses(id, title, description, duration_months, fees, mode, linked_course_id),
      reviews:centre_reviews(id, rating, review_text, is_verified, created_at)
    `)
    .eq('slug', slug)
    .eq('status', 'verified')
    .single()
  if (error) return { data: null, error: error.message }
  return { data: centre, error: null }
}

export async function registerCentre(input: {
  name: string; slug: string; about?: string; email: string; phone: string; website?: string;
  address_line1: string; city: string; state: string; country?: string; pincode?: string;
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('training_centres')
    .insert({
      slug: input.slug, name: input.name, about: input.about ?? null,
      email: input.email, phone: input.phone, website: input.website ?? null,
      status: 'pending', owner_id: user?.id ?? null,
    })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  await supabase.from('centre_locations').insert({
    centre_id: data.id, address_line1: input.address_line1, city: input.city,
    state: input.state, country: input.country ?? 'India', pincode: input.pincode ?? null,
    is_primary: true,
  })
  await recordAudit({ action: 'centre.register', entityType: 'centre', entityId: data.id })
  return { data, error: null }
}

export async function adminListCentres() {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('training_centres')
    .select(`id, slug, name, about, status, verified_at, created_at,
       locations:centre_locations(city, state, country), courses:centre_courses(id)`)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminVerifyCentre(centreId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const session = await requireUser()
  const { data, error } = await admin
    .from('training_centres')
    .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: session.user.id })
    .eq('id', centreId).select().single()
  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'centre.verify', entityType: 'centre', entityId: centreId })
  return { data, error: null }
}

export async function adminRejectCentre(centreId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('training_centres')
    .update({ status: 'rejected' }).eq('id', centreId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── CENTRE UPDATE/DELETE ───────────────────────────────────

export async function adminGetCentre(centreId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data: centre, error } = await admin
    .from('training_centres')
    .select(`id, slug, name, about, status, email, phone, website, established_year,
       locations:centre_locations(id, address_line1, address_line2, city, district, state, country, pincode, office_hours, is_primary, state_jurisdiction_id, district_jurisdiction_id, city_jurisdiction_id),
       courses:centre_courses(id, title, description, duration_months, fees, mode)`)
    .eq('id', centreId)
    .single()
  if (error) return { data: null, error: error.message }
  return { data: centre, error: null }
}

export async function adminUpdateCentre(centreId: string, updates: {
  name?: string; about?: string; email?: string; phone?: string; website?: string; established_year?: number; status?: string
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('training_centres').update(updates).eq('id', centreId).select().single()
  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'centre.update', entityType: 'centre', entityId: centreId })
  return { data, error: null }
}

export async function adminUpdateCentreLocation(locationId: string, updates: {
  address_line1?: string; address_line2?: string; city?: string; district?: string; state?: string; pincode?: string; office_hours?: Record<string, string>
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('centre_locations').update(updates).eq('id', locationId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminUpdateCentreCourse(courseId: string, updates: {
  title?: string; description?: string; duration_months?: number; fees?: number; mode?: string
}) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('centre_courses').update(updates).eq('id', courseId).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminAddCentreCourse(input: { centre_id: string; title: string; description?: string; duration_months?: number; fees?: number; mode?: string }) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin.from('centre_courses').insert({
    centre_id: input.centre_id, title: input.title, description: input.description ?? null,
    duration_months: input.duration_months ?? null, fees: input.fees ?? null, mode: input.mode ?? 'offline',
  }).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function adminDeleteCentreCourse(courseId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { error } = await admin.from('centre_courses').delete().eq('id', courseId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function adminDeleteCentre(centreId: string) {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  // Delete location first (FK constraint)
  await admin.from('centre_locations').delete().eq('centre_id', centreId)
  await admin.from('centre_courses').delete().eq('centre_id', centreId)
  await admin.from('centre_reviews').delete().eq('centre_id', centreId)
  const { error } = await admin.from('training_centres').delete().eq('id', centreId)
  if (error) return { error: error.message }
  await recordAudit({ action: 'centre.delete', entityType: 'centre', entityId: centreId })
  return { error: null }
}
