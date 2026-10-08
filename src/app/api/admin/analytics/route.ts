import { NextResponse } from 'next/server'
import { getAdminMetrics, getRecentEvents } from '@/lib/analytics/analytics-service'

/** GET /api/admin/analytics — get aggregate metrics + recent events. */
export async function GET() {
  try {
    const [metrics, recentEvents] = await Promise.all([
      getAdminMetrics(),
      getRecentEvents(20),
    ])
    return NextResponse.json({ data: { metrics, recentEvents } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication') || msg.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (msg.includes('FORBIDDEN') || msg.includes('Insufficient'))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
