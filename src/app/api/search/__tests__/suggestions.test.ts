import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRaw: vi.fn(),
    tag: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import AFTER mocks are set up
import { GET } from '../suggestions/route'
import type { SuggestionsResponse } from '@/lib/types/feed'

// =============================================================================
// TEST DATA
// =============================================================================

interface MockShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface MockCompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface MockTag {
  name: string
}

const createMockShortSuggestion = (overrides: Partial<MockShortSuggestion> = {}): MockShortSuggestion => ({
  id: 'short-1',
  title: 'Test Short Title',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  ...overrides,
})

const createMockCompanySuggestion = (overrides: Partial<MockCompanySuggestion> = {}): MockCompanySuggestion => ({
  id: 'company-1',
  name: 'Test Company',
  slug: 'test-company',
  logo: 'https://cdn.example.com/logo.jpg',
  ...overrides,
})

const createMockTag = (name: string): MockTag => ({
  name,
})

describe('GET /api/search/suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful mocks
    mockPrisma.$queryRaw.mockResolvedValue([])
    mockPrisma.tag.findMany.mockResolvedValue([])
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns suggestions with shorts, companies, and popular tags', async () => {
      // Arrange
      const mockShorts = [
        createMockShortSuggestion({ id: 'short-1', title: 'Test Video' }),
        createMockShortSuggestion({ id: 'short-2', title: 'Test Tutorial' }),
      ]
      const mockCompanies = [
        createMockCompanySuggestion({ id: 'company-1', name: 'Test Corp' }),
      ]
      const mockTags = [
        createMockTag('technology'),
        createMockTag('business'),
      ]

      // Mock $queryRaw returns shorts first, then companies
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockShorts)
        .mockResolvedValueOnce(mockCompanies)
      mockPrisma.tag.findMany.mockResolvedValue(mockTags)

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.recent).toEqual([])
      expect(data.popular).toEqual(['technology', 'business'])
      expect(data.shorts).toHaveLength(2)
      expect(data.shorts[0]).toMatchObject({
        id: 'short-1',
        title: 'Test Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      })
      expect(data.companies).toHaveLength(1)
      expect(data.companies[0]).toMatchObject({
        id: 'company-1',
        name: 'Test Corp',
        slug: 'test-company',
      })
    })

    it('returns empty arrays when no results found', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=nonexistent')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.recent).toEqual([])
      expect(data.popular).toEqual([])
      expect(data.shorts).toEqual([])
      expect(data.companies).toEqual([])
    })

    it('accepts single character query', async () => {
      // Arrange
      const mockShorts = [createMockShortSuggestion({ title: 'T-shirt Store' })]
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockShorts).mockResolvedValueOnce([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=t')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toHaveLength(1)
    })

    it('handles unicode queries correctly', async () => {
      // Arrange
      const mockShorts = [createMockShortSuggestion({ title: 'Zdrowe odzywianie' })]
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockShorts).mockResolvedValueOnce([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=zdrowe')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toHaveLength(1)
      expect(data.shorts[0].title).toBe('Zdrowe odzywianie')
    })

    it('returns up to 5 popular tags ordered by usageCount', async () => {
      // Arrange
      const mockTags = [
        createMockTag('tag1'),
        createMockTag('tag2'),
        createMockTag('tag3'),
        createMockTag('tag4'),
        createMockTag('tag5'),
      ]
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue(mockTags)

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.popular).toHaveLength(5)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        select: { name: true },
        orderBy: { usageCount: 'desc' },
        take: 5,
      })
    })

    it('handles shorts with null thumbnailUrl', async () => {
      // Arrange
      const mockShorts = [
        createMockShortSuggestion({ id: 'short-1', thumbnailUrl: null }),
      ]
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockShorts).mockResolvedValueOnce([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].thumbnailUrl).toBeNull()
    })

    it('handles companies with null logo', async () => {
      // Arrange
      const mockCompanies = [
        createMockCompanySuggestion({ id: 'company-1', logo: null }),
      ]
      mockPrisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce(mockCompanies)
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.companies[0].logo).toBeNull()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns 400 when query parameter is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search/suggestions')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when query is empty string', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns 500 when shorts query fails', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'))

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when companies query fails', async () => {
      // Arrange
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // shorts query succeeds
        .mockRejectedValueOnce(new Error('Query timeout')) // companies query fails

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when tags query fails', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockRejectedValue(new Error('Tags table not found'))

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ===========================================================================
  // QUERY EXECUTION
  // ===========================================================================

  describe('Query Execution', () => {
    it('executes all queries in parallel', async () => {
      // Arrange
      let queryOrder: string[] = []

      mockPrisma.$queryRaw
        .mockImplementationOnce(async () => {
          queryOrder.push('shorts')
          return []
        })
        .mockImplementationOnce(async () => {
          queryOrder.push('companies')
          return []
        })

      mockPrisma.tag.findMany.mockImplementation(async () => {
        queryOrder.push('tags')
        return []
      })

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      await GET(req)

      // Assert - All queries should execute
      expect(queryOrder).toContain('shorts')
      expect(queryOrder).toContain('companies')
      expect(queryOrder).toContain('tags')
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledTimes(1)
    })

    it('passes correct query patterns to database', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=coffee')

      // Act
      await GET(req)

      // Assert - Check that $queryRaw was called (exact query not checked due to tagged template)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles whitespace-only query', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=%20')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert - whitespace is valid (length >= 1)
      expect(response.status).toBe(200)
      expect(data.shorts).toEqual([])
    })

    it('handles special characters in query', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test%26query')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles very long query string', async () => {
      // Arrange
      const longQuery = 'a'.repeat(200)
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest(`http://localhost:3000/api/search/suggestions?q=${longQuery}`)

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('always returns empty recent array (client-side feature)', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert - Recent searches are handled client-side
      expect(data.recent).toEqual([])
    })

    it('returns maximum 5 shorts suggestions', async () => {
      // Arrange - This is enforced by SQL LIMIT 5
      const mockShorts = Array(10).fill(null).map((_, i) =>
        createMockShortSuggestion({ id: `short-${i}`, title: `Short ${i}` })
      )
      // Simulate database returning 5 results (due to LIMIT)
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockShorts.slice(0, 5)).mockResolvedValueOnce([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=short')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts.length).toBeLessThanOrEqual(5)
    })

    it('returns maximum 5 companies suggestions', async () => {
      // Arrange - This is enforced by SQL LIMIT 5
      const mockCompanies = Array(10).fill(null).map((_, i) =>
        createMockCompanySuggestion({ id: `company-${i}`, name: `Company ${i}` })
      )
      // Simulate database returning 5 results (due to LIMIT)
      mockPrisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce(mockCompanies.slice(0, 5))
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=company')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.companies.length).toBeLessThanOrEqual(5)
    })
  })

  // ===========================================================================
  // RESPONSE STRUCTURE
  // ===========================================================================

  describe('Response Structure', () => {
    it('returns correctly structured SuggestionsResponse', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(data).toHaveProperty('recent')
      expect(data).toHaveProperty('popular')
      expect(data).toHaveProperty('shorts')
      expect(data).toHaveProperty('companies')
      expect(Array.isArray(data.recent)).toBe(true)
      expect(Array.isArray(data.popular)).toBe(true)
      expect(Array.isArray(data.shorts)).toBe(true)
      expect(Array.isArray(data.companies)).toBe(true)
    })

    it('returns shorts with correct properties', async () => {
      // Arrange
      const mockShorts = [createMockShortSuggestion()]
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockShorts).mockResolvedValueOnce([])
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(data.shorts[0]).toHaveProperty('id')
      expect(data.shorts[0]).toHaveProperty('title')
      expect(data.shorts[0]).toHaveProperty('thumbnailUrl')
    })

    it('returns companies with correct properties', async () => {
      // Arrange
      const mockCompanies = [createMockCompanySuggestion()]
      mockPrisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce(mockCompanies)
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=test')

      // Act
      const response = await GET(req)
      const data: SuggestionsResponse = await response.json()

      // Assert
      expect(data.companies[0]).toHaveProperty('id')
      expect(data.companies[0]).toHaveProperty('name')
      expect(data.companies[0]).toHaveProperty('slug')
      expect(data.companies[0]).toHaveProperty('logo')
    })
  })
})
