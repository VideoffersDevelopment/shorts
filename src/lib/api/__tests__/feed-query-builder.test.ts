import { describe, it, expect } from 'vitest'
import {
  buildFeedWhereClause,
  buildFeedOrderBy,
  buildFeedSelect,
} from '../feed-query-builder'
import type { FeedQueryParams } from '@/lib/validation/feed'

// =============================================================================
// TEST DATA
// =============================================================================

const createDefaultParams = (overrides: Partial<FeedQueryParams> = {}): FeedQueryParams => ({
  page: 1,
  limit: 20,
  sort: 'algorithmic',
  verifiedOnly: false,
  ...overrides,
})

describe('buildFeedWhereClause', () => {
  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns where clause with PUBLISHED status as base filter', () => {
      // Arrange
      const params = createDefaultParams()

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toEqual({
        status: 'PUBLISHED',
      })
    })

    it('adds categoryId filter when categoryIds is provided', () => {
      // Arrange
      const params = createDefaultParams({
        categoryIds: ['cat-1', 'cat-2'],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toMatchObject({
        status: 'PUBLISHED',
        categoryId: { in: ['cat-1', 'cat-2'] },
      })
    })

    it('adds tags filter when tags is provided', () => {
      // Arrange
      const params = createDefaultParams({
        tags: ['tech', 'startup'],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toMatchObject({
        status: 'PUBLISHED',
        tags: {
          some: {
            tag: {
              slug: { in: ['tech', 'startup'] },
            },
          },
        },
      })
    })

    it('adds company viesVerified filter when verifiedOnly is true', () => {
      // Arrange
      const params = createDefaultParams({
        verifiedOnly: true,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toMatchObject({
        status: 'PUBLISHED',
        company: {
          viesVerified: true,
        },
      })
    })

    it('adds location bounding box filter when lat, lng and radius provided', () => {
      // Arrange
      const params = createDefaultParams({
        lat: 52.2297,
        lng: 21.0122,
        radius: 10,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.latitude).toBeDefined()
      expect(result.latitude).toHaveProperty('gte')
      expect(result.latitude).toHaveProperty('lte')
      expect(result.longitude).toBeDefined()
      expect(result.longitude).toHaveProperty('gte')
      expect(result.longitude).toHaveProperty('lte')
    })

    it('calculates correct bounding box for Warsaw coordinates', () => {
      // Arrange
      const params = createDefaultParams({
        lat: 52.2297,
        lng: 21.0122,
        radius: 10,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      // 10km radius / 111 km per degree ~= 0.09 degrees
      const latDelta = 10 / 111
      expect((result.latitude as { gte: number }).gte).toBeCloseTo(52.2297 - latDelta, 2)
      expect((result.latitude as { lte: number }).lte).toBeCloseTo(52.2297 + latDelta, 2)
    })

    it('adjusts longitude delta based on latitude (cosine correction)', () => {
      // Arrange - Using equator where cos(0) = 1
      const paramsEquator = createDefaultParams({
        lat: 0,
        lng: 0,
        radius: 10,
      })

      // At equator, lng delta should equal lat delta
      const resultEquator = buildFeedWhereClause(paramsEquator)

      // Arrange - Using 60 degrees north where cos(60) = 0.5
      const params60 = createDefaultParams({
        lat: 60,
        lng: 0,
        radius: 10,
      })

      const result60 = buildFeedWhereClause(params60)

      // Assert - At 60 degrees, longitude delta should be ~2x lat delta
      const latDelta = 10 / 111
      const lngDeltaEquator = (resultEquator.longitude as { lte: number }).lte - 0
      const lngDelta60 = (result60.longitude as { lte: number }).lte - 0

      // Longitude delta at 60 degrees should be approximately 2x the equator delta
      expect(lngDelta60 / lngDeltaEquator).toBeCloseTo(2, 0)
    })

    it('combines all filters together', () => {
      // Arrange
      const params = createDefaultParams({
        categoryIds: ['cat-1'],
        tags: ['tech'],
        verifiedOnly: true,
        lat: 52.2297,
        lng: 21.0122,
        radius: 10,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.status).toBe('PUBLISHED')
      expect(result.categoryId).toBeDefined()
      expect(result.tags).toBeDefined()
      expect(result.company).toEqual({ viesVerified: true })
      expect(result.latitude).toBeDefined()
      expect(result.longitude).toBeDefined()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('ignores categoryIds when it is empty array', () => {
      // Arrange
      const params = createDefaultParams({
        categoryIds: [],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toEqual({
        status: 'PUBLISHED',
      })
      expect(result.categoryId).toBeUndefined()
    })

    it('ignores tags when it is empty array', () => {
      // Arrange
      const params = createDefaultParams({
        tags: [],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result).toEqual({
        status: 'PUBLISHED',
      })
      expect(result.tags).toBeUndefined()
    })

    it('does not add company filter when verifiedOnly is false', () => {
      // Arrange
      const params = createDefaultParams({
        verifiedOnly: false,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.company).toBeUndefined()
    })

    it('ignores location filter when lat is undefined', () => {
      // Arrange
      const params = createDefaultParams({
        lat: undefined,
        lng: 21.0122,
        radius: 10,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.latitude).toBeUndefined()
      expect(result.longitude).toBeUndefined()
    })

    it('ignores location filter when lng is undefined', () => {
      // Arrange
      const params = createDefaultParams({
        lat: 52.2297,
        lng: undefined,
        radius: 10,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.latitude).toBeUndefined()
      expect(result.longitude).toBeUndefined()
    })

    it('ignores location filter when radius is undefined', () => {
      // Arrange
      const params = createDefaultParams({
        lat: 52.2297,
        lng: 21.0122,
        radius: undefined,
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.latitude).toBeUndefined()
      expect(result.longitude).toBeUndefined()
    })

    it('handles single categoryId correctly', () => {
      // Arrange
      const params = createDefaultParams({
        categoryIds: ['only-one'],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.categoryId).toEqual({ in: ['only-one'] })
    })

    it('handles single tag correctly', () => {
      // Arrange
      const params = createDefaultParams({
        tags: ['only-tag'],
      })

      // Act
      const result = buildFeedWhereClause(params)

      // Assert
      expect(result.tags).toEqual({
        some: {
          tag: {
            slug: { in: ['only-tag'] },
          },
        },
      })
    })
  })
})

describe('buildFeedOrderBy', () => {
  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns publishedAt desc for newest sort', () => {
      // Act
      const result = buildFeedOrderBy('newest')

      // Assert
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })

    it('returns publishedAt desc for popular sort (app-layer sorting)', () => {
      // Act
      const result = buildFeedOrderBy('popular')

      // Assert
      // Popular uses app-layer sorting, DB just orders by publishedAt as fallback
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })

    it('returns publishedAt desc for trending sort (app-layer sorting)', () => {
      // Act
      const result = buildFeedOrderBy('trending')

      // Assert
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })

    it('returns publishedAt desc for following sort', () => {
      // Act
      const result = buildFeedOrderBy('following')

      // Assert
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })

    it('returns publishedAt desc for algorithmic sort (app-layer sorting)', () => {
      // Act
      const result = buildFeedOrderBy('algorithmic')

      // Assert
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('returns default order for undefined sort (defaults to algorithmic)', () => {
      // Act
      const result = buildFeedOrderBy(undefined as unknown as 'algorithmic')

      // Assert
      expect(result).toEqual([{ publishedAt: 'desc' }])
    })
  })
})

describe('buildFeedSelect', () => {
  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns complete select object with all required fields', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result.id).toBe(true)
      expect(result.title).toBe(true)
      expect(result.thumbnailUrl).toBe(true)
      expect(result.hlsPlaylistUrl).toBe(true)
      expect(result.duration).toBe(true)
      expect(result.publishedAt).toBe(true)
      expect(result.latitude).toBe(true)
      expect(result.longitude).toBe(true)
      expect(result.ctaLink).toBe(true)
    })

    it('includes stats relation with views, likes, and ctaClicks', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result.stats).toEqual({
        select: {
          views: true,
          likes: true,
          ctaClicks: true,
        },
      })
    })

    it('includes company relation with all required fields', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result.company).toEqual({
        select: {
          id: true,
          companyName: true,
          slug: true,
          logo: true,
          viesVerified: true,
          city: true,
        },
      })
    })

    it('includes category relation with all required fields', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result.category).toEqual({
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    })

    it('returns consistent structure on multiple calls', () => {
      // Act
      const result1 = buildFeedSelect()
      const result2 = buildFeedSelect()

      // Assert
      expect(result1).toEqual(result2)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('does not include status field (not needed in response)', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result).not.toHaveProperty('status')
    })

    it('does not include createdAt field (not needed in response)', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result).not.toHaveProperty('createdAt')
    })

    it('does not include updatedAt field (not needed in response)', () => {
      // Act
      const result = buildFeedSelect()

      // Assert
      expect(result).not.toHaveProperty('updatedAt')
    })
  })
})
