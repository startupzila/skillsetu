import { NextResponse } from 'next/server'
import { adminCreateComment, adminListComments } from '@/lib/admin/editorial-service'
import type { EntityType } from '@/lib/auth/permissions'

/** GET /api/admin/editorial/comments?entityType=lesson&entityId=<uuid> */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType') as EntityType | null
  const entityId = searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'Missing `entityType` or `entityId`' }, { status: 400 })
  }

  const { data, error } = await adminListComments(entityType, entityId)
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}

/** POST /api/admin/editorial/comments — create a comment. */
export async function POST(request: Request) {
  let body: { entityType?: EntityType; entityId?: string; comment?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.entityType || !body.entityId || !body.comment) {
    return NextResponse.json(
      { error: 'Missing `entityType`, `entityId`, or `comment`' },
      { status: 400 },
    )
  }

  const { data, error } = await adminCreateComment({
    entityType: body.entityType,
    entityId: body.entityId,
    comment: body.comment,
  })

  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
