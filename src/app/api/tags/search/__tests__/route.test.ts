import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    tag: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Import AFTER mocks are set up
import { GET } from '../route'

describe('GET /api/tags/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns matching tags for valid search query', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'react', usageCount: 150 },
        { id: 'tag-2', name: 'reactnative', usageCount: 50 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.tags).toHaveLength(2)
      expect(data.tags[0].name).toBe('react')
      expect(data.tags[0].usageCount).toBe(150)

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'react',
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          usageCount: true,
        },
        orderBy: {
          usageCount: 'desc',
        },
        take: 10,
      })
    })

    it('returns popular tags when query is empty', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'javascript', usageCount: 500 },
        { id: 'tag-2', name: 'typescript', usageCount: 400 },
        { id: 'tag-3', name: 'python', usageCount: 350 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.tags).toHaveLength(3)

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          usageCount: true,
        },
        orderBy: {
          usageCount: 'desc',
        },
        take: 10,
      })
    })

    it('returns popular tags when query is whitespace only', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'javascript', usageCount: 500 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=   ')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.tags).toBeDefined()
    })

    it('returns empty array when no tags match', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=xyznonexistent')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.tags).toHaveLength(0)
    })

    it('orders results by usage count descending', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'nextjs', usageCount: 200 },
        { id: 'tag-2', name: 'next', usageCount: 100 },
        { id: 'tag-3', name: 'next-auth', usageCount: 50 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=next')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(data.tags[0].usageCount).toBeGreaterThan(data.tags[1].usageCount)
      expect(data.tags[1].usageCount).toBeGreaterThan(data.tags[2].usageCount)
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockPrisma.tag.findMany).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(401)
      expect(mockPrisma.tag.findMany).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user ID', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns 500 when database query fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockRejectedValue(new Error('Database connection failed'))

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('handles Prisma timeout errors', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.tag.findMany.mockRejectedValue({
        code: 'P2024',
        message: 'Timed out fetching a new connection from the pool',
      })

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

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
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
    })

    it('handles query with special characters', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([])

      // Note: In URL query strings, '+' is decoded as space. Use %2B for literal plus.
      const req = new NextRequest('http://localhost:3000/api/tags/search?q=c%2B%2B')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: {
              contains: 'c++',
              mode: 'insensitive',
            },
          },
        })
      )
    })

    it('handles query with unicode characters', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=' + encodeURIComponent('programowanie'))

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles very long query strings', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([])
      const longQuery = 'a'.repeat(500)

      const req = new NextRequest(`http://localhost:3000/api/tags/search?q=${longQuery}`)

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('limits results to 10 tags', async () => {
      // Arrange
      const manyTags = Array.from({ length: 15 }, (_, i) => ({
        id: `tag-${i}`,
        name: `tag${i}`,
        usageCount: 100 - i,
      }))

      mockPrisma.tag.findMany.mockResolvedValue(manyTags.slice(0, 10))

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=tag')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(data.tags.length).toBeLessThanOrEqual(10)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('performs case-insensitive search', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'React', usageCount: 100 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=REACT')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: {
              contains: 'REACT',
              mode: 'insensitive',
            },
          },
        })
      )
    })

    it('handles query parameter named differently', async () => {
      // Arrange - no q parameter
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'javascript', usageCount: 500 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?search=react')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert - should return popular tags since 'q' is not provided
      expect(response.status).toBe(200)
    })
  })

  // ===========================================================================
  // RESPONSE FORMAT
  // ===========================================================================

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
    })

    it('returns tags array with id, name, and usageCount fields', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'react', usageCount: 150 },
      ])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=react')

      // Act
      const response = await GET(req)
      const data = await response.json()

      // Assert
      expect(data.tags[0]).toHaveProperty('id')
      expect(data.tags[0]).toHaveProperty('name')
      expect(data.tags[0]).toHaveProperty('usageCount')
      expect(Object.keys(data.tags[0])).toHaveLength(3)
    })

    it('returns proper JSON content type', async () => {
      // Arrange
      mockPrisma.tag.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/tags/search?q=test')

      // Act
      const response = await GET(req)

      // Assert
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})
