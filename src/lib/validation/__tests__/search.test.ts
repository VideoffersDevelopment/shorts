import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import { searchQuerySchema, suggestionsQuerySchema } from '../search'
import type { SearchQueryParams, SuggestionsQueryParams } from '../search'

describe('Search Validation Schemas', () => {
  // ===========================================================================
  // searchQuerySchema
  // ===========================================================================

  describe('searchQuerySchema', () => {
    // =========================================================================
    // HAPPY PATH
    // =========================================================================

    describe('Happy Path', () => {
      it('parses valid search query with all defaults', () => {
        // Arrange
        const input = { q: 'test query' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result).toEqual({
          q: 'test query',
          type: 'all',
          page: 1,
          limit: 20,
          categoryIds: undefined,
          lat: undefined,
          lng: undefined,
          radius: undefined,
        })
      })

      it('parses valid search query with all parameters', () => {
        // Arrange
        const input = {
          q: 'test query',
          type: 'shorts',
          page: '2',
          limit: '50',
          categoryIds: 'cat-1,cat-2,cat-3',
          lat: '52.2297',
          lng: '21.0122',
          radius: '25',
        }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result).toEqual({
          q: 'test query',
          type: 'shorts',
          page: 2,
          limit: 50,
          categoryIds: ['cat-1', 'cat-2', 'cat-3'],
          lat: 52.2297,
          lng: 21.0122,
          radius: 25,
        })
      })

      it('parses type=all correctly', () => {
        // Arrange
        const input = { q: 'test', type: 'all' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.type).toBe('all')
      })

      it('parses type=shorts correctly', () => {
        // Arrange
        const input = { q: 'test', type: 'shorts' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.type).toBe('shorts')
      })

      it('parses type=companies correctly', () => {
        // Arrange
        const input = { q: 'test', type: 'companies' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.type).toBe('companies')
      })

      it('coerces string numbers to numbers for page and limit', () => {
        // Arrange
        const input = { q: 'test', page: '5', limit: '30' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.page).toBe(5)
        expect(typeof result.page).toBe('number')
        expect(result.limit).toBe(30)
        expect(typeof result.limit).toBe('number')
      })

      it('coerces location strings to numbers', () => {
        // Arrange
        const input = { q: 'test', lat: '52.2297', lng: '21.0122', radius: '10' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lat).toBe(52.2297)
        expect(typeof result.lat).toBe('number')
        expect(result.lng).toBe(21.0122)
        expect(typeof result.lng).toBe('number')
        expect(result.radius).toBe(10)
        expect(typeof result.radius).toBe('number')
      })

      it('parses single categoryId correctly', () => {
        // Arrange
        const input = { q: 'test', categoryIds: 'cat-1' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.categoryIds).toEqual(['cat-1'])
      })

      it('filters empty strings from categoryIds', () => {
        // Arrange
        const input = { q: 'test', categoryIds: 'cat-1,,cat-2,' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.categoryIds).toEqual(['cat-1', 'cat-2'])
      })

      it('handles undefined categoryIds correctly', () => {
        // Arrange
        const input = { q: 'test' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.categoryIds).toBeUndefined()
      })

      it('handles empty categoryIds string correctly', () => {
        // Arrange
        const input = { q: 'test', categoryIds: '' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.categoryIds).toBeUndefined()
      })

      it('accepts minimum valid lat value -90', () => {
        // Arrange
        const input = { q: 'test', lat: '-90', lng: '0' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lat).toBe(-90)
      })

      it('accepts maximum valid lat value 90', () => {
        // Arrange
        const input = { q: 'test', lat: '90', lng: '0' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lat).toBe(90)
      })

      it('accepts minimum valid lng value -180', () => {
        // Arrange
        const input = { q: 'test', lat: '0', lng: '-180' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lng).toBe(-180)
      })

      it('accepts maximum valid lng value 180', () => {
        // Arrange
        const input = { q: 'test', lat: '0', lng: '180' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lng).toBe(180)
      })

      it('accepts minimum valid radius value 1', () => {
        // Arrange
        const input = { q: 'test', radius: '1' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.radius).toBe(1)
      })

      it('accepts maximum valid radius value 100', () => {
        // Arrange
        const input = { q: 'test', radius: '100' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.radius).toBe(100)
      })

      it('accepts limit of 100 (max)', () => {
        // Arrange
        const input = { q: 'test', limit: '100' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.limit).toBe(100)
      })

      it('accepts limit of 1 (min)', () => {
        // Arrange
        const input = { q: 'test', limit: '1' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.limit).toBe(1)
      })
    })

    // =========================================================================
    // VALIDATION FAILURES
    // =========================================================================

    describe('Validation Failures', () => {
      it('rejects missing query parameter', () => {
        // Arrange
        const input = {}

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects query shorter than 2 characters', () => {
        // Arrange
        const input = { q: 'a' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
        try {
          searchQuerySchema.parse(input)
        } catch (error) {
          expect((error as ZodError).errors[0].message).toBe('Query must be at least 2 characters')
        }
      })

      it('rejects empty query string', () => {
        // Arrange
        const input = { q: '' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects invalid type value', () => {
        // Arrange
        const input = { q: 'test', type: 'invalid' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects page value of 0', () => {
        // Arrange
        const input = { q: 'test', page: '0' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects negative page value', () => {
        // Arrange
        const input = { q: 'test', page: '-1' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects non-integer page value', () => {
        // Arrange
        const input = { q: 'test', page: '1.5' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects limit value of 0', () => {
        // Arrange
        const input = { q: 'test', limit: '0' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects limit value exceeding 100', () => {
        // Arrange
        const input = { q: 'test', limit: '101' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects negative limit value', () => {
        // Arrange
        const input = { q: 'test', limit: '-10' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects lat below -90', () => {
        // Arrange
        const input = { q: 'test', lat: '-91', lng: '0' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects lat above 90', () => {
        // Arrange
        const input = { q: 'test', lat: '91', lng: '0' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects lng below -180', () => {
        // Arrange
        const input = { q: 'test', lat: '0', lng: '-181' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects lng above 180', () => {
        // Arrange
        const input = { q: 'test', lat: '0', lng: '181' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects radius below 1', () => {
        // Arrange
        const input = { q: 'test', radius: '0' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects radius above 100', () => {
        // Arrange
        const input = { q: 'test', radius: '101' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects negative radius value', () => {
        // Arrange
        const input = { q: 'test', radius: '-10' }

        // Act & Assert
        expect(() => searchQuerySchema.parse(input)).toThrow(ZodError)
      })
    })

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('Edge Cases', () => {
      it('handles query with exactly 2 characters', () => {
        // Arrange
        const input = { q: 'ab' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('ab')
      })

      it('handles query with unicode characters', () => {
        // Arrange
        const input = { q: 'zdrowie' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('zdrowie')
      })

      it('handles query with special characters', () => {
        // Arrange
        const input = { q: 'test & query' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('test & query')
      })

      it('handles query with whitespace', () => {
        // Arrange
        const input = { q: '  test  query  ' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('  test  query  ')
      })

      it('handles floating point lat/lng values', () => {
        // Arrange
        const input = { q: 'test', lat: '52.229676', lng: '21.012229' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.lat).toBe(52.229676)
        expect(result.lng).toBe(21.012229)
      })

      it('handles decimal radius values', () => {
        // Arrange
        const input = { q: 'test', radius: '15.5' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.radius).toBe(15.5)
      })

      it('handles very long query string', () => {
        // Arrange
        const longQuery = 'a'.repeat(1000)
        const input = { q: longQuery }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe(longQuery)
        expect(result.q.length).toBe(1000)
      })

      it('handles categoryIds with extra commas', () => {
        // Arrange
        const input = { q: 'test', categoryIds: ',,cat-1,,cat-2,,' }

        // Act
        const result = searchQuerySchema.parse(input)

        // Assert
        expect(result.categoryIds).toEqual(['cat-1', 'cat-2'])
      })
    })

    // =========================================================================
    // TYPE INFERENCE
    // =========================================================================

    describe('Type Inference', () => {
      it('infers correct TypeScript type', () => {
        // Arrange
        const input = {
          q: 'test',
          type: 'shorts' as const,
          page: '1',
          limit: '20',
        }

        // Act
        const result: SearchQueryParams = searchQuerySchema.parse(input)

        // Assert - TypeScript compilation is the test
        expect(result.q).toBe('test')
        expect(result.type).toBe('shorts')
        expect(result.page).toBe(1)
        expect(result.limit).toBe(20)
      })
    })
  })

  // ===========================================================================
  // suggestionsQuerySchema
  // ===========================================================================

  describe('suggestionsQuerySchema', () => {
    // =========================================================================
    // HAPPY PATH
    // =========================================================================

    describe('Happy Path', () => {
      it('parses valid single character query', () => {
        // Arrange
        const input = { q: 't' }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result).toEqual({ q: 't' })
      })

      it('parses valid multi-character query', () => {
        // Arrange
        const input = { q: 'test query' }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result).toEqual({ q: 'test query' })
      })

      it('handles query with unicode characters', () => {
        // Arrange
        const input = { q: 'zdrowie' }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('zdrowie')
      })

      it('handles query with special characters', () => {
        // Arrange
        const input = { q: 'a&b' }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('a&b')
      })
    })

    // =========================================================================
    // VALIDATION FAILURES
    // =========================================================================

    describe('Validation Failures', () => {
      it('rejects missing query parameter', () => {
        // Arrange
        const input = {}

        // Act & Assert
        expect(() => suggestionsQuerySchema.parse(input)).toThrow(ZodError)
      })

      it('rejects empty query string', () => {
        // Arrange
        const input = { q: '' }

        // Act & Assert
        expect(() => suggestionsQuerySchema.parse(input)).toThrow(ZodError)
        try {
          suggestionsQuerySchema.parse(input)
        } catch (error) {
          expect((error as ZodError).errors[0].message).toBe('Query must be at least 1 character')
        }
      })
    })

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('Edge Cases', () => {
      it('handles whitespace-only query', () => {
        // Arrange - single space is valid (length >= 1)
        const input = { q: ' ' }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe(' ')
      })

      it('handles very long query string', () => {
        // Arrange
        const longQuery = 'a'.repeat(500)
        const input = { q: longQuery }

        // Act
        const result = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe(longQuery)
      })
    })

    // =========================================================================
    // TYPE INFERENCE
    // =========================================================================

    describe('Type Inference', () => {
      it('infers correct TypeScript type', () => {
        // Arrange
        const input = { q: 'test' }

        // Act
        const result: SuggestionsQueryParams = suggestionsQuerySchema.parse(input)

        // Assert
        expect(result.q).toBe('test')
      })
    })
  })
})
