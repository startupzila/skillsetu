import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Auth layout metadata.
 *
 * Auth pages (login, register, password reset) are part of the internal
 * system and must not be indexed. Reinforced by robots.txt + X-Robots-Tag.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Auth layout — wraps all auth pages (login, register, etc.)
 * with a clean centered card on a muted background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight">MioDemy</h1>
          </Link>
          <p className="text-sm text-muted-foreground">
            Learn practical skills in your language
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}
