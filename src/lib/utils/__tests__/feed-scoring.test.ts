import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateScore,
  calculateRecencyScore,
  calculateEngagementScore,
  calculateGeoScore,
  applyDiversityFilter,
  type ScoreableShort,
  type ScoringOptions,
} from '../feed-scoring'
import type { LatLng } from '../haversine'

describe('feed-scoring', () => {
  // ===========================================================================
  // CALCULATE SCORE - HAPPY PATH
  // ===========================================================================

  describe('calculateScore - Happy Path', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns value between 0 and 1', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date('2025-12-25T12:00:00Z'),
        stats: {
          views: 1000,
          likes: 100,
          comments: 50,
          ctaClicks: 25,
        },
        latitude: 52.2297,
        longitude: 21.0122,
      }

      const options: ScoringOptions = {
        userLocation: { lat: 52.2297, lng: 21.0122 },
      }

      // Act
      const score = calculateScore(short, options)

      // Assert
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('calculates composite score from all factors', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date('2026-01-01T11:00:00Z'), // 1 hour ago
        stats: {
          views: 100,
          likes: 10,
          comments: 5,
          ctaClicks: 2,
        },
        latitude: 52.2297,
        longitude: 21.0122,
      }

      const options: ScoringOptions = {
        userLocation: { lat: 52.2300, lng: 21.0125 }, // Very close
      }

      // Act
      const score = calculateScore(short, options)

      // Assert
      expect(score).toBeGreaterThan(0.3)
      expect(score).toBeLessThan(1)
    })

    it('uses default weights when not provided', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date('2026-01-01T00:00:00Z'),
        stats: {
          views: 100,
          likes: 50,
          comments: 10,
          ctaClicks: 5,
        },
      }

      // Act
      const score = calculateScore(short)

      // Assert
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(1)
    })
  })

  // ===========================================================================
  // CALCULATE RECENCY SCORE - HAPPY PATH
  // ===========================================================================

  describe('calculateRecencyScore - Happy Path', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('gives higher score to newer content', () => {
      // Arrange
      const recentDate = new Date('2026-01-01T11:00:00Z') // 1 hour ago
      const olderDate = new Date('2025-12-25T12:00:00Z') // 7 days ago

      // Act
      const recentScore = calculateRecencyScore(recentDate)
      const olderScore = calculateRecencyScore(olderDate)

      // Assert
      expect(recentScore).toBeGreaterThan(olderScore)
    })

    it('returns approximately 1.0 for just published content', () => {
      // Arrange
      const justNow = new Date('2026-01-01T12:00:00Z')

      // Act
      const score = calculateRecencyScore(justNow)

      // Assert
      expect(score).toBeCloseTo(1, 1)
    })

    it('returns lower score after 7 days (exponential decay)', () => {
      // Arrange
      const sevenDaysAgo = new Date('2025-12-25T12:00:00Z')

      // Act
      const score = calculateRecencyScore(sevenDaysAgo)

      // Assert - With 168h (7 days) half-life, exp(-168/168) = exp(-1) = ~0.37
      expect(score).toBeCloseTo(0.37, 1)
    })

    it('returns low score for very old content', () => {
      // Arrange
      const thirtyDaysAgo = new Date('2025-12-01T12:00:00Z')

      // Act
      const score = calculateRecencyScore(thirtyDaysAgo)

      // Assert
      expect(score).toBeLessThan(0.1)
    })
  })

  // ===========================================================================
  // CALCULATE ENGAGEMENT SCORE - HAPPY PATH
  // ===========================================================================

  describe('calculateEngagementScore - Happy Path', () => {
    it('reflects engagement metrics correctly', () => {
      // Arrange
      const highEngagement = {
        views: 100,
        likes: 20,
        comments: 10,
        ctaClicks: 5,
      }

      const lowEngagement = {
        views: 100,
        likes: 1,
        comments: 0,
        ctaClicks: 0,
      }

      // Act
      const highScore = calculateEngagementScore(highEngagement)
      const lowScore = calculateEngagementScore(lowEngagement)

      // Assert
      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('caps score at 1.0', () => {
      // Arrange - Viral content with very high engagement
      const viralStats = {
        views: 100,
        likes: 50,
        comments: 30,
        ctaClicks: 20,
      }

      // Act
      const score = calculateEngagementScore(viralStats)

      // Assert
      expect(score).toBe(1)
    })

    it('weights CTA clicks higher than likes', () => {
      // Arrange - Use lower engagement values to avoid score capping at 1.0
      const moreClicks = {
        views: 1000,
        likes: 5,
        comments: 0,
        ctaClicks: 10, // 10 * 3 = 30
      }

      const moreLikes = {
        views: 1000,
        likes: 20, // 20 * 1 = 20
        comments: 0,
        ctaClicks: 2, // 2 * 3 = 6
      }

      // Act
      const clicksScore = calculateEngagementScore(moreClicks)
      const likesScore = calculateEngagementScore(moreLikes)

      // Assert - CTA clicks have 3x weight vs 1x for likes
      // moreClicks: (5 + 0 + 30) / 1000 * 10 = 0.35
      // moreLikes: (20 + 0 + 6) / 1000 * 10 = 0.26
      expect(clicksScore).toBeGreaterThan(likesScore)
    })

    it('weights comments higher than likes', () => {
      // Arrange - Use higher view counts to avoid capping
      const moreComments = {
        views: 1000,
        likes: 5, // 5 * 1 = 5
        comments: 10, // 10 * 2 = 20
        ctaClicks: 0,
      }

      const moreLikes = {
        views: 1000,
        likes: 15, // 15 * 1 = 15
        comments: 2, // 2 * 2 = 4
        ctaClicks: 0,
      }

      // Act
      const commentsScore = calculateEngagementScore(moreComments)
      const likesScore = calculateEngagementScore(moreLikes)

      // Assert - Comments have 2x weight vs 1x for likes
      // moreComments: (5 + 20 + 0) / 1000 * 10 = 0.25
      // moreLikes: (15 + 4 + 0) / 1000 * 10 = 0.19
      expect(commentsScore).toBeGreaterThan(likesScore)
    })
  })

  // ===========================================================================
  // CALCULATE ENGAGEMENT SCORE - EDGE CASES
  // ===========================================================================

  describe('calculateEngagementScore - Edge Cases', () => {
    it('handles null stats', () => {
      // Act
      const score = calculateEngagementScore(null)

      // Assert - Returns minimal score for new content
      expect(score).toBe(0.1)
    })

    it('handles undefined stats', () => {
      // Act
      const score = calculateEngagementScore(undefined)

      // Assert
      expect(score).toBe(0.1)
    })

    it('handles zero views', () => {
      // Arrange - Using 0 views (edge case)
      const stats = {
        views: 0,
        likes: 10,
        comments: 5,
        ctaClicks: 2,
      }

      // Act
      const score = calculateEngagementScore(stats)

      // Assert - Should not throw, defaults views to 1
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('handles missing comments field', () => {
      // Arrange
      const stats = {
        views: 100,
        likes: 10,
        ctaClicks: 5,
        comments: undefined,
      }

      // Act
      const score = calculateEngagementScore(stats)

      // Assert
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('handles all zero engagement metrics', () => {
      // Arrange
      const stats = {
        views: 100,
        likes: 0,
        comments: 0,
        ctaClicks: 0,
      }

      // Act
      const score = calculateEngagementScore(stats)

      // Assert
      expect(score).toBe(0)
    })
  })

  // ===========================================================================
  // CALCULATE GEO SCORE - HAPPY PATH
  // ===========================================================================

  describe('calculateGeoScore - Happy Path', () => {
    it('boosts nearby content (< 5km)', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: 52.2300,
        longitude: 21.0125,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(1.0)
    })

    it('gives partial boost for medium distance (< 25km)', () => {
      // Arrange - Point approximately 15km away
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: 52.35,
        longitude: 21.10,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(0.7)
    })

    it('gives minimal boost for far content (> 25km)', () => {
      // Arrange - Point approximately 252km away (Krakow from Warsaw)
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: 50.0647,
        longitude: 19.9450,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(0.3)
    })
  })

  // ===========================================================================
  // CALCULATE GEO SCORE - EDGE CASES
  // ===========================================================================

  describe('calculateGeoScore - Edge Cases', () => {
    it('returns neutral score when user location missing', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: 52.2297,
        longitude: 21.0122,
      }

      // Act
      const score = calculateGeoScore(short, undefined)

      // Assert
      expect(score).toBe(0.5)
    })

    it('returns neutral score when short has no location', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: null,
        longitude: null,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(0.5)
    })

    it('returns neutral score when short latitude is missing', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: undefined,
        longitude: 21.0122,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(0.5)
    })

    it('returns neutral score when short longitude is missing', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date(),
        latitude: 52.2297,
        longitude: undefined,
      }
      const userLocation: LatLng = { lat: 52.2297, lng: 21.0122 }

      // Act
      const score = calculateGeoScore(short, userLocation)

      // Assert
      expect(score).toBe(0.5)
    })
  })

  // ===========================================================================
  // SCORING WEIGHTS
  // ===========================================================================

  describe('Scoring Weights', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('custom weights override defaults', () => {
      // Arrange - Use a short with distinct recency vs engagement scores
      // - publishedAt 24h ago -> recency ~0.87
      // - low engagement -> engagement ~0.31
      const short: ScoreableShort = {
        publishedAt: new Date('2025-12-31T12:00:00Z'), // 24 hours ago
        stats: {
          views: 1000,
          likes: 10,
          comments: 5,
          ctaClicks: 2,
        },
        latitude: 52.2297,
        longitude: 21.0122,
      }

      const heavyEngagement: ScoringOptions = {
        weights: {
          recency: 0.05,
          engagement: 0.90,
          geo: 0.025,
          personalization: 0.025,
        },
      }

      const heavyRecency: ScoringOptions = {
        weights: {
          recency: 0.90,
          engagement: 0.05,
          geo: 0.025,
          personalization: 0.025,
        },
      }

      // Act
      const engagementScore = calculateScore(short, heavyEngagement)
      const recencyScore = calculateScore(short, heavyRecency)

      // Assert - When weighting engagement heavily, low engagement = lower score
      // When weighting recency heavily, good recency (24h ago) = higher score
      expect(recencyScore).toBeGreaterThan(engagementScore)
    })

    it('all weight combinations work correctly', () => {
      // Arrange
      const short: ScoreableShort = {
        publishedAt: new Date('2026-01-01T11:00:00Z'),
        stats: {
          views: 100,
          likes: 50,
          comments: 20,
          ctaClicks: 10,
        },
        latitude: 52.2297,
        longitude: 21.0122,
      }

      const customWeights: ScoringOptions = {
        userLocation: { lat: 52.2300, lng: 21.0125 },
        weights: {
          recency: 0.25,
          engagement: 0.25,
          geo: 0.25,
          personalization: 0.25,
        },
      }

      // Act
      const score = calculateScore(short, customWeights)

      // Assert - Should compute valid score
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('zero weight for recency ignores recency', () => {
      // Arrange
      const oldShort: ScoreableShort = {
        publishedAt: new Date('2025-06-01T00:00:00Z'), // 6 months ago
        stats: {
          views: 1000,
          likes: 500,
          comments: 100,
          ctaClicks: 50,
        },
      }

      const newShort: ScoreableShort = {
        publishedAt: new Date('2026-01-01T11:00:00Z'), // 1 hour ago
        stats: {
          views: 1000,
          likes: 500,
          comments: 100,
          ctaClicks: 50,
        },
      }

      const noRecency: ScoringOptions = {
        weights: {
          recency: 0,
          engagement: 0.7,
          geo: 0,
          personalization: 0.3,
        },
      }

      // Act
      const oldScore = calculateScore(oldShort, noRecency)
      const newScore = calculateScore(newShort, noRecency)

      // Assert - Same scores when recency is ignored
      expect(oldScore).toBeCloseTo(newScore, 5)
    })
  })

  // ===========================================================================
  // APPLY DIVERSITY FILTER - HAPPY PATH
  // ===========================================================================

  describe('applyDiversityFilter - Happy Path', () => {
    it('limits companies in top N by deferring excess', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-a' } }, // 3rd from company-a -> deferred
        { id: '4', company: { id: 'company-b' } },
        { id: '5', company: { id: 'company-b' } },
        { id: '6', company: { id: 'company-c' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 2, 6)

      // Assert - Algorithm puts items into result while under maxPerCompany AND result.length < inTopN
      // shorts[0]: company-a count=0 < 2, result.length=0 < 6 -> result [1]
      // shorts[1]: company-a count=1 < 2, result.length=1 < 6 -> result [1,2]
      // shorts[2]: company-a count=2 >= 2 -> deferred [3]
      // shorts[3]: company-b count=0 < 2, result.length=2 < 6 -> result [1,2,4]
      // shorts[4]: company-b count=1 < 2, result.length=3 < 6 -> result [1,2,4,5]
      // shorts[5]: company-c count=0 < 2, result.length=4 < 6 -> result [1,2,4,5,6]
      // Final: [1,2,4,5,6,3]
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('2')
      expect(filtered[2].id).toBe('4')
      expect(filtered[3].id).toBe('5')
      expect(filtered[4].id).toBe('6')
      expect(filtered[5].id).toBe('3') // deferred
    })

    it('uses default maxPerCompany of 2', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-a' } },
        { id: '4', company: { id: 'company-b' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts)

      // Assert - Short 3 should be deferred
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('2')
      expect(filtered[2].id).toBe('4')
      expect(filtered[3].id).toBe('3')
    })

    it('uses default inTopN of 20', () => {
      // Arrange - Create 25 shorts from same company
      const shorts = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        company: { id: 'company-a' },
      }))

      // Act
      const filtered = applyDiversityFilter(shorts)

      // Assert - First 2 should be from company-a, rest deferred
      expect(filtered[0].company.id).toBe('company-a')
      expect(filtered[1].company.id).toBe('company-a')
      // Remaining 23 should be after the first 2
      expect(filtered.length).toBe(25)
    })

    it('preserves all shorts in output', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-a' } },
        { id: '4', company: { id: 'company-b' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 1, 3)

      // Assert - All shorts preserved
      expect(filtered.length).toBe(shorts.length)
      expect(filtered.map((s) => s.id).sort()).toEqual(['1', '2', '3', '4'])
    })
  })

  // ===========================================================================
  // APPLY DIVERSITY FILTER - EDGE CASES
  // ===========================================================================

  describe('applyDiversityFilter - Edge Cases', () => {
    it('handles empty shorts array', () => {
      // Arrange
      const shorts: Array<{ id: string; company: { id: string } }> = []

      // Act
      const filtered = applyDiversityFilter(shorts)

      // Assert
      expect(filtered).toEqual([])
      expect(filtered.length).toBe(0)
    })

    it('handles single short', () => {
      // Arrange
      const shorts = [{ id: '1', company: { id: 'company-a' } }]

      // Act
      const filtered = applyDiversityFilter(shorts)

      // Assert
      expect(filtered).toEqual(shorts)
    })

    it('handles all shorts from same company', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-a' } },
        { id: '4', company: { id: 'company-a' } },
        { id: '5', company: { id: 'company-a' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 2, 4)

      // Assert - First 2 in top, rest deferred
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('2')
      // Remaining in deferred order
      expect(filtered.slice(2).map((s) => s.id)).toEqual(['3', '4', '5'])
    })

    it('handles all shorts from different companies', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-b' } },
        { id: '3', company: { id: 'company-c' } },
        { id: '4', company: { id: 'company-d' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 2, 4)

      // Assert - Order preserved when all unique
      expect(filtered).toEqual(shorts)
    })

    it('handles maxPerCompany = 1', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-b' } },
        { id: '4', company: { id: 'company-b' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 1, 4)

      // Assert
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
      // Deferred
      expect(filtered[2].id).toBe('2')
      expect(filtered[3].id).toBe('4')
    })

    it('handles inTopN larger than array', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-a' } },
        { id: '3', company: { id: 'company-a' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 2, 100)

      // Assert - First 2 included, 3rd deferred
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('2')
      expect(filtered[2].id).toBe('3')
    })

    it('handles inTopN = 0', () => {
      // Arrange
      const shorts = [
        { id: '1', company: { id: 'company-a' } },
        { id: '2', company: { id: 'company-b' } },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 2, 0)

      // Assert - All deferred (none pass inTopN check)
      expect(filtered).toEqual(shorts)
    })

    it('handles shorts with additional properties', () => {
      // Arrange
      interface ShortWithExtras {
        id: string
        company: { id: string }
        title: string
        views: number
      }

      const shorts: ShortWithExtras[] = [
        { id: '1', company: { id: 'company-a' }, title: 'Short 1', views: 100 },
        { id: '2', company: { id: 'company-a' }, title: 'Short 2', views: 200 },
        { id: '3', company: { id: 'company-b' }, title: 'Short 3', views: 300 },
      ]

      // Act
      const filtered = applyDiversityFilter(shorts, 1, 3)

      // Assert - Additional properties preserved
      expect(filtered[0].title).toBe('Short 1')
      expect(filtered[0].views).toBe(100)
      expect(filtered[1].title).toBe('Short 3')
      expect(filtered[2].title).toBe('Short 2')
    })
  })

  // ===========================================================================
  // BOOST SCORING
  // ===========================================================================

  describe('Boost Scoring', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('non-boosted short has normal score', () => {
      // Arrange
      const shortWithFalse: ScoreableShort = {
        publishedAt: new Date('2026-01-01T06:00:00Z'),
        stats: { views: 500, likes: 30, comments: 10, ctaClicks: 5 },
        isBoosted: false,
      }

      const shortWithUndefined: ScoreableShort = {
        publishedAt: new Date('2026-01-01T06:00:00Z'),
        stats: { views: 500, likes: 30, comments: 10, ctaClicks: 5 },
      }

      // Act
      const scoreFalse = calculateScore(shortWithFalse)
      const scoreUndefined = calculateScore(shortWithUndefined)

      // Assert - Both should produce the same score (no boost applied)
      expect(scoreFalse).toBeCloseTo(scoreUndefined, 10)
    })

    it('boosted short gets +30% score increase', () => {
      // Arrange
      const baseShort: ScoreableShort = {
        publishedAt: new Date('2025-12-31T12:00:00Z'), // 24 hours ago
        stats: { views: 1000, likes: 20, comments: 5, ctaClicks: 3 },
      }

      const boostedShort: ScoreableShort = {
        ...baseShort,
        isBoosted: true,
      }

      // Act
      const baseScore = calculateScore(baseShort)
      const boostedScore = calculateScore(boostedShort)

      // Assert - Boosted should be ~1.3x of base score
      expect(boostedScore).toBeCloseTo(baseScore * 1.3, 5)
    })

    it('boosted score is capped at 1.0', () => {
      // Arrange - Create a short with very high engagement to push base score high
      const highScoreShort: ScoreableShort = {
        publishedAt: new Date('2026-01-01T11:59:00Z'), // 1 minute ago
        stats: { views: 100, likes: 50, comments: 30, ctaClicks: 20 },
        latitude: 52.2300,
        longitude: 21.0125,
        isBoosted: true,
      }

      const options: ScoringOptions = {
        userLocation: { lat: 52.2297, lng: 21.0122 },
      }

      // Act
      const score = calculateScore(highScoreShort, options)

      // Assert - Even with boost, score never exceeds 1.0
      expect(score).toBeLessThanOrEqual(1.0)
    })

    it('boosted short scores higher than non-boosted', () => {
      // Arrange - Identical shorts, only boost differs
      const nonBoostedShort: ScoreableShort = {
        publishedAt: new Date('2025-12-30T12:00:00Z'),
        stats: { views: 800, likes: 40, comments: 15, ctaClicks: 8 },
        latitude: 52.2297,
        longitude: 21.0122,
        isBoosted: false,
      }

      const boostedShort: ScoreableShort = {
        publishedAt: new Date('2025-12-30T12:00:00Z'),
        stats: { views: 800, likes: 40, comments: 15, ctaClicks: 8 },
        latitude: 52.2297,
        longitude: 21.0122,
        isBoosted: true,
      }

      const options: ScoringOptions = {
        userLocation: { lat: 52.2297, lng: 21.0122 },
      }

      // Act
      const nonBoostedScore = calculateScore(nonBoostedShort, options)
      const boostedScore = calculateScore(boostedShort, options)

      // Assert - Boosted ranks higher
      expect(boostedScore).toBeGreaterThan(nonBoostedScore)
    })

    it('isBoosted defaults to false when undefined', () => {
      // Arrange - Short without isBoosted field at all
      const shortWithoutField: ScoreableShort = {
        publishedAt: new Date('2026-01-01T06:00:00Z'),
        stats: { views: 500, likes: 30, comments: 10, ctaClicks: 5 },
      }

      const shortExplicitlyFalse: ScoreableShort = {
        publishedAt: new Date('2026-01-01T06:00:00Z'),
        stats: { views: 500, likes: 30, comments: 10, ctaClicks: 5 },
        isBoosted: false,
      }

      const shortExplicitlyTrue: ScoreableShort = {
        publishedAt: new Date('2026-01-01T06:00:00Z'),
        stats: { views: 500, likes: 30, comments: 10, ctaClicks: 5 },
        isBoosted: true,
      }

      // Act
      const scoreUndefined = calculateScore(shortWithoutField)
      const scoreFalse = calculateScore(shortExplicitlyFalse)
      const scoreTrue = calculateScore(shortExplicitlyTrue)

      // Assert - undefined and false produce same score, true produces different
      expect(scoreUndefined).toBeCloseTo(scoreFalse, 10)
      expect(scoreTrue).not.toBeCloseTo(scoreFalse, 5)
    })
  })

  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================

  describe('Integration Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('complete scoring workflow works correctly', () => {
      // Arrange
      const shorts: ScoreableShort[] = [
        {
          publishedAt: new Date('2026-01-01T11:00:00Z'),
          stats: { views: 1000, likes: 100, comments: 50, ctaClicks: 25 },
          latitude: 52.2300,
          longitude: 21.0125,
        },
        {
          publishedAt: new Date('2025-12-25T12:00:00Z'),
          stats: { views: 5000, likes: 500, comments: 100, ctaClicks: 50 },
          latitude: 50.0647,
          longitude: 19.9450,
        },
        {
          publishedAt: new Date('2026-01-01T10:00:00Z'),
          stats: null,
          latitude: null,
          longitude: null,
        },
      ]

      const options: ScoringOptions = {
        userLocation: { lat: 52.2297, lng: 21.0122 },
      }

      // Act
      const scores = shorts.map((short) => calculateScore(short, options))

      // Assert - All scores valid
      scores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })

      // Recent nearby content should score higher than old distant content
      expect(scores[0]).toBeGreaterThan(scores[1])
    })

    it('scoring and diversity filter work together', () => {
      // Arrange
      const shortsWithCompany = [
        { id: '1', company: { id: 'a' }, score: 0.95 },
        { id: '2', company: { id: 'a' }, score: 0.90 },
        { id: '3', company: { id: 'a' }, score: 0.85 },
        { id: '4', company: { id: 'b' }, score: 0.80 },
        { id: '5', company: { id: 'b' }, score: 0.75 },
        { id: '6', company: { id: 'c' }, score: 0.70 },
      ]

      // Act
      const filtered = applyDiversityFilter(shortsWithCompany, 2, 5)

      // Assert
      const topFive = filtered.slice(0, 5)
      const companyACounts = topFive.filter((s) => s.company.id === 'a')
      expect(companyACounts.length).toBeLessThanOrEqual(2)

      // All items preserved
      expect(filtered.length).toBe(6)
    })
  })
})
