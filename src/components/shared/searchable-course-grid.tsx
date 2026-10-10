'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, BookOpen } from 'lucide-react'
import { CourseCard } from '@/components/shared'
import type { CourseWithTranslation } from '@/lib/content'

interface SearchableCourseGridProps {
  courses: CourseWithTranslation[]
  categories: Array<{ id: string; slug: string; name: string }>
}

const PAGE_SIZE = 9

export function SearchableCourseGrid({ courses, categories }: SearchableCourseGridProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = courses.filter((c) => {
    const s = search.toLowerCase()
    const matchSearch = !s || c.translations[0]?.title?.toLowerCase().includes(s) ||
      c.translations[0]?.short_description?.toLowerCase().includes(s) ||
      c.slug.toLowerCase().includes(s)
    return matchSearch
  })

  const display = filtered.slice(0, visible)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by name, topic..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE) }}
          className="pl-9"
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => { setActiveCategory(null); setVisible(PAGE_SIZE) }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.slug); setVisible(PAGE_SIZE) }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat.slug ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-muted-foreground text-center">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Grid */}
      {display.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses found. Try a different search.</p>
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
