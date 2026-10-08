'use client'

import { useState, useTransition } from 'react'
import { Plus, Power, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Ad {
  id: string; slot: string; name: string; code: string | null; is_active: boolean
}

const SLOTS = ['header', 'content_top', 'content_middle', 'content_bottom', 'sidebar', 'footer']

export function AdsManager({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [slot, setSlot] = useState('header')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  function create() {
    if (!name) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/ads', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot, name, code }),
        })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setAds((prev) => [data.data, ...prev])
        setName(''); setCode('')
        toast({ title: 'Ad slot created' })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function toggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/ads/${id}`, { method: 'POST' })
      if (res.ok) setAds((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a))
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this ad slot?')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' })
      if (res.ok) setAds((prev) => prev.filter((a) => a.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      <Card><CardContent className="pt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Slot position</Label>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SLOTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Google AdSense - Sidebar" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Ad code (HTML/JS)</Label><Textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="<script>…</script>" className="min-h-[60px] font-mono text-xs" /></div>
        <Button onClick={create} disabled={isPending || !name}>{isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add ad slot</Button>
      </CardContent></Card>

      {ads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No ad slots yet.</p>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{ad.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">{ad.slot.replace('_', ' ')}</Badge>
                  <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-xs">{ad.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {ad.code && <pre className="text-xs font-mono text-muted-foreground truncate">{ad.code.slice(0, 80)}{ad.code.length > 80 ? '…' : ''}</pre>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggle(ad.id, ad.is_active)} disabled={isPending}>
                  <Power className={cn('h-3.5 w-3.5', ad.is_active && 'text-success')} />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(ad.id)} disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
