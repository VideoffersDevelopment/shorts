import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockPrisma, mockHaversineDistance } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRawUnsafe: vi.fn(),
  },
  mockHaversineDistance: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/utils/haversine', () => ({
  haversineDistance: mockHaversineDistance,
}))

// Import AFTER mocks are set up
import { GET } from '../route'
import type { SearchResponse, FeedShort, CompanyResult } from '@/lib/types/feed'

// =============================================================================
// TEST DATA
// =============================================================================

interface RawShortRow {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: Date
  latitude: number | null
  longitude: number | null
  ctaLink: string | null
  views: number | null
  likes: number | null
  ctaClicks: number | null
  companyId: string
  companyName: string
  companySlug: string
  companyLogo: string | null
  companyVerified: boolean
  city: string | null
  categoryId: string
  categoryName: string
  categorySlug: string
  rank: number
}

interface RawCompanyRow {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: bigint
  rank: number
}

const createMockShortRow = (overrides: Partial<RawShortRow> = {}): RawShortRow => ({
  id: 'short-1',
  title: 'Test Short',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  hlsPlaylistUrl: 'https://cdn.example.com/playlist.m3u8',
  duration: 30,
  publishedAt: new Date('2025-12-15T10:00:00Z'),
  latitude: 52.2297,
  longitude: 21.0122,
  ctaLink: 'https://example.com/cta',
  views: 100,
  likes: 10,
  ctaClicks: 5,
  companyId: 'company-1',
  companyName: 'Test Company',
  companySlug: 'test-company',
  companyLogo: 'https://cdn.example.com/logo.jpg',
  companyVerified: true,
  city: 'Warsaw',
  categoryId: 'cat-1',
  categoryName: 'Technology',
  categorySlug: 'technology',
  rank: 0.8,
  ...overrides,
})

