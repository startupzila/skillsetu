'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Jurisdiction {
  id: string
  name: string
  type: string
  parent_id: string | null
  country_code: string
  sort_order: number
  is_active: boolean
}

const TYPE_LABELS: Record<string, string> = { country: 'Country', state: 'State', district: 'District', city: 'City/Tehsil' }

export function JurisdictionsManager({ initialJurisdictions }: { initialJurisdictions: Jurisdiction[] }) {
  const [jurisdictions] = useState(initialJurisdictions)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState('state')
  const [parentId, setParentId] = useState('')

  function create() {
    if (!name) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/jurisdictions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, parent_id: parentId || null }),
        })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setName('')
        toast({ title: 'Jurisdiction added', description: 'Refresh to see it in the list.' })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this jurisdiction? All children will also be deleted.')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/jurisdictions?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted', description: 'Refresh to see changes.' }) }
    })
  }

  // Build hierarchical display
  const countries = jurisdictions.filter(j => j.type === 'country')
  const states = jurisdictions.filter(j => j.type === 'state')
  const districts = jurisdictions.filter(j => j.type === 'district')
  const cities = jurisdictions.filter(j => j.type === 'city')

  function getParentName(id: string | null): string {
    if (!id) return '—'
    const parent = jurisdictions.find(j => j.id === id)
    return parent?.name ?? '—'
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card><CardContent className="pt-6 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Madhya Pradesh" /></div>
          <div className="space-y-1"><Label className="text-xs">Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="city">City/Tehsil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
              <SelectContent>
                {jurisdictions.filter(j => j.type !== 'city').map((j) => (
                  <SelectItem key={j.id} value={j.id}>{TYPE_LABELS[j.type] || j.type}: {j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={create} disabled={isPending || !name}>{isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add Jurisdiction</Button>
      </CardContent></Card>

      {/* List by hierarchy */}
      <div className="space-y-4">
        {(['country', 'state', 'district', 'city'] as const).map((t) => {
          const items = jurisdictions.filter(j => j.type === t)
          if (items.length === 0) return null
          return (
            <div key={t}>
              <h3 className="text-sm font-semibold mb-2">{TYPE_LABELS[t]}s ({items.length})</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b"><tr>
                    <th className="text-left px-4 py-2 font-semibold">Name</th>
                    <th className="text-left px-4 py-2 font-semibold">Parent</th>
                    <th className="text-right px-4 py-2 font-semibold">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {items.map((j) => (
                      <tr key={j.id} className="hover:bg-accent/30">
                        <td className="px-4 py-2 font-medium">{j.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{getParentName(j.parent_id)}</td>
                        <td className="px-4 py-2 text-right">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(j.id)}><Trash2 className="h-3 w-3" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
