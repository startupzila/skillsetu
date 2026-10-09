'use client'

import { useState, useEffect, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Jurisdiction {
  id: string
  name: string
}

interface JurisdictionSelectorProps {
  onStateChange?: (stateId: string, stateName: string) => void
  onDistrictChange?: (districtId: string, districtName: string) => void
  onCityChange?: (cityId: string, cityName: string) => void
  initialStateId?: string
  initialDistrictId?: string
  initialCityId?: string
}

export function JurisdictionSelector({
  onStateChange, onDistrictChange, onCityChange,
  initialStateId, initialDistrictId, initialCityId,
}: JurisdictionSelectorProps) {
  const [states, setStates] = useState<Jurisdiction[]>([])
  const [districts, setDistricts] = useState<Jurisdiction[]>([])
  const [cities, setCities] = useState<Jurisdiction[]>([])
  const [selectedState, setSelectedState] = useState(initialStateId ?? '')
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrictId ?? '')
  const [selectedCity, setSelectedCity] = useState(initialCityId ?? '')
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const loadStates = useCallback(async () => {
    const res = await fetch('/api/jurisdictions/states')
    if (res.ok) {
      const data = await res.json()
      setStates(data.data ?? [])
    }
    setLoadingStates(false)
  }, [])

  const loadDistricts = useCallback(async (stateId: string) => {
    setLoadingDistricts(true)
    setDistricts([])
    setCities([])
    const res = await fetch(`/api/jurisdictions/districts?stateId=${stateId}`)
    if (res.ok) {
      const data = await res.json()
      setDistricts(data.data ?? [])
    }
    setLoadingDistricts(false)
  }, [])

  const loadCities = useCallback(async (districtId: string) => {
    setLoadingCities(true)
    setCities([])
    const res = await fetch(`/api/jurisdictions/cities?districtId=${districtId}`)
    if (res.ok) {
      const data = await res.json()
      setCities(data.data ?? [])
    }
    setLoadingCities(false)
  }, [])

  useEffect(() => { loadStates() }, [loadStates])

  function handleStateChange(value: string) {
    setSelectedState(value)
    setSelectedDistrict('')
    setSelectedCity('')
    loadDistricts(value)
    const state = states.find((s) => s.id === value)
    onStateChange?.(value, state?.name ?? '')
  }

  function handleDistrictChange(value: string) {
    setSelectedDistrict(value)
    setSelectedCity('')
    loadCities(value)
    const district = districts.find((d) => d.id === value)
    onDistrictChange?.(value, district?.name ?? '')
  }

  function handleCityChange(value: string) {
    setSelectedCity(value)
    const city = cities.find((c) => c.id === value)
    onCityChange?.(value, city?.name ?? '')
  }

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">State *</Label>
        <Select value={selectedState} onValueChange={handleStateChange} disabled={loadingStates}>
          <SelectTrigger><SelectValue placeholder={loadingStates ? 'Loading...' : 'Select state'} /></SelectTrigger>
          <SelectContent>
            {states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">District</Label>
        <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedState || loadingDistricts}>
          <SelectTrigger><SelectValue placeholder={!selectedState ? 'Select state first' : loadingDistricts ? 'Loading...' : 'Select district'} /></SelectTrigger>
          <SelectContent>
            {districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">City / Tehsil</Label>
        <Select value={selectedCity} onValueChange={handleCityChange} disabled={!selectedDistrict || loadingCities}>
          <SelectTrigger><SelectValue placeholder={!selectedDistrict ? 'Select district first' : loadingCities ? 'Loading...' : 'Select city'} /></SelectTrigger>
          <SelectContent>
            {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
