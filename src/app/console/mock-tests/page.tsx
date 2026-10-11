import type { Metadata } from 'next'
import { adminListMockTests } from '@/lib/admin/mock-test-service'
import { MockTestManager } from '@/components/console/mock-test-manager'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Mock Tests — Console',
  robots: { index: false, follow: false },
}

/**
 * /console/mock-tests — manage course-level mock tests.
 *
 * Mock tests are timed exam-style assessments linked to a course (not a
 * specific lesson). They surface on the public /mock-tests index page and
 * run via the MockTestRunner exam UI.
 */
export default async function ConsoleMockTestsPage() {
  const { data: tests, error } = await adminListMockTests()

  return (
    <div className="p-6 space-y-6">
      {error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in.'
              : error.includes('FORBIDDEN') || error.includes('Insufficient')
                ? 'You do not have permission.'
                : `Error: ${error}`}
          </CardContent>
        </Card>
      ) : (
        <MockTestManager initialTests={(tests ?? []) as never} />
      )}
    </div>
  )
}
