import { NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics/analytics-service'

/** POST /api/analytics/track — track a product event. */
export async function POST(request: Request) {
  let body: { action?: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.action) return NextResponse.json({ error: 'Missing `action`' }, { status: 400 })

  await trackEvent(body)
  return NextResponse.json({ success: true })
}
