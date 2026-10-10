'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FolderOpen, ArrowRight } from 'lucide-react'

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
}

const PAGE_SIZE = 9

export function SearchableCategoriesGrid({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = categories.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s)
  })

  const display = filtered.slice(0, visible)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search skill categories..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE) }}
          className="pl-9"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground text-center">{filtered.length} categor{filtered.length !== 1 ? 'ies' : 'y'} found</p>

      {/* Grid */}
      {display.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((cat) => (
            <Link key={cat.id} href={`/skills/${cat.slug}`} className="group rounded-xl border p-8 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="inline-flex rounded-lg bg-primary/10 p-3 mb-4">
                <FolderOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">{cat.name}</h2>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{cat.description ?? 'Explore courses in this category.'}</p>
              <span className="text-sm text-primary font-medium mt-4 inline-flex items-center gap-1">
                Explore courses <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No categories found. Try a different search.</p>
        </div>
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
