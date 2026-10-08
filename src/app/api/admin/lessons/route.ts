import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { adminCreateLesson, adminPublishLesson, adminUpdateLessonTranslation } from '@/lib/admin/content-service'

/**
 * /api/admin/lessons?id=<uuid> — GET a single lesson (with translation).
 * /api/admin/lessons — POST create a lesson.
 * /api/admin/lessons?action=publish&id=<uuid> — POST publish.
 * /api/admin/lessons?action=update-translation&id=<uuid> — POST update translation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing `id`' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: lesson, error: lErr } = await supabase
    .from('lessons')
    .select('id, slug, status, duration_minutes, module_id')
    .eq('id', id)
    .single()
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 404 })

  const { data: trans } = await supabase
    .from('lesson_translations')
    .select('id, title, summary, status')
    .eq('lesson_id', id)
    .eq('language_code', 'en')
    .single()

  return NextResponse.json({
    data: {
      ...lesson,
      title: trans?.title ?? '',
      summary: trans?.summary ?? '',
      translationId: trans?.id ?? '',
    },
  })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Publish action
  if (action === 'publish') {
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing `id`' }, { status: 400 })

    const { data, error } = await adminPublishLesson(id)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  // Update translation action
  if (action === 'update-translation') {
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing `id`' }, { status: 400 })

    let body: { title?: string; summary?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { data, error } = await adminUpdateLessonTranslation(id, body)
    if (error) {
      if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  // Default: create lesson
  let body: {
    module_id?: string
    slug?: string
    title?: string
    summary?: string
    sort_order?: number
    lesson_type?: string
    duration_minutes?: number | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.module_id || !body.slug || !body.title) {
    return NextResponse.json(
      { error: 'Missing `module_id`, `slug`, or `title`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateLesson({
    module_id: body.module_id,
    slug: body.slug,
    title: body.title,
    summary: body.summary,
    sort_order: body.sort_order,
    lesson_type: body.lesson_type,
    duration_minutes: body.duration_minutes,
  })

  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.includes('FORBIDDEN') || error.includes('Insufficient')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
