import { NextResponse } from 'next/server'
import { registerCentre } from '@/lib/features/feature-service'

export async function POST(request: Request) {
  let body: { name?: string; slug?: string; about?: string; email?: string; phone?: string; website?: string; address_line1?: string; city?: string; state?: string; country?: string; pincode?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.name || !body.slug || !body.email || !body.phone || !body.address_line1 || !body.city || !body.state)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await registerCentre(body as Parameters<typeof registerCentre>[0])
  if (error) {
    if (error.includes('Authentication') || error.includes('UNAUTHENTICATED'))
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json({ data, message: 'Registration submitted! We will verify your centre soon.' })
}
