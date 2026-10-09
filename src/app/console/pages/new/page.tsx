'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function NewPagePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slugify(slug) || slugify(title),
            title,
            content,
            meta_description: metaDescription || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Page created' })
        router.push('/console/pages')
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/console/pages"><ArrowLeft className="h-4 w-4 mr-1" />Back to pages</Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">New Page</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Create a CMS-managed static page.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Page details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} placeholder="About MioDemy" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about" required />
              <p className="text-xs text-muted-foreground">URL: /{slug || 'your-slug'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the page content…" className="min-h-[200px]" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta description (optional)</Label>
              <Input id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Brief description for search engines" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending || !title || !content}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create page
              </Button>
              <Button asChild variant="outline"><Link href="/console/pages">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
