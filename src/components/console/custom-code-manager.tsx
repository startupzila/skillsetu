'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Power, Loader2, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CodeEntry {
  id: string
  name: string
  location: string
  code: string
  page_pattern: string | null
  is_active: boolean
  created_at: string
}

interface CustomCodeManagerProps {
  initialEntries: CodeEntry[]
}

const LOCATIONS = [
  { value: 'head', label: 'Head (before </head>)' },
  { value: 'body_start', label: 'Body Start (after <body>)' },
  { value: 'body_end', label: 'Body End (before </body>)' },
]

export function CustomCodeManager({ initialEntries }: CustomCodeManagerProps) {
  const [entries, setEntries] = useState<CodeEntry[]>(initialEntries)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [location, setLocation] = useState('head')
  const [code, setCode] = useState('')

  function create() {
    if (!name || !code) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/custom-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, location, code, is_active: false }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setEntries((prev) => [data.data, ...prev])
        setName(''); setCode('')
        toast({ title: 'Code entry created' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function toggle(id: string, current: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/custom-code/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !current }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setEntries((prev) => prev.map((e) => e.id === id ? { ...e, is_active: !current } : e))
        toast({ title: !current ? 'Activated' : 'Deactivated' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function deleteEntry(id: string) {
    if (!confirm('Delete this code entry?')) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/custom-code/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setEntries((prev) => prev.filter((e) => e.id !== id))
        toast({ title: 'Deleted' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Google Analytics" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Code (HTML/JS)</Label>
            <Textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder={'<!-- GA snippet -->\n<script>…</script>'} className="min-h-[80px] font-mono text-xs" />
          </div>
          <Button onClick={create} disabled={isPending || !name || !code}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add code entry
          </Button>
        </CardContent>
      </Card>

      {/* Existing entries */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No custom code entries.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border overflow-hidden">
              <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{entry.name}</span>
                  <Badge variant="outline" className="text-xs">{entry.location}</Badge>
                  <Badge variant={entry.is_active ? 'default' : 'secondary'} className="text-xs">
                    {entry.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggle(entry.id, entry.is_active)} disabled={isPending}>
                    <Power className={cn('h-3.5 w-3.5', entry.is_active && 'text-success')} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteEntry(entry.id)} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <pre className="p-3 text-xs font-mono overflow-x-auto bg-muted/20 max-h-32 overflow-y-auto">
                {entry.code}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
