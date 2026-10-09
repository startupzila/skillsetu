import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'

export async function GET() {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .select(`id, slug, sort_order, status, created_at,
       translations:category_translations(language_code, name, description, status)`)
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  await requirePermission('settings.manage')
  let body: { slug?: string; name?: string; description?: string; sort_order?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.slug || !body.name) return NextResponse.json({ error: 'Missing slug or name' }, { status: 400 })

  const admin = createAdminClient()
  const { data: cat, error: cErr } = await admin.from('categories')
    .insert({ slug: body.slug, sort_order: body.sort_order ?? 0, status: 'published', published_at: new Date().toISOString() })
    .select().single()
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  await admin.from('category_translations').insert({
    category_id: cat.id, language_code: 'en', name: body.name,
    description: body.description ?? null, status: 'published',
  })
  return NextResponse.json({ data: cat })
}
