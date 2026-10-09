'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JurisdictionSelector } from '@/components/shared/jurisdiction-selector'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

interface CentreRegistrationFormProps {
  apiEndpoint?: string
  redirectAfter?: string
  title?: string
}

export function CentreRegistrationForm({
  apiEndpoint = '/api/centres/register',
  redirectAfter = '/centres',
  title = 'Register Your Training Centre',
}: CentreRegistrationFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [about, setAbout] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [pincode, setPincode] = useState('')

  const [stateId, setStateId] = useState('')
  const [stateName, setStateName] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [cityId, setCityId] = useState('')
  const [cityName, setCityName] = useState('')

  // Courses (up to 5 during registration)
  const [courses, setCourses] = useState([{ title: '', description: '', duration: '', fees: '', mode: 'offline' }])

  function addCourse() {
    if (courses.length < 5) setCourses([...courses, { title: '', description: '', duration: '', fees: '', mode: 'offline' }])
  }
  function updateCourse(idx: number, field: string, value: string) {
    setCourses(courses.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  // Office hours
  const [officeHours, setOfficeHours] = useState({
    mon: '9am-7pm', tue: '9am-7pm', wed: '9am-7pm', thu: '9am-7pm', fri: '9am-7pm', sat: '10am-5pm', sun: 'Closed',
  })
  function updateOfficeHours(day: string, value: string) {
    setOfficeHours((prev) => ({ ...prev, [day]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, slug: slugify(slug) || slugify(name), about: about || undefined,
            email, phone, website: website || undefined,
            address_line1: addressLine1, address_line2: addressLine2 || undefined,
            state: stateName, state_jurisdiction_id: stateId || undefined,
            district: districtName, district_jurisdiction_id: districtId || undefined,
            city: cityName, city_jurisdiction_id: cityId || undefined,
            pincode: pincode || undefined,
            office_hours: officeHours,
            courses: courses.filter(c => c.title).map(c => ({
              title: c.title, description: c.description || undefined,
              duration_months: c.duration ? parseInt(c.duration) : undefined,
              fees: c.fees ? parseFloat(c.fees) : undefined, mode: c.mode,
            })),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            toast({ title: 'Sign in required', description: 'Please sign in to register.', variant: 'destructive' })
            router.push('/login?redirect=/centres/register')
            return
          }
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setSuccess(true)
        toast({ title: 'Registration submitted!', description: 'Centre registered successfully.' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <h2 className="text-xl font-bold">Registration Submitted!</h2>
          <p className="text-muted-foreground">
            Thank you for registering your training centre. Our team will verify your details and your centre page will go live soon.
          </p>
          <Button asChild variant="outline"><Link href={redirectAfter}>Back to Centres</Link></Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Centre Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Centre Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Centre Name *</Label>
            <Input id="name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} required placeholder="Excel Mastery Academy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="excel-mastery-academy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell learners about your institute..." className="min-h-[80px]" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="info@institute.com" /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone *</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://institute.com" /></div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <JurisdictionSelector
            onStateChange={(id, name) => { setStateId(id); setStateName(name) }}
            onDistrictChange={(id, name) => { setDistrictId(id); setDistrictName(name) }}
            onCityChange={(id, name) => { setCityId(id); setCityName(name) }}
          />
          <div className="space-y-2"><Label htmlFor="addressLine1">Address Line 1 *</Label><Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required placeholder="Shop 12, Education Hub" /></div>
          <div className="space-y-2"><Label htmlFor="addressLine2">Address Line 2</Label><Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Near Main Road" /></div>
          <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400050" /></div>
        </CardContent>
      </Card>

      {/* Office Hours */}
      <Card>
        <CardHeader><CardTitle className="text-base">Office Hours</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(officeHours).map(([day, time]) => (
              <div key={day} className="space-y-1">
                <Label className="text-xs capitalize">{day}</Label>
                <Input value={time} onChange={(e) => updateOfficeHours(day, e.target.value)} placeholder="9am-7pm" className="h-8 text-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Courses */}
      <Card>
        <CardHeader><CardTitle className="text-base">Courses Offered</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course, idx) => (
            <div key={idx} className="p-3 border rounded-lg space-y-3">
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Course Title</Label>
                  <Input value={course.title} onChange={(e) => updateCourse(idx, 'title', e.target.value)} placeholder="Advanced Excel" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (months)</Label>
                  <Input type="number" value={course.duration} onChange={(e) => updateCourse(idx, 'duration', e.target.value)} placeholder="3" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fees (₹)</Label>
                  <Input type="number" value={course.fees} onChange={(e) => updateCourse(idx, 'fees', e.target.value)} placeholder="15000" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Short Description</Label>
                  <Input value={course.description} onChange={(e) => updateCourse(idx, 'description', e.target.value)} placeholder="Master VLOOKUP, PivotTables, Macros" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mode</Label>
                  <Select value={course.mode} onValueChange={(v) => updateCourse(idx, 'mode', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Online + Offline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {courses.length < 5 && <Button type="button" variant="outline" size="sm" onClick={addCourse}>+ Add Course</Button>}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        Submit Registration
      </Button>
    </form>
  )
}
