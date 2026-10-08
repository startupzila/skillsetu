'use client'

import { useState, useTransition, useRef } from 'react'
import {
  Upload,
  Trash2,
  Pencil,
  X,
  Loader2,
  ImageIcon,
  FileText,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  storage_path: string
  bucket: string
  file_name: string
  file_type: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  created_at: string
  url: string | null
}

interface MediaLibraryProps {
  initialMedia: MediaItem[]
}

/**
 * MediaLibrary — upload, browse, edit, delete media assets.
 *
 * Client component: uses /api/admin/media/* for all operations.
 */
export function MediaLibrary({ initialMedia }: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
          continue
        }
        // Add to list with URL
        const newMedia: MediaItem = {
          ...data.data,
          url: data.data.file_type === 'image'
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.data.bucket}/${data.data.storage_path}`
            : null,
        }
        setMedia((prev) => [newMedia, ...prev])
        toast({ title: 'Uploaded', description: file.name })
      } catch {
        toast({ title: 'Error', description: 'Upload failed.', variant: 'destructive' })
      }
    }
    setUploading(false)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function deleteMedia(id: string) {
    if (!confirm('Delete this media? This cannot be undone.')) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setMedia((prev) => prev.filter((m) => m.id !== id))
        toast({ title: 'Deleted' })
      } catch {
        toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' })
      }
    })
  }

  function saveEdit(id: string, updates: Record<string, string>) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/media/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setMedia((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        )
        setEditing(null)
        toast({ title: 'Updated' })
      } catch {
        toast({ title: 'Error', description: 'Update failed.', variant: 'destructive' })
      }
    })
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
          multiple
          onChange={handleUpload}
          className="hidden"
          id="media-upload"
        />
        <Button asChild variant="outline">
          <label htmlFor="media-upload" className="cursor-pointer">
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Upload files
          </label>
        </Button>
        <p className="text-xs text-muted-foreground">
          Images (JPG, PNG, WebP, GIF, SVG) and PDF. Max 10MB.
        </p>
      </div>

      {/* Grid */}
      {media.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No media yet. Upload files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="group rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview */}
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.alt_text ?? item.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-1">
                <p className="text-xs font-medium truncate" title={item.file_name}>
                  {item.file_name}
                </p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {item.file_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatSize(item.size_bytes)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t">
                <button
                  onClick={() => setEditing(item)}
                  className="flex-1 py-1.5 text-xs hover:bg-accent flex items-center justify-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => deleteMedia(item.id)}
                  className="flex-1 py-1.5 text-xs hover:bg-destructive/10 text-destructive flex items-center justify-center gap-1 border-l"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <EditMediaDialog
          media={editing}
          onSave={(updates) => saveEdit(editing.id, updates)}
          onClose={() => setEditing(null)}
          isPending={isPending}
        />
      )}
    </div>
  )
}

// ── Edit dialog ─────────────────────────────────────────────
function EditMediaDialog({
  media,
  onSave,
  onClose,
  isPending,
}: {
  media: MediaItem
  onSave: (updates: Record<string, string>) => void
  onClose: () => void
  isPending: boolean
}) {
  const [altText, setAltText] = useState(media.alt_text ?? '')
  const [caption, setCaption] = useState(media.caption ?? '')

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit media</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Preview */}
          {media.url && (
            <div className="rounded-lg border overflow-hidden max-h-48">
              <img
                src={media.url}
                alt={altText}
                className="w-full object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alt_text">Alt text</Label>
            <Input
              id="alt_text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
            <p className="text-xs text-muted-foreground">
              Required for images — used by screen readers and SEO.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption shown below the image"
              className="min-h-[60px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onSave({ alt_text: altText, caption })}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Save
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
