"use client"

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface LocationMapProps {
  latitude: number
  longitude: number
  onPositionChange: (lat: number, lng: number) => void
  disabled?: boolean
}

// Component to handle map events and draggable marker
function DraggableMarker({
  position,
  onPositionChange,
  disabled
}: {
  position: [number, number]
  onPositionChange: (lat: number, lng: number) => void
  disabled?: boolean
}) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker) {
        const { lat, lng } = marker.getLatLng()
        onPositionChange(lat, lng)
      }
    }
  }

  return (
    <Marker
      draggable={!disabled}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  )
}

// Component to update map view when position changes
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMapEvents({})

  useEffect(() => {
    map.setView(position, map.getZoom())
  }, [map, position])

  return null
}

export function LocationMap({
  latitude,
  longitude,
  onPositionChange,
  disabled = false
}: LocationMapProps) {
  const position: [number, number] = [latitude, longitude]

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker
          position={position}
          onPositionChange={onPositionChange}
          disabled={disabled}
        />
        <MapUpdater position={position} />
      </MapContainer>
    </div>
  )
}
