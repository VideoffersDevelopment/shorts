import { haversineDistance, type LatLng } from './haversine'

export interface ScoreableShort {
  publishedAt: Date
  stats?: {
    views: number
    likes: number
    comments?: number
    ctaClicks: number
  } | null
  latitude?: number | null
  longitude?: number | null
  isBoosted?: boolean
}

export interface ScoringOptions {
  userLocation?: LatLng
  weights?: {
    recency: number
    engagement: number
    geo: number
    personalization: number
  }
}

const DEFAULT_WEIGHTS = {
  recency: 0.20,
  engagement: 0.50,
  geo: 0.10,
  personalization: 0.20,
}

/**
 * Calculate algorithmic score for a short
 */
export function calculateScore(
  short: ScoreableShort,
  options: ScoringOptions = {}
): number {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights }

  // Recency score (exponential decay, 7-day half-life)
  const recencyScore = calculateRecencyScore(short.publishedAt)

  // Engagement score
  const engagementScore = calculateEngagementScore(short.stats)

  // Geo score (if user location available)
  const geoScore = calculateGeoScore(short, options.userLocation)

  // Personalization placeholder (Stage 5)
  const personalizationScore = 0.5

  const baseScore =
    recencyScore * weights.recency +
    engagementScore * weights.engagement +
    geoScore * weights.geo +
    personalizationScore * weights.personalization

  // Boost bonus: +30% for actively boosted shorts (capped at 1.0)
  if (short.isBoosted) {
    return Math.min(baseScore * 1.3, 1.0)
  }

  return baseScore
}

/**
 * Calculate recency score with exponential decay (7-day half-life)
 */
export function calculateRecencyScore(publishedAt: Date): number {
  const now = Date.now()
  const published = new Date(publishedAt).getTime()
  const ageInHours = (now - published) / (1000 * 60 * 60)

  // Exponential decay: 168h = 7 days half-life
  return Math.exp(-ageInHours / 168)
}

/**
 * Calculate engagement score based on weighted interactions
 */
export function calculateEngagementScore(stats: ScoreableShort['stats']): number {
  if (!stats) return 0.1 // Minimal score for new content

  const views = stats.views || 1
  const likes = stats.likes || 0
  const comments = stats.comments || 0
  const ctaClicks = stats.ctaClicks || 0

  // Weighted engagement rate
  const engagementRate = (likes + comments * 2 + ctaClicks * 3) / views

  // Cap at 1.0
  return Math.min(engagementRate * 10, 1)
}

/**
 * Calculate geo score based on distance from user location
 */
export function calculateGeoScore(
  short: ScoreableShort,
  userLocation?: LatLng
): number {
  if (!userLocation || !short.latitude || !short.longitude) {
    return 0.5 // Neutral score
  }

  const distance = haversineDistance(userLocation, {
    lat: short.latitude,
    lng: short.longitude,
  })

  if (distance < 5) return 1.0      // < 5km = full boost
  if (distance < 25) return 0.7     // < 25km = partial boost
  return 0.3                         // > 25km = minimal
}

/**
 * Apply diversity filter: max N shorts per company
 */
export function applyDiversityFilter<T extends { company: { id: string } }>(
  shorts: T[],
  maxPerCompany: number = 2,
  inTopN: number = 20
): T[] {
  const companyCount = new Map<string, number>()
  const result: T[] = []
  const deferred: T[] = []

  for (const short of shorts) {
    const count = companyCount.get(short.company.id) || 0

    if (count < maxPerCompany && result.length < inTopN) {
      result.push(short)
      companyCount.set(short.company.id, count + 1)
    } else {
      deferred.push(short)
    }
  }

  return [...result, ...deferred]
}
