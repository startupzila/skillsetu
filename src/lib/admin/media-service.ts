import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/auth'
import { recordAudit } from '@/lib/auth/audit'

/**
 * Admin media service — upload, list, update, delete media assets.
 *
 * Uses Supabase Storage for file storage + the media_assets table for metadata.
 * The `media` bucket is public (images); `downloads` is private (paid resources).
 *
 * @see prisma/schema.prisma (MediaAsset model)
 */

export interface MediaAssetInput {
  storage_path: string
  bucket?: string
  file_name: string
  file_type: string // image, pdf, document
  mime_type: string
  size_bytes: number
  width?: number | null
  height?: number | null
  alt_text?: string | null
  caption?: string | null
  source?: string | null
  license?: string | null
}

/** List all media assets (paginated). */
export async function adminListMedia(opts?: {
  fileType?: string
  limit?: number
  offset?: number
}) {
  await requireUser()
  const admin = createAdminClient()

  let query = admin
    .from('media_assets')
    .select(
      'id, storage_path, bucket, file_name, file_type, mime_type, size_bytes, width, height, alt_text, caption, created_at',
    )
    .order('created_at', { ascending: false })

  if (opts?.fileType) query = query.eq('file_type', opts.fileType)
  if (opts?.limit) query = query.limit(opts.limit)
  if (opts?.offset) query = query.range(opts.offset, (opts.offset + (opts.limit ?? 50)) - 1)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get a single media asset. */
export async function adminGetMedia(mediaId: string) {
  await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('media_assets')
    .select('*')
    .eq('id', mediaId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a media asset record (after upload to Storage). */
export async function adminCreateMedia(input: MediaAssetInput) {
  const session = await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('media_assets')
    .insert({
      storage_path: input.storage_path,
      bucket: input.bucket ?? 'media',
      file_name: input.file_name,
      file_type: input.file_type,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      width: input.width ?? null,
      height: input.height ?? null,
      alt_text: input.alt_text ?? null,
      caption: input.caption ?? null,
      source: input.source ?? null,
      license: input.license ?? null,
      uploaded_by_id: session.user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  await recordAudit({ action: 'media.upload', entityType: 'media', entityId: data.id })
  return { data, error: null }
}

/** Update media metadata (alt text, caption, source, license). */
export async function adminUpdateMedia(
  mediaId: string,
  updates: {
    alt_text?: string | null
    caption?: string | null
    source?: string | null
    license?: string | null
  },
) {
  await requireUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('media_assets')
    .update(updates)
    .eq('id', mediaId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Delete a media asset (record + file from Storage). */
export async function adminDeleteMedia(mediaId: string) {
  await requireUser()
  const admin = createAdminClient()

  // Get the asset to find its storage path
  const { data: asset } = await admin
    .from('media_assets')
    .select('storage_path, bucket')
    .eq('id', mediaId)
    .single()

  if (asset) {
    // Delete from Storage
    const { error: storageErr } = await admin.storage
      .from(asset.bucket ?? 'media')
      .remove([asset.storage_path])

    if (storageErr) {
      // Log but continue — the DB record is the source of truth
      console.error('[media] storage delete failed:', storageErr.message)
    }
  }

  // Delete the DB record
  const { error } = await admin.from('media_assets').delete().eq('id', mediaId)
  if (error) return { error: error.message }

  await recordAudit({ action: 'media.delete', entityType: 'media', entityId: mediaId })
  return { error: null }
}

/** Generate a public URL for a media asset (for the `media` public bucket). */
export function getMediaUrl(bucket: string, storagePath: string): string {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${projectUrl}/storage/v1/object/public/${bucket}/${storagePath}`
}

/** Upload a file to Supabase Storage and create a media_asset record. */
export async function adminUploadMedia(
  file: File,
  opts?: {
    alt_text?: string
    caption?: string
    bucket?: string
  },
) {
  const session = await requireUser()
  const admin = createAdminClient()

  const bucket = opts?.bucket ?? 'media'
  const ext = file.name.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const storagePath = `${timestamp}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  // Upload to Storage
  const { data: uploadData, error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadErr) return { data: null, error: uploadErr.message }

  // Determine file type
  const fileType = file.type.startsWith('image/')
    ? 'image'
    : file.type === 'application/pdf'
      ? 'pdf'
      : 'document'

  // Create DB record
  const { data: asset, error: dbErr } = await admin
    .from('media_assets')
    .insert({
      storage_path: storagePath,
      bucket,
      file_name: file.name,
      file_type: fileType,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: opts?.alt_text ?? null,
      caption: opts?.caption ?? null,
      uploaded_by_id: session.user.id,
    })
    .select()
    .single()

  if (dbErr) {
    // Clean up the uploaded file if DB insert failed
    await admin.storage.from(bucket).remove([storagePath])
    return { data: null, error: dbErr.message }
  }

  await recordAudit({ action: 'media.upload', entityType: 'media', entityId: asset.id })
  return { data: asset, error: null }
}
