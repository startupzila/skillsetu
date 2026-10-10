'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Trash2, Plus, Phone, Mail, Globe, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CentreEditorProps {
  centre: Record<string, unknown>
}

export function CentreEditor({ centre }: CentreEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const centreId = centre.id as string
  const locations = (centre.locations as Array<Record<string, unknown>>) ?? []
  const courses = (centre.courses as Array<Record<string, unknown>>) ?? []
  const primaryLoc = locations.find(l => l.is_primary) ?? locations[0]

  const [name, setName] = useState(centre.name as string)
  const [about, setAbout] = useState(centre.about as string ?? '')
  const [email, setEmail] = useState(centre.email as string ?? '')
  const [phone, setPhone] = useState(centre.phone as string ?? '')
  const [website, setWebsite] = useState(centre.website as string ?? '')
  const [establishedYear, setEstablishedYear] = useState(String(centre.established_year ?? ''))

  const [addressLine1, setAddressLine1] = useState(primaryLoc?.address_line1 as string ?? '')
  const [addressLine2, setAddressLine2] = useState(primaryLoc?.address_line2 as string ?? '')
  const [city, setCity] = useState(primaryLoc?.city as string ?? '')
  const [district, setDistrict] = useState(primaryLoc?.district as string ?? '')
  const [state, setState] = useState(primaryLoc?.state as string ?? '')
  const [pincode, setPincode] = useState(primaryLoc?.pincode as string ?? '')
  const [officeHours, setOfficeHours] = useState<Record<string, string>>(
    (primaryLoc?.office_hours as Record<string, string>) ?? { mon: '9am-7pm', tue: '9am-7pm', wed: '9am-7pm', thu: '9am-7pm', fri: '9am-7pm', sat: '10am-5pm', sun: 'Closed' }
  )

  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')
  const [newCourseDuration, setNewCourseDuration] = useState('')
  const [newCourseFees, setNewCourseFees] = useState('')
  const [newCourseMode, setNewCourseMode] = useState('offline')

  function saveCentre() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/centres/${centreId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, about: about || null, email, phone, website: website || null, established_year: establishedYear ? parseInt(establishedYear) : null }),
        })
        if (!res.ok) { const d = await res.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); return }

        if (primaryLoc) {
          await fetch(`/api/admin/centres/${centreId}?action=update-location&locationId=${primaryLoc.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address_line1: addressLine1, address_line2: addressLine2 || null, city, district: district || null, state, pincode: pincode || null, office_hours: officeHours }),
          })
        }
        toast({ title: 'Centre updated' })
        router.refresh()
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function deleteCentre() {
    if (!confirm('Delete this centre? This cannot be undone.')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/centres/${centreId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Centre deleted' }); router.push('/console/centres') }
    })
  }

  function addCourse() {
    if (!newCourseTitle) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/centres/${centreId}/courses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc || undefined, duration_months: newCourseDuration ? parseInt(newCourseDuration) : undefined, fees: newCourseFees ? parseFloat(newCourseFees) : undefined, mode: newCourseMode }),
      })
      if (res.ok) { setNewCourseTitle(''); setNewCourseDesc(''); setNewCourseDuration(''); setNewCourseFees(''); toast({ title: 'Course added' }); router.refresh() }
    })
  }

  function deleteCourse(courseId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/centres/${centreId}/courses/${courseId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Course deleted' }); router.refresh() }
    })
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/console/centres"><ArrowLeft className="h-4 w-4 mr-1" />Back to Centres</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Centre</h1>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteCentre} disabled={isPending}>
          <Trash2 className="h-4 w-4 mr-1" />Delete
        </Button>
      </div>

      {/* Centre Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Centre Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>About</Label><Textarea value={about} onChange={(e) => setAbout(e.target.value)} className="min-h-[80px]" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
            <div className="space-y-2"><Label>Established Year</Label><Input type="number" value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Address Line 1</Label><Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} /></div>
          <div className="space-y-2"><Label>Address Line 2</Label><Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="space-y-2"><Label>District</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
            <div className="space-y-2"><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Pincode</Label><Input value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
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
                <Input value={time} onChange={(e) => setOfficeHours(prev => ({ ...prev, [day]: e.target.value }))} className="h-8 text-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Courses */}
      <Card>
        <CardHeader><CardTitle className="text-base">Courses Offered ({courses.length})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {courses.map((c) => (
            <div key={c.id as string} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{c.title as string}</p>
                {c.description && <p className="text-xs text-muted-foreground">{c.description as string}</p>}
                <div className="flex gap-2 mt-1">
                  {c.duration_months && <Badge variant="outline" className="text-xs">{c.duration_months as number} months</Badge>}
                  {c.fees && <Badge variant="outline" className="text-xs">₹{(c.fees as number).toLocaleString('en-IN')}</Badge>}
                  <Badge variant="secondary" className="text-xs capitalize">{c.mode as string}</Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteCourse(c.id as string)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}

          {/* Add new course */}
          <div className="p-3 border rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Add New Course</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} placeholder="Advanced Excel" /></div>
              <div className="space-y-1"><Label className="text-xs">Short Description</Label><Input value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} placeholder="Master VLOOKUP, PivotTables" /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Duration (months)</Label><Input type="number" value={newCourseDuration} onChange={(e) => setNewCourseDuration(e.target.value)} placeholder="3" /></div>
              <div className="space-y-1"><Label className="text-xs">Fees (₹)</Label><Input type="number" value={newCourseFees} onChange={(e) => setNewCourseFees(e.target.value)} placeholder="15000" /></div>
              <div className="space-y-1"><Label className="text-xs">Mode</Label>
                <Select value={newCourseMode} onValueChange={setNewCourseMode}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addCourse} disabled={isPending || !newCourseTitle}><Plus className="h-3.5 w-3.5 mr-1" />Add Course</Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveCentre} disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
        Save Changes
      </Button>
    </div>
  )
}
