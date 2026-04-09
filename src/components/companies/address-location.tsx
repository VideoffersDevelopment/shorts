"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from '@/lib/i18n/client'

// Dynamic import of map component (Leaflet requires window)
const LocationMap = dynamic(
  () => import('./location-map').then(mod => mod.LocationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />
  }
)

interface AddressLocationProps {
  street?: string
  postalCode?: string
  city?: string
  latitude?: number
  longitude?: number
  onStreetChange: (value: string) => void
  onPostalCodeChange: (value: string) => void
  onCityChange: (value: string) => void
  onLocationChange: (lat: number, lng: number) => void
  disabled?: boolean
}

// Geocoding with OpenStreetMap Nominatim
async function geocodeAddress(street: string, postalCode: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${street}, ${postalCode} ${city}, Poland`
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VideoShorts/1.0' }
    })
    const data = await response.json()

    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export function AddressLocation({
  street = '',
  postalCode = '',
  city = '',
  latitude,
  longitude,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onLocationChange,
  disabled = false
}: AddressLocationProps) {
  const { t } = useTranslations('companies')
  const [showMap, setShowMap] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  // Initialize with current address if coordinates exist (prevents geocoding on load)
  const lastGeocodedAddressRef = useRef<string>(
    latitude && longitude && city ? `${street}|${postalCode}|${city}` : ''
  )

  // Default center: Poland
  const defaultLat = 52.0
  const defaultLng = 19.0

  const currentLat = latitude ?? defaultLat
  const currentLng = longitude ?? defaultLng

  // Mark as initialized after first render to skip initial geocoding
  useEffect(() => {
    if (!initializedRef.current && latitude && longitude && city) {
      lastGeocodedAddressRef.current = `${street}|${postalCode}|${city}`
    }
    initializedRef.current = true
  }, [latitude, longitude, city, street, postalCode])

  // Trigger geocoding with debounce when address fields change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Only auto-geocode if we have city
    if (!city) {
      return
    }

    // Create address key to check if address actually changed
    const addressKey = `${street}|${postalCode}|${city}`

    // Skip if address hasn't changed since last geocoding
    if (addressKey === lastGeocodedAddressRef.current) {
      return
    }

    debounceRef.current = setTimeout(async () => {
      // Double-check address hasn't been geocoded yet
      if (addressKey === lastGeocodedAddressRef.current) {
        return
      }

      setIsGeocoding(true)
      setGeocodeError(false)

      const result = await geocodeAddress(street, postalCode, city)

      if (result) {
        lastGeocodedAddressRef.current = addressKey
        onLocationChange(result.lat, result.lng)
        setGeocodeError(false)
      } else {
        setGeocodeError(true)
      }

      setIsGeocoding(false)
    }, 1000) // 1 second debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [street, postalCode, city, onLocationChange])

  const handlePositionChange = useCallback((lat: number, lng: number) => {
    onLocationChange(lat, lng)
  }, [onLocationChange])

  return (
    <div className="space-y-4">
      {/* Address fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="street">{t('profile.fields.street')}</Label>
          <Input
            id="street"
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder={t("profile.placeholders.street")}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="postalCode">{t('profile.fields.postalCode')}</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              placeholder={t("profile.placeholders.postalCode")}
              maxLength={6}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="city">{t('profile.fields.city')}</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder={t("profile.placeholders.city")}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Map toggle and geocoding status */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          disabled={disabled}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {showMap ? t('profile.fields.hideMap') : t('profile.fields.showOnMap')}
        </Button>

        {isGeocoding && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('location.geocoding')}
          </div>
        )}

        {geocodeError && !isGeocoding && (
          <p className="text-sm text-destructive">
            {t('location.geocodeError')}
          </p>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="space-y-2">
          <LocationMap
            latitude={currentLat}
            longitude={currentLng}
            onPositionChange={handlePositionChange}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            {t('location.dragMarker')}
          </p>
        </div>
      )}

      {/* Hidden inputs for lat/lng (for form submission reference) */}
      {latitude !== undefined && longitude !== undefined && (
        <div className="text-xs text-muted-foreground">
          {t('profile.fields.latitude')}: {latitude.toFixed(6)}, {t('profile.fields.longitude')}: {longitude.toFixed(6)}
        </div>
      )}
    </div>
  )
}
