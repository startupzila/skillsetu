'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, MapPin, Search, Loader2, Globe, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type Lang } from '@/lib/i18n/dictionary'

interface Jurisdiction {
  id: string
  name: string
  type: string
}

interface JurisdictionDirectoryBrowserProps {
  lang?: Lang
  initialStates: Jurisdiction[]
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

/**
 * JurisdictionDirectoryBrowser — accordion-style directory of jurisdiction
 * location pages (State → District → City).
 *
 * - Default: shows states (collapsed)
 * - Click a state → expands to show districts (AJAX loaded)
 * - Click a district → expands to show cities (AJAX loaded)
 * - Each level has a "View" link to the dedicated SEO page:
 *   /centres/locations/[state]
 *   /centres/locations/[state]/[district]
 *   /centres/locations/[state]/[district]/[city]
 * - Search filter at top: filters jurisdictions by name (AJAX-style live filter)
 * - Also has State/District/City dropdown filter for quick navigation
 */
export function JurisdictionDirectoryBrowser({
  lang = 'en',
  initialStates,
}: JurisdictionDirectoryBrowserProps) {
  const hi = lang === 'hi'

  const [states] = useState<Jurisdiction[]>(initialStates)
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set())
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set())
  const [districtsCache, setDistrictsCache] = useState<Record<string, Jurisdiction[]>>({})
  const [citiesCache, setCitiesCache] = useState<Record<string, Jurisdiction[]>>({})
  const [loadingDistricts, setLoadingDistricts] = useState<Set<string>>(new Set())
  const [loadingCities, setLoadingCities] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Filter for quick nav
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [districts, setDistricts] = useState<Jurisdiction[]>([])
  const [cities, setCities] = useState<Jurisdiction[]>([])

  // Fetch districts when state changes (dropdown filter)
  useEffect(() => {
    if (!selectedState) {
      setDistricts([])
      setSelectedDistrict('')
      setCities([])
      return
    }
    fetch(`/api/jurisdictions/districts?stateId=${selectedState}`)
      .then((r) => r.json())
      .then((data) => setDistricts(data.data ?? []))
      .catch(() => setDistricts([]))
    setSelectedDistrict('')
    setCities([])
  }, [selectedState])

  useEffect(() => {
    if (!selectedDistrict) {
      setCities([])
      return
    }
    fetch(`/api/jurisdictions/cities?districtId=${selectedDistrict}`)
      .then((r) => r.json())
      .then((data) => setCities(data.data ?? []))
      .catch(() => setCities([]))
  }, [selectedDistrict])

  // Accordion: toggle state expansion + load districts
  async function toggleState(stateId: string) {
    setExpandedStates((prev) => {
      const next = new Set(prev)
      if (next.has(stateId)) {
        next.delete(stateId)
      } else {
        next.add(stateId)
        // Load districts if not cached
        if (!districtsCache[stateId]) {
          setLoadingDistricts((prev) => new Set(prev).add(stateId))
          fetch(`/api/jurisdictions/districts?stateId=${stateId}`)
            .then((r) => r.json())
            .then((data) => {
              setDistrictsCache((prev) => ({ ...prev, [stateId]: data.data ?? [] }))
            })
            .catch(() => {
              setDistrictsCache((prev) => ({ ...prev, [stateId]: [] }))
            })
            .finally(() => {
              setLoadingDistricts((prev) => {
                const next = new Set(prev)
                next.delete(stateId)
                return next
              })
            })
        }
      }
      return next
    })
  }

  // Accordion: toggle district expansion + load cities
  async function toggleDistrict(stateId: string, districtId: string) {
    setExpandedDistricts((prev) => {
      const next = new Set(prev)
      if (next.has(districtId)) {
        next.delete(districtId)
      } else {
        next.add(districtId)
        if (!citiesCache[districtId]) {
          setLoadingCities((prev) => new Set(prev).add(districtId))
          fetch(`/api/jurisdictions/cities?districtId=${districtId}`)
            .then((r) => r.json())
            .then((data) => {
              setCitiesCache((prev) => ({ ...prev, [districtId]: data.data ?? [] }))
            })
            .catch(() => {
              setCitiesCache((prev) => ({ ...prev, [districtId]: [] }))
            })
            .finally(() => {
              setLoadingCities((prev) => {
                const next = new Set(prev)
                next.delete(districtId)
                return next
              })
            })
        }
      }
      return next
    })
  }

  // Filter states by search query
  const filteredStates = states.filter((s) =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // Also match if any district/city matches (lazy — only checks cached data)
    Object.values(districtsCache).flat().some((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    Object.values(citiesCache).flat().some((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    // Match state name against search
    searchQuery.toLowerCase().includes(s.name.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Search + quick filter */}
      <Card>
        <CardContent className="py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={hi ? 'राज्य, ज़िला या शहर खोजें…' : 'Search state, district or city…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick nav dropdown filter */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'राज्य' : 'State'}
              </label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={hi ? 'राज्य चुनें' : 'Select state'} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'ज़िला' : 'District'}
              </label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedState}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={hi ? 'ज़िला चुनें' : 'Select district'} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'शहर' : 'City'}
              </label>
              <Select disabled={!selectedDistrict}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={hi ? 'शहर चुनें' : 'Select city'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick links from dropdown selection */}
          {selectedState && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/centres/locations/${slugify(states.find(s => s.id === selectedState)?.name ?? '')}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:border-primary/30 hover:bg-accent transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {hi ? 'राज्य पेज देखें' : 'View State Page'}
                <ChevronRight className="h-3 w-3" />
              </Link>
              {selectedDistrict && (
                <Link
                  href={`/centres/locations/${slugify(states.find(s => s.id === selectedState)?.name ?? '')}/${slugify(districts.find(d => d.id === selectedDistrict)?.name ?? '')}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:border-primary/30 hover:bg-accent transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {hi ? 'ज़िला पेज देखें' : 'View District Page'}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion directory */}
      <div className="space-y-2">
        {filteredStates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {hi ? 'कोई परिणाम नहीं मिला।' : 'No results found.'}
            </CardContent>
          </Card>
        ) : (
          filteredStates.map((state) => {
            const stateSlug = slugify(state.name)
            const isExpanded = expandedStates.has(state.id)
            const stateDistricts = districtsCache[state.id] ?? []
            const isLoadingDists = loadingDistricts.has(state.id)

            return (
              <Card key={state.id} className="overflow-hidden">
                {/* State header */}
                <button
                  type="button"
                  onClick={() => toggleState(state.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm">{state.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {stateDistricts.length > 0 ? `${stateDistricts.length} ${hi ? 'ज़िले' : 'districts'}` : (hi ? 'राज्य' : 'state')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/centres/locations/${stateSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary hover:underline"
                    >
                      {hi ? 'देखें' : 'View'}
                    </Link>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Districts (expanded) */}
                {isExpanded && (
                  <div className="border-t bg-muted/30">
                    {isLoadingDists ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : stateDistricts.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        {hi ? 'कोई ज़िला नहीं मिला।' : 'No districts found.'}
                      </p>
                    ) : (
                      <div className="divide-y">
                        {stateDistricts.map((district) => {
                          const districtSlug = slugify(district.name)
                          const isDistExpanded = expandedDistricts.has(district.id)
                          const districtCities = citiesCache[district.id] ?? []
                          const isLoadingCities = loadingCities.has(district.id)

                          return (
                            <div key={district.id}>
                              {/* District header */}
                              <button
                                type="button"
                                onClick={() => toggleDistrict(state.id, district.id)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2 pl-4">
                                  <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isDistExpanded && 'rotate-90')} />
                                  <span className="text-sm font-medium">{district.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/centres/locations/${stateSlug}/${districtSlug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {hi ? 'देखें' : 'View'}
                                  </Link>
                                  {isDistExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : null}
                                </div>
                              </button>

                              {/* Cities (expanded) */}
                              {isDistExpanded && (
                                <div className="bg-background/50">
                                  {isLoadingCities ? (
                                    <div className="flex justify-center py-3">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : districtCities.length === 0 ? (
                                    <p className="px-8 py-2 text-xs text-muted-foreground">
                                      {hi ? 'कोई शहर नहीं मिला।' : 'No cities found.'}
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2 px-8 py-3">
                                      {districtCities.map((city) => {
                                        const citySlug = slugify(city.name)
                                        return (
                                          <Link
                                            key={city.id}
                                            href={`/centres/locations/${stateSlug}/${districtSlug}/${citySlug}`}
                                            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:border-primary/30 hover:bg-accent transition-colors"
                                          >
                                            <MapPin className="h-3 w-3 text-primary" />
                                            {city.name}
                                            <span className="text-primary font-medium">{hi ? 'देखें' : 'View'}</span>
                                          </Link>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
