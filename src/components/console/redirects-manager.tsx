'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Redirect {
  id: string
  from_path: string
  to_url: string
  status_code: number
  is_active: boolean
  notes: string | null
  created_at: string
}

interface RedirectsManagerProps {
  initialRedirects: Redirect[]
}

export function RedirectsManager({ initialRedirects }: RedirectsManagerProps) {
  const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [fromPath, setFromPath] = useState('')
  const [toUrl, setToUrl] = useState('')
  const [statusCode, setStatusCode] = useState('301')
  const [notes, setNotes] = useState('')

  function create() {
    if (!fromPath || !toUrl) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/redirects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_path: fromPath,
            to_url: toUrl,
            status_code: parseInt(statusCode, 10),
            notes: notes || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setRedirects((prev) => [data.data, ...prev])
        setFromPath('')
        setToUrl('')
        setNotes('')
        toast({ title: 'Redirect created' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function toggle(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/redirects/${id}?action=toggle`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setRedirects((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: data.data.is_active } : r)),
        )
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function deleteRedirect(id: string) {
    if (!confirm('Delete this redirect?')) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setRedirects((prev) => prev.filter((r) => r.id !== id))
        toast({ title: 'Redirect deleted' })
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
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From path</Label>
              <Input
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                placeholder="/old-page"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To URL</Label>
              <Input
                value={toUrl}
                onChange={(e) => setToUrl(e.target.value)}
                placeholder="/new-page or https://…"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301</SelectItem>
                  <SelectItem value="302">302</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1"
            />
            <Button onClick={create} disabled={isPending || !fromPath || !toUrl}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Redirects list */}
      {redirects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No redirects yet.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">From</th>
                <th className="text-left px-4 py-3 font-semibold">To</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Active</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {redirects.map((r) => (
                <tr key={r.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.from_path}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.to_url}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline">{r.status_code}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.is_active ? 'default' : 'secondary'}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggle(r.id)}
                        disabled={isPending}
                      >
                        <Power className={cn('h-3.5 w-3.5', r.is_active && 'text-success')} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => deleteRedirect(r.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
