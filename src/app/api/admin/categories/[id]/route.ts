import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission('settings.manage')
  const { id } = await params
  let body: { name?: string; description?: string; sort_order?: number; status?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const admin = createAdminClient()
  if (body.name) {
    await admin.from('category_translations')
      .update({ name: body.name, description: body.description ?? null })
      .eq('category_id', id).eq('language_code', 'en')
  }
  const updates: Record<string, unknown> = {}
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.status) updates.status = body.status
  if (Object.keys(updates).length > 0) {
    await admin.from('categories').update(updates).eq('id', id)
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission('settings.manage')
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
