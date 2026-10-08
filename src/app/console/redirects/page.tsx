import type { Metadata } from 'next'
import { adminListRedirects } from '@/lib/seo/seo-service'
import { RedirectsManager } from '@/components/console/redirects-manager'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Redirects — Console' }

export default async function RedirectsPage() {
  const { data: redirects, error } = await adminListRedirects()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redirects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage 301/302 URL redirects. Active redirects are checked by middleware on every request.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in.'
              : error.includes('FORBIDDEN') || error.includes('Insufficient')
                ? 'You do not have permission.'
                : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      <RedirectsManager initialRedirects={redirects ?? []} />
    </div>
  )
}
