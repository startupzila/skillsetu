'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          If an account exists for <strong>{email}</strong>, a password reset
          link has been sent.
        </CardDescription>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </div>
  )
}
