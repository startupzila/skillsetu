import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { MailCheck } from 'lucide-react'

/**
 * Verify-email notice page.
 * Shown after registration when email verification is required.
 */
export default function VerifyEmailPage() {
  return (
    <div className="space-y-4 text-center">
      <MailCheck className="mx-auto h-12 w-12 text-muted-foreground" />
      <CardTitle>Verify your email</CardTitle>
      <CardDescription>
        We&apos;ve sent a verification link to your email address.
        Click the link in the email to activate your account.
      </CardDescription>
      <div className="space-y-2 pt-2">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder or try again.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/register">Back to sign up</Link>
        </Button>
      </div>
    </div>
  )
}