const createMockCompanyRow = (overrides: Partial<RawCompanyRow> = {}): RawCompanyRow => ({
  id: 'company-1',
  name: 'Test Company',
  slug: 'test-company',
  logo: 'https://cdn.example.com/logo.jpg',
  verified: true,
  category: 'Technology',
  shortsCount: BigInt(10),
  rank: 0.7,
  ...overrides,
})

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: return empty count and empty results
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }])
    mockHaversineDistance.mockReturnValue(10)
  })

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================

  const mockShortsQuery = (shorts: RawShortRow[], total: number = shorts.length) => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(total) }]) // Shorts count
      .mockResolvedValueOnce(shorts) // Shorts results
  }

  const mockCompaniesQuery = (companies: RawCompanyRow[], total: number = companies.length) => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(total) }]) // Companies count
      .mockResolvedValueOnce(companies) // Companies results
  }

  const mockAllQueries = (
    shorts: RawShortRow[],
    companies: RawCompanyRow[],
    shortsTotal: number = shorts.length,
    companiesTotal: number = companies.length
  ) => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(shortsTotal) }]) // Shorts count
      .mockResolvedValueOnce(shorts) // Shorts results
      .mockResolvedValueOnce([{ count: BigInt(companiesTotal) }]) // Companies count
      .mockResolvedValueOnce(companies) // Companies results
  }

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns search results with default params', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      const mockCompanies = [createMockCompanyRow()]
      mockAllQueries(mockShorts, mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(2)
      expect(data.query).toBe('test')
      expect(data.totalCount).toBe(2) // type=all returns results.length
      expect(data.nextPage).toBeNull()
    })

    it('returns correctly structured short results', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortResult = data.results.find(r => r.type === 'short')
      expect(shortResult).toBeDefined()
      expect(shortResult!.type).toBe('short')
      expect(shortResult!.rank).toBe(0.8)

      const shortData = shortResult!.data as FeedShort
      expect(shortData).toMatchObject({
        id: 'short-1',
        title: 'Test Short',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        views: 100,
        likes: 10,
        company: {
          id: 'company-1',
          name: 'Test Company',
          slug: 'test-company',
          verified: true,
        },
        category: {
          id: 'cat-1',
          name: 'Technology',
          slug: 'technology',
        },
      })
    })

    it('returns correctly structured company results', async () => {
      // Arrange
      const mockCompanies = [createMockCompanyRow()]
      mockAllQueries([], mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const companyResult = data.results.find(r => r.type === 'company')
      expect(companyResult).toBeDefined()
      expect(companyResult!.type).toBe('company')
      expect(companyResult!.rank).toBe(0.7)

      const companyData = companyResult!.data as CompanyResult
      expect(companyData).toMatchObject({
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
        logo: 'https://cdn.example.com/logo.jpg',
        verified: true,
        category: 'Technology',
        shortsCount: 10,
      })
    })

    it('sorts results by rank descending', async () => {
      // Arrange
      const mockShorts = [
        createMockShortRow({ id: 'short-1', rank: 0.5 }),
        createMockShortRow({ id: 'short-2', rank: 0.9 }),
      ]
      const mockCompanies = [
        createMockCompanyRow({ id: 'company-1', rank: 0.7 }),
      ]
      mockAllQueries(mockShorts, mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results[0].rank).toBe(0.9)
      expect(data.results[1].rank).toBe(0.7)
      expect(data.results[2].rank).toBe(0.5)
    })
  })

  // ===========================================================================
  // TYPE FILTERING
  // ===========================================================================

  describe('Type Filtering', () => {
    it('returns only shorts when type=shorts', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockShortsQuery(mockShorts, 1)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(data.results.every(r => r.type === 'short')).toBe(true)
      expect(data.totalCount).toBe(1)
    })

    it('returns only companies when type=companies', async () => {
      // Arrange
      const mockCompanies = [createMockCompanyRow()]
      mockCompaniesQuery(mockCompanies, 1)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=companies')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(data.results.every(r => r.type === 'company')).toBe(true)
      expect(data.totalCount).toBe(1)
    })

    it('returns both shorts and companies when type=all', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      const mockCompanies = [createMockCompanyRow()]
      mockAllQueries(mockShorts, mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=all')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results.some(r => r.type === 'short')).toBe(true)
      expect(data.results.some(r => r.type === 'company')).toBe(true)
    })

    it('defaults to type=all when type not specified', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      const mockCompanies = [createMockCompanyRow()]
      mockAllQueries(mockShorts, mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(2)
    })
  })

  // ===========================================================================
  // PAGINATION
  // ===========================================================================

  describe('Pagination', () => {
    it('returns correct pagination for first page with more results', async () => {
      // Arrange
      const mockShorts = Array(10).fill(null).map((_, i) =>
        createMockShortRow({ id: `short-${i}` })
      )
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(50) }]) // Total count
        .mockResolvedValueOnce(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts&page=1&limit=10')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(10)
      expect(data.totalCount).toBe(50)
      expect(data.nextPage).toBe(2)
    })

    it('returns null nextPage when on last page', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(5) }])
        .mockResolvedValueOnce(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts&page=1&limit=10')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.nextPage).toBeNull()
    })

    it('returns null nextPage when exactly at limit', async () => {
      // Arrange
      const mockShorts = Array(10).fill(null).map((_, i) =>
        createMockShortRow({ id: `short-${i}` })
      )
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(10) }])
        .mockResolvedValueOnce(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts&page=1&limit=10')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.nextPage).toBeNull()
    })

    it('uses correct offset for page 2', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(50) }])
        .mockResolvedValueOnce([])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts&page=2&limit=20')

      // Act
      await GET(req)

      // Assert - Verify the second call (search query) includes offset 20
      const searchQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[1]
      expect(searchQueryCall).toBeDefined()
      // The offset should be (page-1) * limit = 1 * 20 = 20
      const params = searchQueryCall.slice(1)
      expect(params).toContain(20) // offset value
    })

    it('respects custom limit parameter', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(100) }])
        .mockResolvedValueOnce([])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts&limit=50')

      // Act
      await GET(req)

      // Assert - Verify limit is passed
      const searchQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[1]
      const params = searchQueryCall.slice(1)
      expect(params).toContain(50) // limit value
    })

    it('uses half limit for each type when type=all', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=all&limit=20')

      // Act
      await GET(req)

      // Assert - Should use limit/2 = 10 for each type
      const shortsSearchCall = mockPrisma.$queryRawUnsafe.mock.calls[1]
      const shortsParams = shortsSearchCall.slice(1)
      expect(shortsParams).toContain(10) // limit/2
    })
  })

  // ===========================================================================
  // CATEGORY FILTERING
  // ===========================================================================

  describe('Category Filtering', () => {
    it('filters by single category', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&categoryIds=cat-1')

      // Act
      await GET(req)

      // Assert - Verify categoryIds are passed to query
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countParams = countQueryCall.slice(1)
      expect(countParams).toContainEqual(['cat-1'])
    })

    it('filters by multiple categories', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&categoryIds=cat-1,cat-2,cat-3')

      // Act
      await GET(req)

      // Assert
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countParams = countQueryCall.slice(1)
      expect(countParams).toContainEqual(['cat-1', 'cat-2', 'cat-3'])
    })
  })

  // ===========================================================================
  // LOCATION FILTERING
  // ===========================================================================

  describe('Location Filtering', () => {
    it('applies location filter when lat, lng, and radius provided', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52.2297&lng=21.0122&radius=10')

      // Act
      await GET(req)

      // Assert - Verify bounding box parameters are calculated and passed
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countQuery = countQueryCall[0] as string
      expect(countQuery).toContain('latitude BETWEEN')
      expect(countQuery).toContain('longitude BETWEEN')
    })

    it('calculates distance using haversineDistance when location provided', async () => {
      // Arrange
      const mockShorts = [createMockShortRow({ latitude: 52.4, longitude: 21.1 })]
      mockAllQueries(mockShorts, [])
      mockHaversineDistance.mockReturnValue(15.5)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52.2297&lng=21.0122')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(mockHaversineDistance).toHaveBeenCalledWith(
        { lat: 52.2297, lng: 21.0122 },
        { lat: 52.4, lng: 21.1 }
      )
      const shortData = data.results[0].data as FeedShort
      expect(shortData.distance).toBe(15.5)
    })

    it('returns null distance when short has no coordinates', async () => {
      // Arrange
      const mockShorts = [createMockShortRow({ latitude: null, longitude: null })]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52.2297&lng=21.0122')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.distance).toBeNull()
    })

    it('returns null distance when user location not provided', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.distance).toBeNull()
    })

    it('does not apply location filter when only lat is provided', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52.2297')

      // Act
      await GET(req)

      // Assert - Location filter not applied without all params
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countQuery = countQueryCall[0] as string
      expect(countQuery).not.toContain('latitude BETWEEN')
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns 400 when query is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when query is too short (< 2 chars)', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=a')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when query is empty', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when type is invalid', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=invalid')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when page is 0', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&page=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when page is negative', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&page=-1')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when limit exceeds 100', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&limit=101')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when limit is 0', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&limit=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lat is below -90', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=-91&lng=21')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lat is above 90', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=91&lng=21')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lng is below -180', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52&lng=-181')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lng is above 180', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52&lng=181')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when radius is below 1', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52&lng=21&radius=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when radius exceeds 100', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52&lng=21&radius=101')

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
    it('returns 500 when shorts count query fails', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Database connection failed'))

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when shorts search query fails', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(10) }])
        .mockRejectedValueOnce(new Error('Query timeout'))

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when companies count query fails', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(0) }]) // Shorts count
        .mockResolvedValueOnce([]) // Shorts results
        .mockRejectedValueOnce(new Error('Database error')) // Companies count

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when companies search query fails', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(10) }])
        .mockRejectedValueOnce(new Error('Query error'))

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('returns empty results when no matches found', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=nonexistent')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.results).toEqual([])
      expect(data.totalCount).toBe(0)
      expect(data.nextPage).toBeNull()
    })

    it('handles query with exactly 2 characters', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=ab')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles unicode queries', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=zdrowie')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles special characters in query', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test%26query')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.query).toBe('test&query')
    })

    it('handles short with null stats', async () => {
      // Arrange
      const mockShorts = [createMockShortRow({
        views: null,
        likes: null,
        ctaClicks: null,
      })]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.views).toBe(0)
      expect(shortData.likes).toBe(0)
      expect(shortData.ctaClicks).toBe(0)
    })

    it('handles company with null category', async () => {
      // Arrange
      const mockCompanies = [createMockCompanyRow({ category: null })]
      mockAllQueries([], mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const companyData = data.results[0].data as CompanyResult
      expect(companyData.category).toBeNull()
    })

    it('handles company with null logo', async () => {
      // Arrange
      const mockCompanies = [createMockCompanyRow({ logo: null })]
      mockAllQueries([], mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const companyData = data.results[0].data as CompanyResult
      expect(companyData.logo).toBeNull()
    })

    it('converts BigInt shortsCount to number', async () => {
      // Arrange
      const mockCompanies = [createMockCompanyRow({ shortsCount: BigInt(999) })]
      mockAllQueries([], mockCompanies)

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const companyData = data.results[0].data as CompanyResult
      expect(companyData.shortsCount).toBe(999)
      expect(typeof companyData.shortsCount).toBe('number')
    })

    it('rounds distance to 1 decimal place', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockAllQueries(mockShorts, [])
      mockHaversineDistance.mockReturnValue(15.5678)

      const req = new NextRequest('http://localhost:3000/api/search?q=test&lat=52&lng=21')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.distance).toBe(15.6)
    })

    it('uses company city as location', async () => {
      // Arrange
      const mockShorts = [createMockShortRow({ city: 'Krakow' })]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.location).toBe('Krakow')
    })

    it('handles empty count result gracefully', async () => {
      // Arrange
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([]) // Empty count result
        .mockResolvedValueOnce([])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&type=shorts')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.totalCount).toBe(0)
    })

    it('formats publishedAt as ISO string', async () => {
      // Arrange
      const mockShorts = [createMockShortRow({
        publishedAt: new Date('2025-12-25T12:00:00.000Z'),
      })]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      const shortData = data.results[0].data as FeedShort
      expect(shortData.publishedAt).toBe('2025-12-25T12:00:00.000Z')
    })

    it('handles very long query string', async () => {
      // Arrange
      const longQuery = 'a'.repeat(200)
      mockAllQueries([], [])

      const req = new NextRequest(`http://localhost:3000/api/search?q=${longQuery}`)

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.query).toBe(longQuery)
    })

    it('handles empty categoryIds string', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test&categoryIds=')

      // Act
      const response = await GET(req)

      // Assert - Should not fail, categoryIds becomes undefined
      expect(response.status).toBe(200)
    })
  })

  // ===========================================================================
  // RESPONSE STRUCTURE
  // ===========================================================================

  describe('Response Structure', () => {
    it('returns correctly structured SearchResponse', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(data).toHaveProperty('results')
      expect(data).toHaveProperty('totalCount')
      expect(data).toHaveProperty('nextPage')
      expect(data).toHaveProperty('query')
      expect(Array.isArray(data.results)).toBe(true)
      expect(typeof data.totalCount).toBe('number')
    })

    it('returns search results with type and rank fields', async () => {
      // Arrange
      const mockShorts = [createMockShortRow()]
      mockAllQueries(mockShorts, [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)
      const data: SearchResponse = await response.json()

      // Assert
      expect(data.results[0]).toHaveProperty('type')
      expect(data.results[0]).toHaveProperty('data')
      expect(data.results[0]).toHaveProperty('rank')
    })

    it('returns correct JSON content type', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  // ===========================================================================
  // SQL QUERY CONSTRUCTION
  // ===========================================================================

  describe('SQL Query Construction', () => {
    it('builds query with full-text search condition', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=coffee')

      // Act
      await GET(req)

      // Assert
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countQuery = countQueryCall[0] as string
      expect(countQuery).toContain('to_tsvector')
      expect(countQuery).toContain('plainto_tsquery')
      expect(countQuery).toContain('%') // trigram similarity
    })

    it('builds query with PUBLISHED status filter', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=test')

      // Act
      await GET(req)

      // Assert
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const countQuery = countQueryCall[0] as string
      expect(countQuery).toContain("s.status = 'PUBLISHED'")
    })

    it('passes query parameter to SQL queries', async () => {
      // Arrange
      mockAllQueries([], [])

      const req = new NextRequest('http://localhost:3000/api/search?q=searchterm')

      // Act
      await GET(req)

      // Assert
      const countQueryCall = mockPrisma.$queryRawUnsafe.mock.calls[0]
      const params = countQueryCall.slice(1)
      expect(params).toContain('searchterm')
    })
  })
})
