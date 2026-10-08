import type { Metadata } from 'next'
import { adminListCustomCode } from '@/lib/content/pages-service'
import { CustomCodeManager } from '@/components/console/custom-code-manager'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Custom Code — Console' }

export default async function CustomCodePage() {
  const { data: codeEntries, error } = await adminListCustomCode()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Code</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage scripts injected into the head, body start, or body end. Use for analytics, verification tags, and approved ad scripts.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication') ? 'Please sign in.' : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      <CustomCodeManager initialEntries={codeEntries ?? []} />
    </div>
  )
}
