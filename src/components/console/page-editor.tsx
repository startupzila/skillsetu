'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PageEditorProps {
  pageId: string
}

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [translationId, setTranslationId] = useState('')
  const [status, setStatus] = useState('draft')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`/api/admin/pages/${pageId}`)
        if (res.ok) {
          const data = await res.json()
          const p = data.data
          setTitle(p.translation?.title ?? '')
          setContent(p.translation?.content ?? '')
          setMetaDescription(p.translation?.meta_description ?? '')
          setTranslationId(p.translation?.id ?? '')
          setStatus(p.status ?? 'draft')
          setSlug(p.slug ?? '')
        }
      } catch { /* ignore */ } finally { setLoading(false) }
    }
    fetchPage()
  }, [pageId])

  function save() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/pages/${translationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, meta_description: metaDescription || null }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Saved' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function publish() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/pages/${pageId}?action=publish`, { method: 'PATCH' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setStatus('published')
        toast({ title: 'Published!' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/console/pages"><ArrowLeft className="h-4 w-4 mr-1" />Back to pages</Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Edit Page</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">/{slug}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Page content</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[300px]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Input id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={isPending || !title}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save
            </Button>
            {status !== 'published' && (
              <Button onClick={publish} disabled={isPending}>
                <Send className="h-4 w-4 mr-1.5" />Publish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
