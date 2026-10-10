'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

/**
 * SearchBox — navigates to the localized /search?q=<query> page.
 *
 * If the current URL is under /hi/*, the search page is also under /hi/*.
 * English (default) goes to /search.
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    // Preserve locale prefix in the search URL
    const base = pathname.startsWith('/hi') ? '/hi/search' : '/search'
    startTransition(() => {
      router.push(`${base}?q=${encodeURIComponent(query.trim())}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className ?? ''}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search courses, skills, centres…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 w-full sm:w-56 md:w-64"
        aria-label="Search"
      />
      {isPending && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          …
        </span>
      )}
    </form>
  )
}
