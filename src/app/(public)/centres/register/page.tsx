'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export default function RegisterCentrePage() {
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
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/centres/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, slug: slugify(slug) || slugify(name), about: about || undefined,
            email, phone, website: website || undefined,
            address_line1: addressLine1, city, state, pincode: pincode || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            toast({ title: 'Sign in required', description: 'Please sign in to register your centre.', variant: 'destructive' })
            router.push('/login?redirect=/centres/register')
            return
          }
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setSuccess(true)
        toast({ title: 'Registration submitted!', description: 'We will verify your centre soon.' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold">Registration Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for registering your training centre. Our team will verify your details and your centre page will go live soon.
            </p>
            <Button asChild variant="outline">
              <Link href="/centres">Back to Directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/centres"><ArrowLeft className="h-4 w-4 mr-1" />Back to Centres</Link>
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">Register Your Training Centre</h1>
      <p className="text-muted-foreground mt-2 mb-6">
        List your institute on MioDemy and reach thousands of learners. Get verified and manage your own page.
      </p>

      <Card>
        <CardHeader><CardTitle className="text-base">Centre Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Centre Name *</Label>
              <Input id="name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} required placeholder="Excel Mastery Academy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="excel-mastery-academy" />
              <p className="text-xs text-muted-foreground">URL: /centres/{slug || 'your-slug'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="about">About (optional)</Label>
              <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell learners about your institute..." className="min-h-[80px]" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="info@institute.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://institute.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address *</Label>
              <Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required placeholder="Shop 12, Education Hub" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required placeholder="Maharashtra" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400050" />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Submit Registration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
