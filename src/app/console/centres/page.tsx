import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListCentres } from '@/lib/features/feature-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Plus } from 'lucide-react'
import { CentreRegistrationForm } from '@/components/shared/centre-registration-form'

export const metadata: Metadata = { title: 'Training Centres — Console' }

export default async function ConsoleCentresPage() {
  const { data: centres, error } = await adminListCentres()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Centres</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify, manage and register training centres.</p>
        </div>
        <Button asChild><Link href="/centres/register"><Plus className="h-4 w-4 mr-1.5" />Register Centre</Link></Button>
      </div>

      {/* Registration form (inline in console) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
          + Quick Register a New Centre (inline form)
        </summary>
        <div className="mt-4">
          <CentreRegistrationForm
            apiEndpoint="/api/centres/register"
            redirectAfter="/console/centres"
          />
        </div>
      </details>

      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent></Card>}

      {centres && centres.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Courses</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {centres.map((c: Record<string, unknown>) => {
                const locs = c.locations as Array<Record<string, unknown>>
                const loc = locs?.[0]
                const courses = c.courses as unknown[]
                return (
                  <tr key={c.id as string} className="hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{c.name as string}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">/{c.slug as string}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {loc && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{loc.city as string}, {loc.state as string}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'verified' ? 'default' : c.status === 'pending' ? 'secondary' : 'destructive'}>
                        {c.status as string}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{courses?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button asChild size="sm" variant="ghost" className="h-7">
                          <Link href={`/console/centres/${c.id}`}>Edit</Link>
                        </Button>
                        {c.status === 'pending' && (
                          <>
                            <form action={`/api/admin/centres/${c.id}?action=verify`} method="post">
                              <Button type="submit" size="sm" variant="default" className="h-7 text-xs">Verify</Button>
                            </form>
                            <form action={`/api/admin/centres/${c.id}?action=reject`} method="post">
                              <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs text-destructive">Reject</Button>
                            </form>
                          </>
                        )}
                        {c.status === 'verified' && (
                          <Link href={`/centres/${c.slug}`} target="_blank" className="text-xs text-primary hover:underline">View</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : !error && <Card><CardContent className="py-12 text-center text-muted-foreground">No centres registered yet.</CardContent></Card>}
    </div>
  )
}
