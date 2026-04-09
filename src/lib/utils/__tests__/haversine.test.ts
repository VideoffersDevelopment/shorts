import { describe, it, expect } from 'vitest'
import { haversineDistance, isWithinRadius, type LatLng } from '../haversine'

describe('haversine', () => {
  // ===========================================================================
  // HAVERSINE DISTANCE - HAPPY PATH
  // ===========================================================================

  describe('haversineDistance - Happy Path', () => {
    it('calculates correct distance between two known points (Warsaw to Krakow)', () => {
      // Arrange
      const warsaw: LatLng = { lat: 52.2297, lng: 21.0122 }
      const krakow: LatLng = { lat: 50.0647, lng: 19.9450 }

      // Act
      const distance = haversineDistance(warsaw, krakow)

      // Assert - Warsaw to Krakow is approximately 252 km
      expect(distance).toBeGreaterThan(250)
      expect(distance).toBeLessThan(260)
    })

    it('calculates correct distance between New York and Los Angeles', () => {
      // Arrange
      const newYork: LatLng = { lat: 40.7128, lng: -74.0060 }
      const losAngeles: LatLng = { lat: 34.0522, lng: -118.2437 }

      // Act
      const distance = haversineDistance(newYork, losAngeles)

      // Assert - NY to LA is approximately 3940 km
      expect(distance).toBeGreaterThan(3930)
      expect(distance).toBeLessThan(3950)
    })

    it('returns 0 for the same point', () => {
      // Arrange
      const point: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const distance = haversineDistance(point, point)

      // Assert
      expect(distance).toBe(0)
    })

    it('returns same distance regardless of order (symmetry)', () => {
      // Arrange
      const pointA: LatLng = { lat: 52.2297, lng: 21.0122 }
      const pointB: LatLng = { lat: 50.0647, lng: 19.9450 }

      // Act
      const distanceAB = haversineDistance(pointA, pointB)
      const distanceBA = haversineDistance(pointB, pointA)

      // Assert
      expect(distanceAB).toBeCloseTo(distanceBA, 10)
    })
  })

  // ===========================================================================
  // HAVERSINE DISTANCE - EDGE CASES
  // ===========================================================================

  describe('haversineDistance - Edge Cases', () => {
    it('handles points at the North Pole', () => {
      // Arrange
      const northPole: LatLng = { lat: 90, lng: 0 }
      const nearPole: LatLng = { lat: 89, lng: 0 }

      // Act
      const distance = haversineDistance(northPole, nearPole)

      // Assert - 1 degree of latitude is approximately 111 km
      expect(distance).toBeGreaterThan(110)
      expect(distance).toBeLessThan(112)
    })

    it('handles points at the South Pole', () => {
      // Arrange
      const southPole: LatLng = { lat: -90, lng: 0 }
      const nearPole: LatLng = { lat: -89, lng: 0 }

      // Act
      const distance = haversineDistance(southPole, nearPole)

      // Assert - 1 degree of latitude is approximately 111 km
      expect(distance).toBeGreaterThan(110)
      expect(distance).toBeLessThan(112)
    })

    it('handles points crossing the antimeridian (180 degrees longitude)', () => {
      // Arrange
      const eastSide: LatLng = { lat: 0, lng: 179 }
      const westSide: LatLng = { lat: 0, lng: -179 }

      // Act
      const distance = haversineDistance(eastSide, westSide)

      // Assert - Should be approximately 222 km (2 degrees at equator)
      expect(distance).toBeGreaterThan(220)
      expect(distance).toBeLessThan(225)
    })

    it('handles negative coordinates', () => {
      // Arrange - Sydney, Australia
      const sydney: LatLng = { lat: -33.8688, lng: 151.2093 }
      // Melbourne, Australia
      const melbourne: LatLng = { lat: -37.8136, lng: 144.9631 }

      // Act
      const distance = haversineDistance(sydney, melbourne)

      // Assert - Sydney to Melbourne is approximately 714 km
      expect(distance).toBeGreaterThan(710)
      expect(distance).toBeLessThan(720)
    })

    it('works with very small distances (< 1 km)', () => {
      // Arrange - Two points very close together
      const point1: LatLng = { lat: 52.2297, lng: 21.0122 }
      const point2: LatLng = { lat: 52.2300, lng: 21.0125 } // ~50 meters away

      // Act
      const distance = haversineDistance(point1, point2)

      // Assert
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(1) // Less than 1 km
    })

    it('works with very large distances (> 10000 km)', () => {
      // Arrange - Points on opposite sides of Earth
      const london: LatLng = { lat: 51.5074, lng: -0.1278 }
      const auckland: LatLng = { lat: -36.8509, lng: 174.7645 }

      // Act
      const distance = haversineDistance(london, auckland)

      // Assert - London to Auckland is approximately 18,300 km
      expect(distance).toBeGreaterThan(18000)
      expect(distance).toBeLessThan(19000)
    })

    it('handles points at the equator with different longitudes', () => {
      // Arrange
      const point1: LatLng = { lat: 0, lng: 0 }
      const point2: LatLng = { lat: 0, lng: 90 } // 90 degrees apart

      // Act
      const distance = haversineDistance(point1, point2)

      // Assert - 90 degrees at equator is approximately 10,000 km
      expect(distance).toBeGreaterThan(9990)
      expect(distance).toBeLessThan(10020)
    })

    it('handles points on same longitude with different latitudes', () => {
      // Arrange
      const point1: LatLng = { lat: 0, lng: 0 }
      const point2: LatLng = { lat: 45, lng: 0 } // 45 degrees apart

      // Act
      const distance = haversineDistance(point1, point2)

      // Assert - 45 degrees of latitude is approximately 5,000 km
      expect(distance).toBeGreaterThan(4990)
      expect(distance).toBeLessThan(5010)
    })

    it('handles zero coordinates (0, 0)', () => {
      // Arrange
      const origin: LatLng = { lat: 0, lng: 0 }
      const other: LatLng = { lat: 1, lng: 1 }

      // Act
      const distance = haversineDistance(origin, other)

      // Assert - Should compute valid distance
      expect(distance).toBeGreaterThan(150)
      expect(distance).toBeLessThan(160)
    })
  })

  // ===========================================================================
  // IS WITHIN RADIUS - HAPPY PATH
  // ===========================================================================

  describe('isWithinRadius - Happy Path', () => {
    it('returns true when point is inside radius', () => {
      // Arrange
      const center: LatLng = { lat: 52.2297, lng: 21.0122 } // Warsaw
      const nearby: LatLng = { lat: 52.2300, lng: 21.0130 } // ~100m away
      const radiusKm = 1

      // Act
      const result = isWithinRadius(center, nearby, radiusKm)

      // Assert
      expect(result).toBe(true)
    })

    it('returns false when point is outside radius', () => {
      // Arrange
      const center: LatLng = { lat: 52.2297, lng: 21.0122 } // Warsaw
      const distant: LatLng = { lat: 50.0647, lng: 19.9450 } // Krakow (~252km away)
      const radiusKm = 100

      // Act
      const result = isWithinRadius(center, distant, radiusKm)

      // Assert
      expect(result).toBe(false)
    })

    it('returns true when point is exactly on the radius boundary', () => {
      // Arrange
      const center: LatLng = { lat: 52.2297, lng: 21.0122 } // Warsaw
      const krakow: LatLng = { lat: 50.0647, lng: 19.9450 } // ~252km away
      const distance = haversineDistance(center, krakow)

      // Act
      const result = isWithinRadius(center, krakow, distance)

      // Assert - Point exactly on boundary should be within radius
      expect(result).toBe(true)
    })
  })

  // ===========================================================================
  // IS WITHIN RADIUS - EDGE CASES
  // ===========================================================================

  describe('isWithinRadius - Edge Cases', () => {
    it('returns true for same point with zero radius', () => {
      // Arrange
      const point: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const result = isWithinRadius(point, point, 0)

      // Assert
      expect(result).toBe(true)
    })

    it('works with very small radius', () => {
      // Arrange
      const center: LatLng = { lat: 52.2297, lng: 21.0122 }
      const veryClose: LatLng = { lat: 52.22975, lng: 21.01225 } // ~10m away
      const radiusKm = 0.05 // 50 meters

      // Act
      const result = isWithinRadius(center, veryClose, radiusKm)

      // Assert
      expect(result).toBe(true)
    })

    it('works with very large radius', () => {
      // Arrange
      const center: LatLng = { lat: 0, lng: 0 }
      const antipode: LatLng = { lat: 0, lng: 180 }
      const radiusKm = 25000 // More than half Earth's circumference

      // Act
      const result = isWithinRadius(center, antipode, radiusKm)

      // Assert
      expect(result).toBe(true)
    })

    it('handles points in Southern Hemisphere', () => {
      // Arrange - Cape Town, South Africa
      const capeTown: LatLng = { lat: -33.9249, lng: 18.4241 }
      // Johannesburg, South Africa
      const johannesburg: LatLng = { lat: -26.2041, lng: 28.0473 }
      const radiusKm = 1500

      // Act
      const result = isWithinRadius(capeTown, johannesburg, radiusKm)

      // Assert
      expect(result).toBe(true)
    })

    it('handles points crossing Prime Meridian', () => {
      // Arrange
      const london: LatLng = { lat: 51.5074, lng: -0.1278 }
      const paris: LatLng = { lat: 48.8566, lng: 2.3522 }
      const radiusKm = 400

      // Act
      const result = isWithinRadius(london, paris, radiusKm)

      // Assert
      expect(result).toBe(true)
    })
  })

  // ===========================================================================
  // MATHEMATICAL PRECISION
  // ===========================================================================

  describe('Mathematical Precision', () => {
    it('uses correct Earth radius (6371 km)', () => {
      // Arrange - One degree at equator should be approximately 111 km
      const point1: LatLng = { lat: 0, lng: 0 }
      const point2: LatLng = { lat: 0, lng: 1 }

      // Act
      const distance = haversineDistance(point1, point2)

      // Assert - 1 degree at equator = 2*pi*6371/360 = ~111.195 km
      expect(distance).toBeGreaterThan(111)
      expect(distance).toBeLessThan(112)
    })

    it('handles floating point precision correctly', () => {
      // Arrange
      const point1: LatLng = { lat: 52.22970001, lng: 21.01220001 }
      const point2: LatLng = { lat: 52.22970002, lng: 21.01220002 }

      // Act
      const distance = haversineDistance(point1, point2)

      // Assert - Should return a very small but valid number
      expect(distance).toBeGreaterThanOrEqual(0)
      expect(distance).toBeLessThan(0.001) // Less than 1 meter
    })
  })
})
