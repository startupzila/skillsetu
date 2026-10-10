import { NextResponse } from 'next/server'
import { adminUpdateModule, adminUpdateModuleTranslation, adminDeleteModule } from '@/lib/admin/content-service'

/**
 * /api/admin/modules/[id]
 * PATCH — update module core fields and/or translation:
 *   body: { module?: {...core}, translation?: { lang, title?, description? } }
 *   (flat body like { slug, sort_order } also works for core fields)
 * DELETE — delete the module (cascades to translations + lessons).
 */
const authError = (error: string) => {
  if (error.includes('UNAUTHENTICATED')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (error.includes('FORBIDDEN') || error.includes('Insufficient')) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  return NextResponse.json({ error }, { status: 500 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result: Record<string, unknown> = {}

  const moduleFields = (body.module as Record<string, unknown>) ?? (() => {
    const allowed = ['slug', 'sort_order', 'status', 'published_at']
    const out: Record<string, unknown> = {}
    for (const k of allowed) if (k in body) out[k] = body[k]
    return out
  })()
  if (Object.keys(moduleFields).length > 0) {
    const { data, error } = await adminUpdateModule(id, moduleFields)
    if (error) return authError(error)
    result.module = data
  }

  const translation = body.translation as ({ lang?: string } & Record<string, unknown>) | undefined
  if (translation && translation.lang) {
    const { lang, ...transFields } = translation
    const { data, error } = await adminUpdateModuleTranslation(
      id,
      lang as string,
      transFields as { title?: string; description?: string | null },
    )
    if (error) return authError(error)
    result.translation = data
  }

  if (!result.module && !result.translation) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }
  return NextResponse.json({ data: result })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await adminDeleteModule(id)
  if (error) return authError(error)
  return NextResponse.json({ data: { deleted: true } })
}
