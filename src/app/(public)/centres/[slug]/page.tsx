import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getVerifiedCentreBySlug } from '@/lib/features/feature-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { safeFetch } from '@/lib/safe-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, Phone, Mail, Globe, Clock, Star, Building2, CheckCircle2, GraduationCap } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await safeFetch(() => getVerifiedCentreBySlug(slug))
  const centre = res?.data
  if (!centre) return { title: 'Centre not found' }
  const c = centre as Record<string, unknown>
  const locs = c.locations as Array<Record<string, unknown>>
  const loc = locs?.[0]
  return {
    title: `${c.name as string} — Training Centre in ${loc?.city ?? 'India'}`,
    description: `${c.name as string} is a verified training centre in ${loc?.city ?? ''}, ${loc?.state ?? ''}. ${(c.about as string)?.slice(0, 120) ?? ''}`,
    openGraph: { title: c.name as string, description: c.about as string, type: 'website' },
  }
}

function formatHours(hours: Record<string, string> | null): string {
  if (!hours) return 'Contact for hours'
  return Object.entries(hours).map(([day, time]) => `${day}: ${time}`).join(', ')
}

export default async function CentreDetailPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch resiliently: a throw (Supabase env vars missing) renders a
  // friendly fallback instead of a 500. A genuine not-found returns 404.
  let centre = null
  let unavailable = false
  try {
    const res = await getVerifiedCentreBySlug(slug)
    centre = res.data
    // Service-level error (not a throw): treat as not-found if no data.
    if (res.error && !centre) {
      // Could be a real "not found" OR a Supabase error; without more
      // signal we conservatively return ServiceUnavailable so a fresh
      // deploy never shows a wrong 404.
      unavailable = true
    }
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!centre) notFound()

  const c = centre as Record<string, unknown>
  const locations = c.locations as Array<Record<string, unknown>>
  const loc = locations?.find((l) => l.is_primary) ?? locations?.[0]
  const courses = c.courses as Array<Record<string, unknown>>
  const reviews = c.reviews as Array<Record<string, unknown>>
  const avgRating = reviews?.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating as number), 0) / reviews.length).toFixed(1) : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Centres', href: '/centres' }, { label: c.name as string }]} />

      {/* Cover + Header */}
      <div className="mt-6 mb-6">
        <div className="h-48 md:h-64 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-6">
          <div className="flex items-end gap-4">
            <div className="rounded-xl bg-background p-3 shadow-lg border">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{c.name as string}</h1>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {avgRating} ({reviews?.length ?? 0} reviews)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal menu */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {['Overview', 'Courses', 'Reviews', 'Contact'].map((tab, i) => (
          <a key={tab} href={`#${tab.toLowerCase()}`} className={`px-4 py-2 text-sm font-medium hover:text-primary ${i === 0 ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {tab}
          </a>
        ))}
      </div>

      {/* Overview */}
      <section id="overview" className="mb-8 space-y-4">
        <h2 className="text-xl font-bold">About</h2>
        <p className="text-muted-foreground leading-relaxed">{c.about as string}</p>
        {c.established_year && (
          <p className="text-sm text-muted-foreground">Established in {c.established_year as number}</p>
        )}
      </section>

      <Separator className="my-6" />

      {/* Courses */}
      <section id="courses" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Courses Offered</h2>
        {courses && courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id as string}>
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-base">{course.title as string}</h3>
                    <Badge variant="outline" className="capitalize text-xs">{course.mode as string}</Badge>
                  </div>
                  {course.description && <p className="text-sm text-muted-foreground">{course.description as string}</p>}
                  <div className="flex items-center gap-4 text-sm">
                    {course.duration_months && <span className="text-muted-foreground">{course.duration_months as number} months</span>}
                    {course.fees && <span className="font-medium">₹{(course.fees as number).toLocaleString('en-IN')}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No courses listed yet.</p>}
      </section>

      <Separator className="my-6" />

      {/* Reviews */}
      <section id="reviews" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Reviews</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <Card key={rev.id as string}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < (rev.rating as number) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    {rev.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{rev.review_text as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No reviews yet.</p>}
      </section>

      <Separator className="my-6" />

      {/* Contact */}
      <section id="contact" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Contact & Location</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5 space-y-3 text-sm">
              {loc && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{loc.address_line1 as string}</p>
                    {loc.address_line2 && <p>{loc.address_line2 as string}</p>}
                    <p>{loc.city as string}, {loc.state as string} {loc.pincode as string}</p>
                    <p>{loc.country as string}</p>
                  </div>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${c.phone}`}>{c.phone as string}</a>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${c.email}`}>{c.email as string}</a>
                </div>
              )}
              {c.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={c.website as string} target="_blank" rel="noopener noreferrer">{c.website as string}</a>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Office Hours</p>
                  {loc?.office_hours ? (
                    <div className="space-y-0.5 mt-1">
                      {Object.entries(loc.office_hours as Record<string, string>).map(([day, time]) => (
                        <p key={day} className="text-muted-foreground capitalize">{day}: {time}</p>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Contact for hours</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Admission CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center space-y-3">
          <GraduationCap className="h-8 w-8 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Interested in admission?</h2>
          <p className="text-muted-foreground">Contact {c.name as string} directly using the details above.</p>
          {c.phone && (
            <Button asChild>
              <a href={`tel:${c.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
