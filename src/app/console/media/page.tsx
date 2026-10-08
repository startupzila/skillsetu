import type { Metadata } from 'next'
import { adminListMedia, getMediaUrl } from '@/lib/admin/media-service'
import { MediaLibrary } from '@/components/console/media-library'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Media Library — Console' }

/**
 * /console/media — media library.
 *
 * Server component fetches media assets, renders the client-side
 * MediaLibrary (upload + grid + edit + delete).
 */
export default async function MediaPage() {
  const { data: media, error } = await adminListMedia({ limit: 100 })

  // Build public URLs for images
  const mediaWithUrls = (media ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    url: m.file_type === 'image'
      ? getMediaUrl(m.bucket as string, m.storage_path as string)
      : null,
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload and manage images, PDFs and other assets.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in.'
              : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      <MediaLibrary initialMedia={mediaWithUrls as Array<Record<string, unknown>>} />
    </div>
  )
}
