import { describe, it, expect } from 'vitest'
import { feedQuerySchema, type FeedQueryParams } from '../feed'

describe('feedQuerySchema', () => {
  // ===========================================================================
  // HAPPY PATH - DEFAULT VALUES
  // ===========================================================================

  describe('Default Values', () => {
    it('applies default page=1 when not provided', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result.page).toBe(1)
    })

    it('applies default limit=20 when not provided', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result.limit).toBe(20)
    })

    it('applies default sort=algorithmic when not provided', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result.sort).toBe('algorithmic')
    })

    it('applies default verifiedOnly=false when not provided', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result.verifiedOnly).toBe(false)
    })

    it('applies all defaults together', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result).toMatchObject({
        page: 1,
        limit: 20,
        sort: 'algorithmic',
        verifiedOnly: false,
      })
    })
  })

  // ===========================================================================
  // HAPPY PATH - VALID PARAMS
  // ===========================================================================

  describe('Valid Parameters', () => {
    it('parses valid page number', () => {
      // Act
      const result = feedQuerySchema.parse({ page: '5' })

      // Assert
      expect(result.page).toBe(5)
    })

    it('parses valid limit number', () => {
      // Act
      const result = feedQuerySchema.parse({ limit: '30' })

      // Assert
      expect(result.limit).toBe(30)
    })

    it('parses maximum limit (50)', () => {
      // Act
      const result = feedQuerySchema.parse({ limit: '50' })

      // Assert
      expect(result.limit).toBe(50)
    })

    it('parses minimum limit (1)', () => {
      // Act
      const result = feedQuerySchema.parse({ limit: '1' })

      // Assert
      expect(result.limit).toBe(1)
    })

    it('parses sort=newest', () => {
      // Act
      const result = feedQuerySchema.parse({ sort: 'newest' })

      // Assert
      expect(result.sort).toBe('newest')
    })

    it('parses sort=popular', () => {
      // Act
      const result = feedQuerySchema.parse({ sort: 'popular' })

      // Assert
      expect(result.sort).toBe('popular')
    })

    it('parses sort=trending', () => {
      // Act
      const result = feedQuerySchema.parse({ sort: 'trending' })

      // Assert
      expect(result.sort).toBe('trending')
    })

    it('parses sort=following', () => {
      // Act
      const result = feedQuerySchema.parse({ sort: 'following' })

      // Assert
      expect(result.sort).toBe('following')
    })

    it('parses sort=algorithmic', () => {
      // Act
      const result = feedQuerySchema.parse({ sort: 'algorithmic' })

      // Assert
      expect(result.sort).toBe('algorithmic')
    })

    it('parses valid latitude', () => {
      // Act
      const result = feedQuerySchema.parse({ lat: '52.2297' })

      // Assert
      expect(result.lat).toBe(52.2297)
    })

    it('parses valid longitude', () => {
      // Act
      const result = feedQuerySchema.parse({ lng: '21.0122' })

      // Assert
      expect(result.lng).toBe(21.0122)
    })

    it('parses valid radius', () => {
      // Act
      const result = feedQuerySchema.parse({ radius: '25' })

      // Assert
      expect(result.radius).toBe(25)
    })

    it('parses minimum radius (1)', () => {
      // Act
      const result = feedQuerySchema.parse({ radius: '1' })

      // Assert
      expect(result.radius).toBe(1)
    })

    it('parses maximum radius (100)', () => {
      // Act
      const result = feedQuerySchema.parse({ radius: '100' })

      // Assert
      expect(result.radius).toBe(100)
    })

    it('parses verifiedOnly=true', () => {
      // Act
      const result = feedQuerySchema.parse({ verifiedOnly: 'true' })

      // Assert
      expect(result.verifiedOnly).toBe(true)
    })

    it('parses verifiedOnly=false', () => {
      // Act
      const result = feedQuerySchema.parse({ verifiedOnly: 'false' })

      // Assert
      expect(result.verifiedOnly).toBe(false)
    })

    it('parses single categoryId from string', () => {
      // Act
      const result = feedQuerySchema.parse({ categoryIds: 'cat-1' })

      // Assert
      expect(result.categoryIds).toEqual(['cat-1'])
    })

    it('parses multiple categoryIds from comma-separated string', () => {
      // Act
      const result = feedQuerySchema.parse({ categoryIds: 'cat-1,cat-2,cat-3' })

      // Assert
      expect(result.categoryIds).toEqual(['cat-1', 'cat-2', 'cat-3'])
    })

    it('parses single tag from string', () => {
      // Act
      const result = feedQuerySchema.parse({ tags: 'tech' })

      // Assert
      expect(result.tags).toEqual(['tech'])
    })

    it('parses multiple tags from comma-separated string', () => {
      // Act
      const result = feedQuerySchema.parse({ tags: 'tech,startup,ai' })

      // Assert
      expect(result.tags).toEqual(['tech', 'startup', 'ai'])
    })

    it('parses all parameters together', () => {
      // Arrange
      const input = {
        page: '2',
        limit: '15',
        sort: 'popular',
        categoryIds: 'cat-1,cat-2',
        tags: 'tech,ai',
        lat: '52.2297',
        lng: '21.0122',
        radius: '25',
        verifiedOnly: 'true',
      }

      // Act
      const result = feedQuerySchema.parse(input)

      // Assert
      expect(result).toEqual({
        page: 2,
        limit: 15,
        sort: 'popular',
        categoryIds: ['cat-1', 'cat-2'],
        tags: ['tech', 'ai'],
        lat: 52.2297,
        lng: 21.0122,
        radius: 25,
        verifiedOnly: true,
      })
    })
  })

  // ===========================================================================
  // TYPE COERCION
  // ===========================================================================

  describe('Type Coercion', () => {
    it('coerces page string to number', () => {
      // Act
      const result = feedQuerySchema.parse({ page: '10' })

      // Assert
      expect(typeof result.page).toBe('number')
      expect(result.page).toBe(10)
    })

    it('coerces limit string to number', () => {
      // Act
      const result = feedQuerySchema.parse({ limit: '25' })

      // Assert
      expect(typeof result.limit).toBe('number')
      expect(result.limit).toBe(25)
    })

    it('coerces lat string to number', () => {
      // Act
      const result = feedQuerySchema.parse({ lat: '52.2297' })

      // Assert
      expect(typeof result.lat).toBe('number')
    })

    it('coerces lng string to number', () => {
      // Act
      const result = feedQuerySchema.parse({ lng: '21.0122' })

      // Assert
      expect(typeof result.lng).toBe('number')
    })

    it('coerces radius string to number', () => {
      // Act
      const result = feedQuerySchema.parse({ radius: '50' })

      // Assert
      expect(typeof result.radius).toBe('number')
    })

    it('converts verifiedOnly string "true" to boolean true', () => {
      // Act
      const result = feedQuerySchema.parse({ verifiedOnly: 'true' })

      // Assert
      expect(typeof result.verifiedOnly).toBe('boolean')
      expect(result.verifiedOnly).toBe(true)
    })

    it('converts verifiedOnly string "false" to boolean false', () => {
      // Act
      const result = feedQuerySchema.parse({ verifiedOnly: 'false' })

      // Assert
      expect(typeof result.verifiedOnly).toBe('boolean')
      expect(result.verifiedOnly).toBe(false)
    })

    it('converts any non-"true" verifiedOnly value to false', () => {
      // Act
      const result = feedQuerySchema.parse({ verifiedOnly: 'anything' })

      // Assert
      expect(result.verifiedOnly).toBe(false)
    })

    it('converts categoryIds string to array', () => {
      // Act
      const result = feedQuerySchema.parse({ categoryIds: 'a,b,c' })

      // Assert
      expect(Array.isArray(result.categoryIds)).toBe(true)
    })

    it('converts tags string to array', () => {
      // Act
      const result = feedQuerySchema.parse({ tags: 'x,y,z' })

      // Assert
      expect(Array.isArray(result.tags)).toBe(true)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('returns undefined categoryIds for empty string', () => {
      // Act
      const result = feedQuerySchema.parse({ categoryIds: '' })

      // Assert
      expect(result.categoryIds).toBeUndefined()
    })

    it('returns undefined tags for empty string', () => {
      // Act
      const result = feedQuerySchema.parse({ tags: '' })

      // Assert
      expect(result.tags).toBeUndefined()
    })

    it('filters empty strings from categoryIds', () => {
      // Act
      const result = feedQuerySchema.parse({ categoryIds: 'cat-1,,cat-2,' })

      // Assert
      expect(result.categoryIds).toEqual(['cat-1', 'cat-2'])
    })

    it('filters empty strings from tags', () => {
      // Act
      const result = feedQuerySchema.parse({ tags: 'tag-1,,tag-2,' })

      // Assert
      expect(result.tags).toEqual(['tag-1', 'tag-2'])
    })

    it('handles negative latitude at boundary (-90)', () => {
      // Act
      const result = feedQuerySchema.parse({ lat: '-90' })

      // Assert
      expect(result.lat).toBe(-90)
    })

    it('handles positive latitude at boundary (90)', () => {
      // Act
      const result = feedQuerySchema.parse({ lat: '90' })

      // Assert
      expect(result.lat).toBe(90)
    })

    it('handles negative longitude at boundary (-180)', () => {
      // Act
      const result = feedQuerySchema.parse({ lng: '-180' })

      // Assert
      expect(result.lng).toBe(-180)
    })

    it('handles positive longitude at boundary (180)', () => {
      // Act
      const result = feedQuerySchema.parse({ lng: '180' })

      // Assert
      expect(result.lng).toBe(180)
    })

    it('handles decimal coordinates', () => {
      // Act
      const result = feedQuerySchema.parse({ lat: '52.229676', lng: '21.012229' })

      // Assert
      expect(result.lat).toBe(52.229676)
      expect(result.lng).toBe(21.012229)
    })

    it('handles missing optional parameters', () => {
      // Act
      const result = feedQuerySchema.parse({})

      // Assert
      expect(result.categoryIds).toBeUndefined()
      expect(result.tags).toBeUndefined()
      expect(result.lat).toBeUndefined()
      expect(result.lng).toBeUndefined()
      expect(result.radius).toBeUndefined()
    })

    it('handles whitespace in categoryIds', () => {
      // Note: This tests current behavior - whitespace is preserved
      const result = feedQuerySchema.parse({ categoryIds: ' cat-1 , cat-2 ' })

      expect(result.categoryIds).toEqual([' cat-1 ', ' cat-2 '])
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('throws for page=0', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ page: '0' })).toThrow()
    })

    it('throws for negative page', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ page: '-1' })).toThrow()
    })

    it('throws for non-integer page', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ page: '1.5' })).toThrow()
    })

    it('throws for limit=0', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ limit: '0' })).toThrow()
    })

    it('throws for limit exceeding 50', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ limit: '51' })).toThrow()
    })

    it('throws for negative limit', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ limit: '-1' })).toThrow()
    })

    it('throws for non-integer limit', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ limit: '10.5' })).toThrow()
    })

    it('throws for invalid sort value', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ sort: 'invalid' })).toThrow()
    })

    it('throws for latitude below -90', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lat: '-91' })).toThrow()
    })

    it('throws for latitude above 90', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lat: '91' })).toThrow()
    })

    it('throws for longitude below -180', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lng: '-181' })).toThrow()
    })

    it('throws for longitude above 180', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lng: '181' })).toThrow()
    })

    it('throws for radius below 1', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ radius: '0' })).toThrow()
    })

    it('throws for radius above 100', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ radius: '101' })).toThrow()
    })

    it('throws for negative radius', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ radius: '-10' })).toThrow()
    })

    it('throws for non-numeric lat', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lat: 'abc' })).toThrow()
    })

    it('throws for non-numeric lng', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ lng: 'xyz' })).toThrow()
    })

    it('throws for non-numeric radius', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ radius: 'large' })).toThrow()
    })

    it('throws for non-numeric page', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ page: 'first' })).toThrow()
    })

    it('throws for non-numeric limit', () => {
      // Act & Assert
      expect(() => feedQuerySchema.parse({ limit: 'many' })).toThrow()
    })
  })

  // ===========================================================================
  // TYPE INFERENCE
  // ===========================================================================

  describe('Type Inference', () => {
    it('produces correct FeedQueryParams type', () => {
      // Act
      const result: FeedQueryParams = feedQuerySchema.parse({
        page: '1',
        limit: '20',
        sort: 'newest',
      })

      // Assert - TypeScript compilation ensures correct types
      const page: number = result.page
      const limit: number = result.limit
      const sort: 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following' = result.sort

      expect(page).toBe(1)
      expect(limit).toBe(20)
      expect(sort).toBe('newest')
    })
  })
})
