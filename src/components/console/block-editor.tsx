'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ContentRenderer } from '@/components/learning/content-renderer'

interface Block {
  id: string
  block_type: string
  sort_order: number
  data: Record<string, unknown>
}

interface BlockEditorProps {
  lessonTranslationId: string
}

const BLOCK_TYPES = [
  { value: 'heading', label: 'Heading', icon: 'H' },
  { value: 'paragraph', label: 'Paragraph', icon: '¶' },
  { value: 'callout', label: 'Callout', icon: '!' },
  { value: 'code', label: 'Code', icon: '<>' },
  { value: 'example', label: 'Example', icon: 'E' },
  { value: 'table', label: 'Table', icon: '⊟' },
  { value: 'quote', label: 'Quote', icon: '"' },
  { value: 'checklist', label: 'Checklist', icon: '☑' },
  { value: 'related_content', label: 'Related Content', icon: '→' },
]

const CALLOUT_VARIANTS = ['info', 'tip', 'warning', 'success', 'summary']

/**
 * BlockEditor — visual editor for lesson content blocks.
 *
 * Features:
 *   - List existing blocks with live preview (ContentRenderer)
 *   - Add new blocks (type picker dialog)
 *   - Edit block data (inline forms per type)
 *   - Delete blocks
 *   - Reorder (move up/down)
 *
 * Client component: calls /api/admin/blocks for CRUD.
 */
export function BlockEditor({ lessonTranslationId }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const res = await fetch(
          `/api/admin/blocks?lessonTranslationId=${lessonTranslationId}`,
        )
        if (res.ok) {
          const data = await res.json()
          setBlocks(data.data ?? [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchBlocks()
  }, [lessonTranslationId])

  function addBlock(type: string) {
    const defaultData = getDefaultBlockData(type)
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_translation_id: lessonTranslationId,
            block_type: type,
            data: defaultData,
            sort_order: blocks.length + 1,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setBlocks((prev) => [...prev, data.data])
        setAddOpen(false)
        setEditingId(data.data.id)
        toast({ title: 'Block added' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function deleteBlock(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setBlocks((prev) => prev.filter((b) => b.id !== id))
        toast({ title: 'Block deleted' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function saveBlock(id: string, newData: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blocks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: newData }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setBlocks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, data: newData } : b)),
        )
        setEditingId(null)
        toast({ title: 'Block saved' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[index]]

    // Update sort_order locally
    const reordered = newBlocks.map((b, i) => ({ ...b, sort_order: i + 1 }))
    setBlocks(reordered)

    // Persist new order
    startTransition(async () => {
      try {
        await fetch('/api/admin/blocks?action=reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            reordered.map((b) => ({ id: b.id, sort_order: b.sort_order })),
          ),
        })
      } catch {
        // silent fail for reorder
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No content blocks yet. Click &ldquo;Add Block&rdquo; to start building the lesson.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div key={block.id} className="rounded-lg border overflow-hidden">
              {/* Block toolbar */}
              <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <Badge variant="secondary" className="text-xs font-mono">
                    {block.block_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => moveBlock(idx, 'up')}
                    disabled={idx === 0 || isPending}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => moveBlock(idx, 'down')}
                    disabled={idx === blocks.length - 1 || isPending}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      setEditingId(editingId === block.id ? null : block.id)
                    }
                  >
                    {editingId === block.id ? 'Close' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => deleteBlock(block.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Block content — edit mode or preview */}
              <div className="p-4">
                {editingId === block.id ? (
                  <BlockEditForm
                    block={block}
                    onSave={(data) => saveBlock(block.id, data)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                ) : (
                  <div className="text-sm">
                    <ContentRenderer blocks={[block as Block & { created_at: string; updated_at: string }]} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add block button */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" disabled={isPending}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Block
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a content block</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => addBlock(type.value)}
                disabled={isPending}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:border-primary hover:bg-accent transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted font-mono text-sm font-bold">
                  {type.icon}
                </span>
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Default data per block type ────────────────────────────
function getDefaultBlockData(type: string): Record<string, unknown> {
  switch (type) {
    case 'heading':
      return { level: 2, text: 'New Heading' }
    case 'paragraph':
      return { text: 'Write your paragraph here…' }
    case 'callout':
      return { variant: 'info', title: 'Title', text: 'Callout text' }
    case 'code':
      return { language: 'text', code: '// code here' }
    case 'example':
      return { title: 'Example', text: 'Example description' }
    case 'table':
      return { headers: ['Column 1', 'Column 2'], rows: [['Row 1 Cell 1', 'Row 1 Cell 2']] }
    case 'quote':
      return { text: 'Quote text', author: 'Author' }
    case 'checklist':
      return { items: ['First item', 'Second item'] }
    case 'related_content':
      return { title: 'Related', items: [] }
    default:
      return {}
  }
}

// ── Inline edit form per block type ────────────────────────
function BlockEditForm({
  block,
  onSave,
  onCancel,
  isPending,
}: {
  block: Block
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [data, setData] = useState<Record<string, unknown>>(block.data)

  function update(key: string, value: unknown) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3">
      {block.block_type === 'heading' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select
                value={String(data.level ?? 2)}
                onValueChange={(v) => update('level', parseInt(v, 10))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <SelectItem key={l} value={String(l)}>H{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-3">
              <Label className="text-xs">Text</Label>
              <Input
                value={String(data.text ?? '')}
                onChange={(e) => update('text', e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </>
      )}

      {block.block_type === 'paragraph' && (
        <div className="space-y-1">
          <Label className="text-xs">Text</Label>
          <Textarea
            value={String(data.text ?? '')}
            onChange={(e) => update('text', e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      )}

      {block.block_type === 'callout' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Variant</Label>
              <Select
                value={String(data.variant ?? 'info')}
                onValueChange={(v) => update('variant', v)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALLOUT_VARIANTS.map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={String(data.title ?? '')}
                onChange={(e) => update('title', e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Textarea
              value={String(data.text ?? '')}
              onChange={(e) => update('text', e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </>
      )}

      {block.block_type === 'code' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Language</Label>
            <Input
              value={String(data.language ?? 'text')}
              onChange={(e) => update('language', e.target.value)}
              className="h-8"
              placeholder="javascript, python, excel…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Code</Label>
            <Textarea
              value={String(data.code ?? '')}
              onChange={(e) => update('code', e.target.value)}
              className="min-h-[100px] font-mono text-xs"
            />
          </div>
        </>
      )}

      {block.block_type === 'example' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              value={String(data.title ?? 'Example')}
              onChange={(e) => update('title', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Textarea
              value={String(data.text ?? '')}
              onChange={(e) => update('text', e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </>
      )}

      {block.block_type === 'quote' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Quote</Label>
            <Textarea
              value={String(data.text ?? '')}
              onChange={(e) => update('text', e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Author</Label>
            <Input
              value={String(data.author ?? '')}
              onChange={(e) => update('author', e.target.value)}
              className="h-8"
            />
          </div>
        </>
      )}

      {block.block_type === 'checklist' && (
        <div className="space-y-1">
          <Label className="text-xs">Items (one per line)</Label>
          <Textarea
            value={Array.isArray(data.items) ? (data.items as string[]).join('\n') : ''}
            onChange={(e) =>
              update('items', e.target.value.split('\n').filter(Boolean))
            }
            className="min-h-[80px]"
          />
        </div>
      )}

      {(block.block_type === 'table' || block.block_type === 'related_content') && (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          This block type ({block.block_type}) uses JSON data. Edit via the API for now.
          <pre className="mt-2 text-xs text-left overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={() => onSave(data)} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
