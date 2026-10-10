'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Download, FileText, BookOpen, Search } from 'lucide-react'

const RESOURCE_LABELS: Record<string, string> = {
  pdf: 'PDF', notes: 'Notes', short_notes: 'Short Notes', cheat_sheet: 'Cheat Sheet', workbook: 'Workbook',
}

interface PdfResource {
  id: string
  resource_type: string
  file_url: string
  title: string
  description: string | null
  course_title: string
  course_slug: string
}

const PAGE_SIZE = 12

export function PdfStoreBrowser({ resources }: { resources: PdfResource[] }) {
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = resources.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.title.toLowerCase().includes(s) ||
      r.course_title.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      r.resource_type.toLowerCase().includes(s)
  })

  const display = filtered.slice(0, visible)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search PDFs, notes, cheat sheets..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE) }}
          className="pl-9"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length} resource{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Grid */}
      {display.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base line-clamp-2">{r.title}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{RESOURCE_LABELS[r.resource_type] ?? r.resource_type}</Badge>
                  </div>
                </div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <Link href={`/courses/${r.course_slug}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Learn Tutorial
                  </Link>
                  <Button asChild size="sm">
                    <Link href={`/courses/${r.course_slug}/pdf`}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No PDFs found. Try a different search.
        </CardContent></Card>
      )}

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
