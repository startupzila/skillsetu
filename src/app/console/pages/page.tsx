import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListPages } from '@/lib/content/pages-service'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Send } from 'lucide-react'

export const metadata: Metadata = { title: 'Pages — Console' }

export default async function ConsolePagesPage() {
  const { data: pages, error } = await adminListPages()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Static Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage CMS pages — about, privacy, terms, contact, etc.
          </p>
        </div>
        <Button asChild>
          <Link href="/console/pages/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Page
          </Link>
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication') ? 'Please sign in.' : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      {pages && pages.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Footer</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.map((page: Record<string, unknown>) => {
                const trans = page.translations as { title: string; status: string }[]
                const enT = trans?.[0]
                return (
                  <tr key={page.id as string} className="hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{enT?.title ?? page.slug}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={page.status as string} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                      /{page.slug}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {page.show_in_footer ? '✓' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Link href={`/console/pages/${page.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {page.status !== 'published' && (
                          <form action={`/api/admin/pages/${page.id}?action=publish`} method="post">
                            <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No pages yet. Click &ldquo;New Page&rdquo; to create one.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
