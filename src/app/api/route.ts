import { NextResponse } from 'next/server'

/**
 * GET /api
 *
 * Root API info for MioDemy.
 * Individual feature routes are added from S2 onwards.
 */
export async function GET() {
  return NextResponse.json({
    service: 'miodemy',
    description: 'Structured, multilingual, practical skills learning platform.',
    docs: '/api/health',
    version: '0.1.0',
  })
}
