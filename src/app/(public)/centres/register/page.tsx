import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { CentreRegistrationForm } from '@/components/shared/centre-registration-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Register Training Centre',
  description: 'List your skills and training institute on MioDemy.',
}

export default function RegisterCentrePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/centres"><ArrowLeft className="h-4 w-4 mr-1" />Back to Centres</Link>
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">Register Your Training Centre</h1>
      <p className="text-muted-foreground mt-2 mb-6">
        List your institute on MioDemy and reach thousands of learners. Get verified and manage your own page.
      </p>
      <CentreRegistrationForm />
    </div>
  )
}
