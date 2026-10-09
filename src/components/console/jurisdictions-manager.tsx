'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Jurisdiction {
  id: string
  name: string
  type: string
  parent_id: string | null
  sort_order: number
}

const TYPE_LABELS: Record<string, string> = {
  country: 'Country', state: 'State', district: 'District', city: 'City/Tehsil'
}

const PAGE_SIZE = 20

export function JurisdictionsManager({ initialJurisdictions }: { initialJurisdictions: Jurisdiction[] }) {
  const [jurisdictions] = useState(initialJurisdictions)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('state')
  const [parentId, setParentId] = useState('')

  // Filter state
  const [filterType, setFilterType] = useState('all')
  const [filterParent, setFilterParent] = useState('all')
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Build parent options based on selected type
  const parentOptions = jurisdictions.filter(j => {
    if (type === 'state') return j.type === 'country'
    if (type === 'district') return j.type === 'state'
    if (type === 'city') return j.type === 'district'
    return false
  })

  // Get parent name helper
  function getParentName(id: string | null): string {
    if (!id) return '—'
    const p = jurisdictions.find(j => j.id === id)
    return p ? p.name : '—'
  }

  // Build full path (e.g., "India > Maharashtra > Mumbai")
  function getFullPath(j: Jurisdiction): string {
    const parts: string[] = [j.name]
    let current = j
    while (current.parent_id) {
      const parent = jurisdictions.find(p => p.id === current.parent_id)
      if (!parent) break
      parts.unshift(parent.name)
      current = parent
    }
    return parts.join(' > ')
  }

  // Filtered + sorted list
  const filtered = jurisdictions.filter(j => {
    if (filterType !== 'all' && j.type !== filterType) return false
    if (filterParent !== 'all' && j.parent_id !== filterParent) return false
    if (search) {
      const s = search.toLowerCase()
      if (!j.name.toLowerCase().includes(s) && !getFullPath(j).toLowerCase().includes(s)) return false
    }
    return true
  }).sort((a, b) => {
    // Sort by hierarchy: country first, then state, district, city
    const typeOrder: Record<string, number> = { country: 0, state: 1, district: 2, city: 3 }
    const typeDiff = (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)
    if (typeDiff !== 0) return typeDiff
    return a.name.localeCompare(b.name)
  })

  const display = filtered.slice(0, visible)

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
        setName(''); setParentId('')
        toast({ title: 'Added', description: `${name} added as ${TYPE_LABELS[type]}. Refresh to see it.` })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All child items will also be deleted.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/jurisdictions?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted', description: 'Refresh to see changes.' }) }
    })
  }

  // Filter parent dropdown options
  const filterParentOptions = jurisdictions.filter(j => {
    if (filterType === 'all') return j.type !== 'city'
    if (filterType === 'state') return j.type === 'country'
    if (filterType === 'district') return j.type === 'state'
    if (filterType === 'city') return j.type === 'district'
    return false
  })

  return (
    <div className="space-y-6">
      {/* Add form */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Madhya Pradesh" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type *</Label>
              <Select value={type} onValueChange={(v) => { setType(v); setParentId('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="city">City / Tehsil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parent {parentOptions.length === 0 && '(none available)'}</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={parentOptions.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select parent..." /></SelectTrigger>
                <SelectContent>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{TYPE_LABELS[p.type]}: {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={create} disabled={isPending || !name} className="mt-3">
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add Jurisdiction
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search jurisdictions..." value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE) }} />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setFilterParent('all'); setVisible(PAGE_SIZE) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="country">Countries</SelectItem>
            <SelectItem value="state">States</SelectItem>
            <SelectItem value="district">Districts</SelectItem>
            <SelectItem value="city">Cities</SelectItem>
          </SelectContent>
        </Select>
        {filterParentOptions.length > 0 && (
          <Select value={filterParent} onValueChange={(v) => { setFilterParent(v); setVisible(PAGE_SIZE) }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All parents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {filterParentOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

      {/* Hierarchical list */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Full Path</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {display.map((j) => (
              <tr key={j.id} className="hover:bg-accent/30">
                <td className="px-4 py-2.5 font-medium">
                  {j.type !== 'country' && <ChevronRight className="h-3 w-3 inline mr-1 text-muted-foreground" />}
                  {j.name}
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{TYPE_LABELS[j.type] || j.type}</span>
                </td>
                <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">
                  {getFullPath(j)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(j.id, j.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {visible < filtered.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            Load More ({filtered.length - visible} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
