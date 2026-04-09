import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockAuth, mockGetVideoUploadUrl, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetVideoUploadUrl: vi.fn(),
  mockPrisma: {
    companyProfile: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/r2-video', () => ({
  getVideoUploadUrl: mockGetVideoUploadUrl,
  isValidVideoType: (val: string) => ['video/mp4', 'video/quicktime', 'video/webm'].includes(val),
  MAX_VIDEO_SIZE: 100_000_000,
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
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

describe('POST /api/shorts/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns upload URL and key for valid MP4 request', async () => {
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

      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-upload-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000, // 50MB
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBe('https://r2.example.com/presigned-upload-url')
      expect(data.key).toBe('shorts/company-1/test-nanoid-123')

      expect(mockGetVideoUploadUrl).toHaveBeenCalledWith({
        key: 'shorts/company-1/test-nanoid-123',
        contentType: 'video/mp4',
      })
    })

    it('returns upload URL for video/quicktime', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/quicktime',
          fileSize: 30_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBeDefined()
      expect(mockGetVideoUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'video/quicktime',
        })
      )
    })

    it('returns upload URL for video/webm', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/webm',
          fileSize: 20_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBeDefined()
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
      expect(mockGetVideoUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
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

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
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

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toBe('Not a company account')
      expect(mockGetVideoUploadUrl).not.toHaveBeenCalled()
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
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Content type must be one of')
      expect(mockGetVideoUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 400 for file size exceeding limit', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 150_000_000, // 150MB - exceeds 100MB limit
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('File size must be less than')
      expect(mockGetVideoUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 400 when contentType is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileSize: 50_000_000,
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
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for video/avi (not in allowed list)', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/avi',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 for empty contentType', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: '',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('accepts negative fileSize (schema does not validate positive)', async () => {
      // Note: The actual schema only validates max size, not positive values
      // This test documents the actual behavior
      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: -100,
        }),
      })

      // Act
      const response = await POST(req)

      // Assert - schema allows negative values (only max is checked)
      expect(response.status).toBe(200)
    })
  })

  // ===========================================================================
  // R2 ERRORS
  // ===========================================================================

  describe('R2 Errors', () => {
    it('returns 500 when R2 getVideoUploadUrl fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
      })

      mockGetVideoUploadUrl.mockRejectedValue(new Error('R2 service unavailable'))

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
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
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
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
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('handles file size at exact limit (100MB)', async () => {
      // Arrange
      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 100_000_000, // Exactly 100MB
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(200)
    })

    it('handles file size just over limit', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 100_000_001, // 1 byte over limit
        }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ===========================================================================
  // KEY GENERATION
  // ===========================================================================

  describe('Key Generation', () => {
    it('generates key with company ID and nanoid', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-abc-123',
        userId: 'user-1',
      })

      mockGetVideoUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')

      const req = new NextRequest('http://localhost:3000/api/shorts/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'video/mp4',
          fileSize: 50_000_000,
        }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(data.key).toBe('shorts/company-abc-123/test-nanoid-123')
    })
  })
})
