import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Unauthorized page (403).
 * Shown when a user lacks permission for a specific action (vs. not signed in).
 */
export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground">403</p>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe
          this is an error, please contact an administrator.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Button asChild variant="default">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
