import type { Metadata } from 'next'
import { adminGetCentre } from '@/lib/features/feature-service'
import { CentreEditor } from '@/components/console/centre-editor'

export const metadata: Metadata = { title: 'Edit Centre — Console' }

export default async function CentreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: centre, error } = await adminGetCentre(id)

  if (error || !centre) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Centre not found.</p>
      </div>
    )
  }

  return <CentreEditor centre={centre as Record<string, unknown>} />
}
