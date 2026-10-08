'use client'

import { useState, useTransition } from 'react'
import { Plus, Power, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  usage_limit: number | null
  used_count: number
  expires_at: string | null
  status: string
}

interface CouponsManagerProps {
  initialCoupons: Coupon[]
}

export function CouponsManager({ initialCoupons }: CouponsManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [usageLimit, setUsageLimit] = useState('')

  function create() {
    if (!code || !discountValue) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code, discount_type: discountType, discount_value: parseInt(discountValue, 10),
            usage_limit: usageLimit ? parseInt(usageLimit, 10) : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setCoupons((prev) => [data.data, ...prev])
        setCode(''); setDiscountValue(''); setUsageLimit('')
        toast({ title: 'Coupon created' })
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  function toggle(id: string, current: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return }
        setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, status: data.data.status } : c))
      } catch { toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' }) }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed (cents)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value ({discountType === 'percentage' ? '%' : 'cents'})</Label>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Usage limit</Label>
              <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="100" />
            </div>
          </div>
          <Button onClick={create} disabled={isPending || !code || !discountValue}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Create coupon
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No coupons yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left px-4 py-3 font-semibold">Code</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Discount</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Usage</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Toggle</th>
            </tr></thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${(c.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggle(c.id, c.status)} disabled={isPending}>
                      <Power className={cn('h-3.5 w-3.5', c.status === 'active' && 'text-success')} />
                    </Button>
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
