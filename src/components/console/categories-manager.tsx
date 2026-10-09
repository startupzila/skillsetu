'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

interface Category {
  id: string
  slug: string
  sort_order: number
  status: string
  translations: Array<{ language_code: string; name: string; description: string | null }>
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  function create() {
    if (!name) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: slugify(slug) || slugify(name), name, description: description || undefined }),
        })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setCategories((prev) => [...prev, data.data])
        setName(''); setSlug(''); setDescription('')
        toast({ title: 'Category created' })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this category? Courses in this category will be unlinked.')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) { setCategories((prev) => prev.filter((c) => c.id !== id)); toast({ title: 'Deleted' }) }
    })
  }

  return (
    <div className="space-y-6">
      <Card><CardContent className="pt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} placeholder="Office Skills" /></div>
          <div className="space-y-1"><Label className="text-xs">Slug *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="office-skills" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Master essential office software..." className="min-h-[60px]" /></div>
        <Button onClick={create} disabled={isPending || !name}>{isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add Category</Button>
      </CardContent></Card>

      {categories.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium">{c.translations?.[0]?.name ?? c.slug}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">/{c.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>}
    </div>
  )
}
