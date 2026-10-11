'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, Loader2, Building2, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { type Lang } from '@/lib/i18n/dictionary'

interface Jurisdiction {
  id: string
  name: string
  type: string
}

interface CentreLocation {
  centre_id: string
  centre_name: string
  centre_slug: string
  city: string | null
  district: string | null
  state: string | null
  country: string | null
}

interface DirectoryBrowserProps {
  lang?: Lang
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

/**
 * CentresDirectoryBrowser — world-class directory browser with cascading
 * Country → State → District → City filters + search.
 *
 * - Server-side rendering via the page; this client component handles
 *   the interactive filtering (AJAX cascading dropdowns + search).
 * - Mobile responsive: filters stack vertically, results grid collapses.
 */
export function CentresDirectoryBrowser({ lang = 'en', initialStates }: DirectoryBrowserProps & { initialStates?: Jurisdiction[] }) {
  const hi = lang === 'hi'
  const { toast } = useToast()

  const [country] = useState('India') // Default to India (only country in DB)
  const [states] = useState<Jurisdiction[]>(initialStates ?? [])
  const [selectedState, setSelectedState] = useState<string>('')
  const [districts, setDistricts] = useState<Jurisdiction[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [cities, setCities] = useState<Jurisdiction[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [centres, setCentres] = useState<CentreLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Fetch districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([])
      setSelectedDistrict('')
      setCities([])
      setSelectedCity('')
      return
    }
    setLoadingDistricts(true)
    fetch(`/api/jurisdictions/districts?stateId=${selectedState}`)
      .then((r) => r.json())
      .then((data) => setDistricts(data.data ?? []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false))
    setSelectedDistrict('')
    setCities([])
    setSelectedCity('')
  }, [selectedState])

  // Fetch cities when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setCities([])
      setSelectedCity('')
      return
    }
    setLoadingCities(true)
    fetch(`/api/jurisdictions/cities?districtId=${selectedDistrict}`)
      .then((r) => r.json())
      .then((data) => setCities(data.data ?? []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
    setSelectedCity('')
  }, [selectedDistrict])

  // Fetch centres when any filter or search changes (debounced)
  const fetchCentres = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedState) {
        const stateName = states.find((s) => s.id === selectedState)?.name
        if (stateName) params.set('state', stateName)
      }
      if (selectedDistrict) {
        const distName = districts.find((d) => d.id === selectedDistrict)?.name
        if (distName) params.set('district', distName)
      }
      if (selectedCity) {
        const cityName = cities.find((c) => c.id === selectedCity)?.name
        if (cityName) params.set('city', cityName)
      }
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch(`/api/centres/search?${params.toString()}`)
      const data = await res.json()
      setCentres(data.data ?? [])
    } catch {
      setCentres([])
    } finally {
      setLoading(false)
    }
  }, [selectedState, selectedDistrict, selectedCity, searchQuery, states, districts, cities])

  useEffect(() => {
    const timer = setTimeout(fetchCentres, 300) // debounce
    return () => clearTimeout(timer)
  }, [fetchCentres])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Country (fixed to India for now) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'देश' : 'Country'}
              </label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {country}
              </div>
            </div>

            {/* State */}
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

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'ज़िला' : 'District'}
              </label>
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                disabled={!selectedState || loadingDistricts}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingDistricts ? '…' : (hi ? 'ज़िला चुनें' : 'Select district')} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {hi ? 'शहर' : 'City'}
              </label>
              <Select
                value={selectedCity}
                onValueChange={setSelectedCity}
                disabled={!selectedDistrict || loadingCities}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingCities ? '…' : (hi ? 'शहर चुनें' : 'Select city')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={hi ? 'केंद्र खोजें…' : 'Search centres by name…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick links to location pages */}
      {!selectedState && !searchQuery && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {hi ? 'राज्य अनुसार ब्राउज़ करें' : 'Browse by State'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {states.map((s) => (
              <Link
                key={s.id}
                href={`/centres/locations/${slugify(s.name)}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:border-primary/30 hover:bg-accent transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {s.name}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {loading ? '…' : `${centres.length} ${hi ? 'केंद्र मिले' : 'centres found'}`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : centres.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {centres.map((c) => (
              <Link key={c.centre_id} href={`/centres/${c.centre_slug}`}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all h-full">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{c.centre_name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {[c.city, c.district, c.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <Badge variant="secondary" className="mt-2 text-[10px]">{hi ? 'सत्यापित' : 'Verified'}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              {hi ? 'इस स्थान के लिए कोई केंद्र नहीं मिला।' : 'No centres found for this location.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
