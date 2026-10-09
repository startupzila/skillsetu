'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Building2, Loader2 } from 'lucide-react'

interface Centre {
  id: string
  slug: string
  name: string
  about: string | null
  established_year: number | null
  locations: Array<{ city: string; state: string; country: string }>
}

interface CentresBrowserProps {
  initialCentres: Centre[]
}

const PAGE_SIZE = 12

export function CentresBrowser({ initialCentres }: CentresBrowserProps) {
  const router = useRouter()
  const [centres] = useState(initialCentres)
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [detecting, setDetecting] = useState(false)

  // Filter
  const filtered = centres.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) ||
      c.about?.toLowerCase().includes(s) ||
      c.locations?.some((l) => l.city?.toLowerCase().includes(s) || l.state?.toLowerCase().includes(s))
  })

  const display = filtered.slice(0, visible)

  function detectLocation() {
    if (!navigator.geolocation) {
      alert('Location detection not supported on your device.')
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // For MVP, just redirect with coords (future: reverse geocode)
        router.push(`/centres?lat=${pos.coords.latitude.toFixed(4)}&lng=${pos.coords.longitude.toFixed(4)}`)
        setDetecting(false)
      },
      () => {
        alert('Could not detect your location. Please allow location access.')
        setDetecting(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-6">
      {/* Search + Location */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search centres by name, city, or state..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE) }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={detectLocation} disabled={detecting}>
          {detecting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <MapPin className="h-4 w-4 mr-1.5" />}
          Use My Location
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} centre{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {display.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((c) => {
            const loc = c.locations?.[0]
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/centres/${c.slug}`} className="font-semibold text-lg hover:text-primary">
                        {c.name}
                      </Link>
                      {c.established_year && <p className="text-xs text-muted-foreground">Since {c.established_year}</p>}
                    </div>
                  </div>
                  {c.about && <p className="text-sm text-muted-foreground line-clamp-2">{c.about}</p>}
                  {loc && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {loc.city}, {loc.state}
                    </p>
                  )}
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/centres/${c.slug}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No centres found. Try a different search.
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
