import { NextResponse } from 'next/server'
import { adminListMedia } from '@/lib/admin/media-service'

/** GET /api/admin/media?type=image&limit=50 — list media assets. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fileType = searchParams.get('type') ?? undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined

  const { data, error } = await adminListMedia({ fileType, limit, offset })
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
