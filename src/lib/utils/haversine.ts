export interface LatLng {
  lat: number
  lng: number
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function haversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Check if point is within radius (km) of center
 */
export function isWithinRadius(
  center: LatLng,
  point: LatLng,
  radiusKm: number
): boolean {
  return haversineDistance(center, point) <= radiusKm
}
