import { NextResponse } from 'next/server'
import {
  adminListBlocks,
  adminCreateBlock,
  adminGetLessonTranslation,
  adminReorderBlocks,
} from '@/lib/admin/content-service'

/**
 * /api/admin/blocks?lessonTranslationId=<uuid>  GET — list blocks
 * /api/admin/blocks  POST — create a block
 * /api/admin/blocks?lessonId=<uuid>  POST — create a block (auto-finds translation)
 * /api/admin/blocks?action=reorder  POST — reorder blocks
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lessonTranslationId = searchParams.get('lessonTranslationId')
  if (!lessonTranslationId) {
    return NextResponse.json({ error: 'Missing `lessonTranslationId`' }, { status: 400 })
  }

  const { data, error } = await adminListBlocks(lessonTranslationId)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Reorder action
  if (action === 'reorder') {
    let body: Array<{ id: string; sort_order: number }>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { error } = await adminReorderBlocks(body)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  // Create block
  let body: {
    lesson_translation_id?: string
    lessonId?: string
    block_type?: string
    data?: Record<string, unknown>
    sort_order?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let translationId = body.lesson_translation_id

  // If lessonId is provided, find the translation
  if (!translationId && body.lessonId) {
    const { data: trans, error: tErr } = await adminGetLessonTranslation(body.lessonId)
    if (tErr) return NextResponse.json({ error: tErr }, { status: 500 })
    translationId = trans?.id
  }

  if (!translationId || !body.block_type || !body.data) {
    return NextResponse.json(
      { error: 'Missing `lesson_translation_id` (or `lessonId`), `block_type`, or `data`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateBlock({
    lesson_translation_id: translationId,
    block_type: body.block_type,
    data: body.data,
    sort_order: body.sort_order,
  })

  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (error.includes('FORBIDDEN') || error.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
