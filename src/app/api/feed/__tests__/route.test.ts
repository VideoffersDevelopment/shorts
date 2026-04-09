import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockAuth, mockPrisma, mockCalculateScore, mockApplyDiversityFilter, mockHaversineDistance } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    short: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockCalculateScore: vi.fn(),
  mockApplyDiversityFilter: vi.fn(),
  mockHaversineDistance: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/utils/feed-scoring', () => ({
  calculateScore: mockCalculateScore,
  applyDiversityFilter: mockApplyDiversityFilter,
}))

vi.mock('@/lib/utils/haversine', () => ({
  haversineDistance: mockHaversineDistance,
}))

// Import AFTER mocks are set up
import { GET } from '../route'
import type { FeedResponse } from '@/lib/types/feed'

// =============================================================================
// TEST DATA
// =============================================================================

interface MockDbShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: Date
  latitude: number | null
  longitude: number | null
  ctaLink: string | null
  stats: {
    views: number
    likes: number
    ctaClicks: number
  } | null
  company: {
    id: string
    companyName: string
    slug: string
    logo: string | null
    viesVerified: boolean
    city: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
}

const createMockDbShort = (overrides: Partial<MockDbShort> = {}): MockDbShort => ({
  id: 'short-1',
  title: 'Test Short',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  hlsPlaylistUrl: 'https://cdn.example.com/playlist.m3u8',
  duration: 30,
  publishedAt: new Date('2025-12-15T10:00:00Z'),
  latitude: 52.2297,
  longitude: 21.0122,
  ctaLink: 'https://example.com/cta',
  stats: {
    views: 100,
    likes: 10,
    ctaClicks: 5,
  },
  company: {
    id: 'company-1',
    companyName: 'Test Company',
    slug: 'test-company',
    logo: 'https://cdn.example.com/logo.jpg',
    viesVerified: true,
    city: 'Warsaw',
  },
  category: {
    id: 'cat-1',
    name: 'Technology',
    slug: 'technology',
  },
  ...overrides,
})

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalculateScore.mockReturnValue(0.8)
    mockApplyDiversityFilter.mockImplementation((shorts) => shorts)
    mockHaversineDistance.mockReturnValue(10)
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns shorts array with pagination using default params', async () => {
      // Arrange
      const mockShorts = [createMockDbShort()]
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toHaveLength(1)
      expect(data.shorts[0]).toMatchObject({
        id: 'short-1',
        title: 'Test Short',
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
      expect(data.totalCount).toBe(1)
      expect(data.hasMore).toBe(false)
      expect(data.nextPage).toBeNull()
    })

    it('returns correct pagination info when hasMore is true', async () => {
      // Arrange
      const mockShorts = Array(20).fill(null).map((_, i) =>
        createMockDbShort({ id: `short-${i}` })
      )
      mockPrisma.short.count.mockResolvedValue(50)
      mockPrisma.short.findMany.mockResolvedValue(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/feed?page=1&limit=20')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.totalCount).toBe(50)
      expect(data.hasMore).toBe(true)
      expect(data.nextPage).toBe(2)
    })

    it('sorts by newest when sort=newest', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?sort=newest')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ publishedAt: 'desc' }],
        })
      )
    })

    it('sorts by popular when sort=popular', async () => {
      // Arrange
      const mockShorts = [
        createMockDbShort({ id: 'short-1', stats: { views: 100, likes: 50, ctaClicks: 10 } }),
        createMockDbShort({ id: 'short-2', stats: { views: 200, likes: 10, ctaClicks: 5 } }),
      ]
      mockPrisma.short.count.mockResolvedValue(2)
      mockPrisma.short.findMany.mockResolvedValue(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/feed?sort=popular')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // Popular sort: views + likes*2. short-1: 100 + 100 = 200. short-2: 200 + 20 = 220
      expect(data.shorts[0].id).toBe('short-2')
    })

    it('sorts by trending when sort=trending', async () => {
      // Arrange
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockShorts = [
        createMockDbShort({
          id: 'short-old',
          publishedAt: oneDayAgo,
          stats: { views: 100, likes: 50, ctaClicks: 10 },
        }),
        createMockDbShort({
          id: 'short-recent',
          publishedAt: oneHourAgo,
          stats: { views: 50, likes: 25, ctaClicks: 5 },
        }),
      ]
      mockPrisma.short.count.mockResolvedValue(2)
      mockPrisma.short.findMany.mockResolvedValue(mockShorts)

      const req = new NextRequest('http://localhost:3000/api/feed?sort=trending')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // Recent content should have higher score due to recency boost
      expect(data.shorts[0].id).toBe('short-recent')
    })

    it('filters by single category when categoryIds provided', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?categoryIds=cat-1')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['cat-1'] },
          }),
        })
      )
    })

    it('filters by multiple categories when categoryIds has multiple values', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(2)
      mockPrisma.short.findMany.mockResolvedValue([
        createMockDbShort({ id: 'short-1' }),
        createMockDbShort({ id: 'short-2' }),
      ])

      const req = new NextRequest('http://localhost:3000/api/feed?categoryIds=cat-1,cat-2,cat-3')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['cat-1', 'cat-2', 'cat-3'] },
          }),
        })
      )
    })

    it('filters by tags when tags provided', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?tags=tech,startup')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                tag: {
                  slug: { in: ['tech', 'startup'] },
                },
              },
            },
          }),
        })
      )
    })

    it('filters by location when lat, lng and radius provided', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])
      mockHaversineDistance.mockReturnValue(5) // Within radius

      const req = new NextRequest('http://localhost:3000/api/feed?lat=52.2297&lng=21.0122&radius=10')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            latitude: expect.objectContaining({
              gte: expect.any(Number),
              lte: expect.any(Number),
            }),
            longitude: expect.objectContaining({
              gte: expect.any(Number),
              lte: expect.any(Number),
            }),
          }),
        })
      )
      // Distance is calculated and returned
      expect(data.shorts[0].distance).toBeDefined()
    })

    it('filters by verified companies when verifiedOnly=true', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?verifiedOnly=true')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            company: {
              viesVerified: true,
            },
          }),
        })
      )
    })

    it('applies algorithmic sorting with diversity filter when sort=algorithmic', async () => {
      // Arrange
      const mockShorts = [
        createMockDbShort({ id: 'short-1' }),
        createMockDbShort({ id: 'short-2' }),
      ]
      mockPrisma.short.count.mockResolvedValue(2)
      mockPrisma.short.findMany.mockResolvedValue(mockShorts)
      mockCalculateScore.mockReturnValue(0.8)
      mockApplyDiversityFilter.mockImplementation((shorts) => shorts)

      const req = new NextRequest('http://localhost:3000/api/feed?sort=algorithmic')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockCalculateScore).toHaveBeenCalled()
      expect(mockApplyDiversityFilter).toHaveBeenCalled()
    })

    it('calculates distance correctly when user location is provided', async () => {
      // Arrange
      const mockShort = createMockDbShort({
        latitude: 52.2297,
        longitude: 21.0122,
      })
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])
      mockHaversineDistance.mockReturnValue(15.5)

      const req = new NextRequest('http://localhost:3000/api/feed?lat=52.4064&lng=16.9252')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(mockHaversineDistance).toHaveBeenCalledWith(
        { lat: 52.4064, lng: 16.9252 },
        { lat: 52.2297, lng: 21.0122 }
      )
      expect(data.shorts[0].distance).toBe(15.5)
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when sort=following and user not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/feed?sort=following')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required for following feed')
      expect(mockPrisma.short.findMany).not.toHaveBeenCalled()
    })

    it('returns 401 when sort=following and session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/feed?sort=following')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required for following feed')
    })

    it('returns 401 when sort=following and session user has no id', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/feed?sort=following')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(401)
    })

    it('returns empty following feed when authenticated (Stage 5 placeholder)', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/feed?sort=following')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toEqual([])
      expect(data.totalCount).toBe(0)
      expect(data.hasMore).toBe(false)
      expect(data.nextPage).toBeNull()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns 400 when page is 0', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?page=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when page is negative', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?page=-1')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when limit exceeds 50', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?limit=51')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when limit is 0', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?limit=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when sort value is invalid', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?sort=invalid')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lat is below -90', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=-91&lng=21')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lat is above 90', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=91&lng=21')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lng is below -180', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=-181')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when lng is above 180', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=181')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when radius is below 1', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=21&radius=0')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('returns 400 when radius exceeds 100', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=21&radius=101')

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
    it('returns 500 when database count fails', async () => {
      // Arrange
      mockPrisma.short.count.mockRejectedValue(new Error('Database connection failed'))

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 when database findMany fails', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(10)
      mockPrisma.short.findMany.mockRejectedValue(new Error('Query timeout'))

      const req = new NextRequest('http://localhost:3000/api/feed')

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
    it('returns empty array when no shorts found', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.short.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toEqual([])
      expect(data.totalCount).toBe(0)
      expect(data.hasMore).toBe(false)
      expect(data.nextPage).toBeNull()
    })

    it('returns single item when page=1 and limit=1', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(10)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?page=1&limit=1')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toHaveLength(1)
      expect(data.hasMore).toBe(true)
      expect(data.nextPage).toBe(2)
    })

    it('handles short with null stats gracefully', async () => {
      // Arrange
      const mockShort = createMockDbShort({ stats: null })
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].views).toBe(0)
      expect(data.shorts[0].likes).toBe(0)
      expect(data.shorts[0].ctaClicks).toBe(0)
    })

    it('handles short with null company gracefully', async () => {
      // Arrange
      const mockShort = {
        ...createMockDbShort(),
        company: null,
      }
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].company).toEqual({
        id: '',
        name: '',
        slug: '',
        logo: null,
        verified: false,
      })
    })

    it('handles short with null category gracefully', async () => {
      // Arrange
      const mockShort = {
        ...createMockDbShort(),
        category: null,
      }
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].category).toEqual({
        id: '',
        name: '',
        slug: '',
      })
    })

    it('handles short with null publishedAt gracefully', async () => {
      // Arrange
      const mockShort = {
        ...createMockDbShort(),
        publishedAt: null,
      }
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].publishedAt).toBeDefined()
    })

    it('filters out shorts outside radius after distance calculation', async () => {
      // Arrange
      const nearShort = createMockDbShort({ id: 'near-short' })
      const farShort = createMockDbShort({ id: 'far-short' })
      mockPrisma.short.count.mockResolvedValue(2)
      mockPrisma.short.findMany.mockResolvedValue([nearShort, farShort])

      // First call returns 5km, second returns 15km (outside 10km radius)
      mockHaversineDistance
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(15)

      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=21&radius=10')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts).toHaveLength(1)
      expect(data.shorts[0].id).toBe('near-short')
    })

    it('returns null distance when short has no coordinates', async () => {
      // Arrange
      const mockShort = createMockDbShort({
        latitude: null,
        longitude: null,
      })
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([mockShort])

      const req = new NextRequest('http://localhost:3000/api/feed?lat=52&lng=21')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].distance).toBeNull()
    })

    it('returns null distance when user location not provided', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].distance).toBeNull()
    })

    it('uses company city as location', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort({
        company: {
          id: 'company-1',
          companyName: 'Test Company',
          slug: 'test-company',
          logo: null,
          viesVerified: true,
          city: 'Krakow',
        },
      })])

      const req = new NextRequest('http://localhost:3000/api/feed')

      // Act
      const response = await GET(req)
      const data: FeedResponse = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.shorts[0].location).toBe('Krakow')
    })

    it('overfetches 3x for algorithmic sorting', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(100)
      mockPrisma.short.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/feed?sort=algorithmic&limit=10')

      // Act
      await GET(req)

      // Assert - Should fetch 30 items (3x limit) for algorithmic sorting
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 30, // 10 * 3 overfetch multiplier
        })
      )
    })

    it('does not overfetch for non-algorithmic sorting', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(100)
      mockPrisma.short.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/feed?sort=newest&limit=10')

      // Act
      await GET(req)

      // Assert - Should fetch exactly limit items
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('handles empty categoryIds string', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?categoryIds=')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            categoryId: expect.anything(),
          }),
        })
      )
    })

    it('handles empty tags string', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(1)
      mockPrisma.short.findMany.mockResolvedValue([createMockDbShort()])

      const req = new NextRequest('http://localhost:3000/api/feed?tags=')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('correctly calculates skip for pagination', async () => {
      // Arrange
      mockPrisma.short.count.mockResolvedValue(100)
      mockPrisma.short.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/feed?page=3&limit=20')

      // Act
      await GET(req)

      // Assert - page 3 with limit 20 should skip 40 items
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
        })
      )
    })
  })
})
