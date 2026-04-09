import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockAuth, mockGetUploadUrl, mockGetPublicUrl, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUploadUrl: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockPrisma: {
    companyProfile: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/r2', () => ({
  getUploadUrl: mockGetUploadUrl,
  getPublicUrl: mockGetPublicUrl,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock nanoid for predictable key generation
vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-123',
}))

// Import AFTER mocks are set up
import { POST } from '../route'

describe('POST /api/shorts/thumbnail-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns upload URL, key, and public URL for JPEG thumbnail', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-upload-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnails/company-1/test-nanoid-123/test-nanoid-123.jpg')

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000, // 500KB
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBe('https://r2.example.com/presigned-upload-url')
      expect(data.key).toContain('thumbnails/company-1/')
      expect(data.key).toContain('.jpg')
      expect(data.publicUrl).toBeDefined()

      expect(mockGetUploadUrl).toHaveBeenCalledWith({
        key: expect.stringContaining('thumbnails/company-1/'),
        contentType: 'image/jpeg',
      })
    })

    it('returns upload URL for PNG thumbnail', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnails/company-1/test-nanoid-123/test-nanoid-123.png')

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/png',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toContain('.png')
    })

    it('uses shortId for folder when provided', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnails/company-1/short-abc/test-nanoid-123.jpg')

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
          shortId: 'short-abc',
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toContain('short-abc')
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
      expect(mockGetUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(401)
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user ID', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    it('returns 403 when user has no company profile', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toBe('Not a company account')
      expect(mockGetUploadUrl).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })
    })

    it('returns 400 for invalid content type', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Content type must be one of')
      expect(mockGetUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 400 for file size exceeding 2MB limit', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 3_000_000, // 3MB - exceeds 2MB limit
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('2MB')
      expect(mockGetUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 400 when contentType is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 when fileSize is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for image/gif (not in allowed list)', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/gif',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 for image/webp (not in allowed list)', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/webp',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 for empty contentType', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: '',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 for negative fileSize', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: -100,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 for zero fileSize', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 0,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ===========================================================================
  // R2 ERRORS
  // ===========================================================================

  describe('R2 Errors', () => {
    it('returns 500 when R2 getUploadUrl fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetUploadUrl.mockRejectedValue(new Error('R2 service unavailable'))

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
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

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })
    })

    it('handles malformed JSON body gracefully', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: 'invalid-json',
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(500)
    })

    it('handles empty request body', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('handles file size at exact limit (2MB)', async () => {
      // Arrange
      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnail.jpg')

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 2_000_000, // Exactly 2MB
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles file size just over 2MB limit', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 2_000_001, // 1 byte over limit
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('handles optional shortId being undefined', async () => {
      // Arrange
      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnail.jpg')

      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
          shortId: undefined,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(200)
    })
  })

  // ===========================================================================
  // KEY GENERATION
  // ===========================================================================

  describe('Key Generation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-abc-123',
        userId: 'user-1',
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/thumbnail.jpg')
    })

    it('generates key with correct structure: thumbnails/{companyId}/{folder}/{filename}.{ext}', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(data.key).toMatch(/^thumbnails\/company-abc-123\/[^/]+\/[^/]+\.jpg$/)
    })

    it('uses jpg extension for image/jpeg', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(data.key).toContain('.jpg')
    })

    it('uses png extension for image/png', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/thumbnail-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/png',
          fileSize: 500_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(data.key).toContain('.png')
    })
  })
})
