import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

export async function POST(request: Request) {
  let body: {
    name?: string; slug?: string; about?: string; email?: string; phone?: string; website?: string;
    address_line1?: string; address_line2?: string;
    state?: string; state_jurisdiction_id?: string;
    district?: string; district_jurisdiction_id?: string;
    city?: string; city_jurisdiction_id?: string;
    pincode?: string;
    courses?: Array<{ title: string; duration_months?: number; fees?: number; mode?: string }>;
  }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name || !body.slug || !body.email || !body.phone || !body.address_line1 || !body.state)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const session = await requireUser()
  const supabase = await createServerSupabaseClient()

  // Create centre
  const { data: centre, error: cErr } = await supabase
    .from('training_centres')
    .insert({
      slug: body.slug, name: body.name, about: body.about ?? null,
      email: body.email, phone: body.phone, website: body.website ?? null,
      status: 'pending', owner_id: session.user.id,
    })
    .select()
    .single()
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // Create location with jurisdiction IDs
  const { error: lErr } = await supabase.from('centre_locations').insert({
    centre_id: centre.id,
    address_line1: body.address_line1,
    address_line2: body.address_line2 ?? null,
    city: body.city ?? body.district ?? body.state,
    district: body.district ?? null,
    state: body.state,
    country: 'India',
    pincode: body.pincode ?? null,
    state_jurisdiction_id: body.state_jurisdiction_id ?? null,
    district_jurisdiction_id: body.district_jurisdiction_id ?? null,
    city_jurisdiction_id: body.city_jurisdiction_id ?? null,
    is_primary: true,
  })
  if (lErr) console.error('Location error:', lErr.message)

  // Create courses
  if (body.courses && body.courses.length > 0) {
    for (const course of body.courses) {
      await supabase.from('centre_courses').insert({
        centre_id: centre.id,
        title: course.title,
        duration_months: course.duration_months ?? null,
        fees: course.fees ?? null,
        mode: course.mode ?? 'offline',
      })
    }
  }

  await recordAudit({ action: 'centre.register', entityType: 'centre', entityId: centre.id })
  return NextResponse.json({ data: centre, message: 'Registration submitted! We will verify your centre soon.' })
}
