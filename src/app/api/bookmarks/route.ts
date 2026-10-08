import { NextResponse } from 'next/server'
import { toggleBookmark, listMyBookmarks } from '@/lib/learning'
import type { EntityType } from '@/lib/learning'

/**
 * GET /api/bookmarks?type=lesson
 *   Lists the current user's bookmarks (optionally filtered by entity type).
 *
 * POST /api/bookmarks
 *   Body: { entityType: 'course'|'lesson'|'book', entityId: string }
 *   Toggles a bookmark (adds if absent, removes if present).
 *
 * Requires authentication.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as EntityType | null

  try {
    const { data, error } = await listMyBookmarks(type ?? undefined)
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { entityType?: EntityType; entityId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { entityType, entityId } = body

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: 'Missing `entityType` or `entityId`' },
      { status: 400 },
    )
  }

  try {
    const { data, error } = await toggleBookmark(entityType, entityId)
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
