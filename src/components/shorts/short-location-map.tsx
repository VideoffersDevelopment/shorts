"use client"

import { useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

interface ShortLocationMapProps {
  latitude: number
  longitude: number
  address?: string
  openInMapsLabel?: string
}

/**
 * Location map component for public short view
 *
 * Features:
 * - Static map image (uses OpenStreetMap tiles)
 * - Click to open in Google Maps
 * - Address display
 */
export function ShortLocationMap({
  latitude,
  longitude,
  address,
  openInMapsLabel = "Open in Google Maps"
}: ShortLocationMapProps) {
  // Static map URL using OpenStreetMap
  const zoom = 15
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`

  const handleOpenMaps = useCallback(() => {
    // Open in Google Maps
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer")
  }, [latitude, longitude])

  return (
    <Card className="location-map overflow-hidden">
      <CardContent className="p-0">
        {/* Static map iframe */}
        <div className="relative aspect-video w-full overflow-hidden">
          <iframe
            title="Location Map"
            src={mapUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allowFullScreen={false}
          />
        </div>

        {/* Address and navigation */}
        <div className="p-4 space-y-3">
          {address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span>{address}</span>
            </div>
          )}

          <Button
            onClick={handleOpenMaps}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Navigation className="mr-2 h-4 w-4" />
            {openInMapsLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
