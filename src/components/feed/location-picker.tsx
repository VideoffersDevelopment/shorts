"use client"

import { useTranslations } from '@/lib/i18n/client'
import { Navigation, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadiusSelector } from './radius-selector'
import { useGeolocation } from '@/hooks/use-geolocation'

interface LocationPickerProps {
  lat?: number
  lng?: number
  radius?: number
  onChange: (lat: number | undefined, lng: number | undefined, radius: number | undefined) => void
}

export function LocationPicker({ lat, lng, radius, onChange }: LocationPickerProps) {
  const { t } = useTranslations('feed')
  const { loading, error, permissionDenied, detect, clear } = useGeolocation()

  const handleDetect = async () => {
    const result = await detect()
    if (result) {
      onChange(result.lat, result.lng, radius ?? 25)
    }
  }

  const handleClear = () => {
    clear()
    onChange(undefined, undefined, undefined)
  }

  const hasLocation = lat !== undefined && lng !== undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={hasLocation ? 'secondary' : 'outline'}
          size="sm"
          onClick={hasLocation ? handleClear : handleDetect}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('filters.location.detecting')}
            </>
          ) : hasLocation ? (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              {t('filters.location.nearMe')} ({radius ?? 25} km)
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              {t('filters.location.detectLocation')}
            </>
          )}
        </Button>

        <RadiusSelector
          value={radius}
          onChange={(r) => onChange(lat, lng, r)}
          disabled={!hasLocation}
        />
      </div>

      {error && !permissionDenied && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {permissionDenied && (
        <p className="text-xs text-muted-foreground">
          {t('filters.location.permissionDenied')}
        </p>
      )}
    </div>
  )
}
