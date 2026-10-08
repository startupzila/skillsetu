'use client'

import { useState, useTransition } from 'react'
import { Plus, Power, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Affiliate {
  id: string; provider: string; product_name: string; destination_url: string;
  tracking_url: string | null; disclosure: string | null; is_active: boolean
}

export function AffiliatesManager({ initialAffiliates }: { initialAffiliates: Affiliate[] }) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(initialAffiliates)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [provider, setProvider] = useState('')
  const [productName, setProductName] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [disclosure, setDisclosure] = useState('')

  function create() {
    if (!provider || !productName || !destinationUrl) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/affiliates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, product_name: productName, destination_url: destinationUrl, disclosure: disclosure || undefined }),
        })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setAffiliates((prev) => [data.data, ...prev])
        setProvider(''); setProductName(''); setDestinationUrl(''); setDisclosure('')
        toast({ title: 'Affiliate link created' })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function toggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: 'POST' })
      if (res.ok) setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a))
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this affiliate link?')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: 'DELETE' })
      if (res.ok) setAffiliates((prev) => prev.filter((a) => a.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      <Card><CardContent className="pt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Amazon" /></div>
          <div className="space-y-1"><Label className="text-xs">Product name</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Excel Practice Book" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Destination URL</Label><Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://amazon.in/..." /></div>
        <div className="space-y-1"><Label className="text-xs">Disclosure (optional)</Label><Input value={disclosure} onChange={(e) => setDisclosure(e.target.value)} placeholder="We may earn a commission" /></div>
        <Button onClick={create} disabled={isPending || !provider || !productName || !destinationUrl}>
          {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add link
        </Button>
      </CardContent></Card>

      {affiliates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No affiliate links yet.</p>
      ) : (
        <div className="space-y-3">
          {affiliates.map((a) => (
            <div key={a.id} className="rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{a.product_name}</span>
                  <Badge variant="outline" className="text-xs">{a.provider}</Badge>
                  <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">{a.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{a.destination_url}</p>
                {a.disclosure && <p className="text-xs text-muted-foreground mt-1">📋 {a.disclosure}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggle(a.id, a.is_active)} disabled={isPending}>
                  <Power className={cn('h-3.5 w-3.5', a.is_active && 'text-success')} />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(a.id)} disabled={isPending}>
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
