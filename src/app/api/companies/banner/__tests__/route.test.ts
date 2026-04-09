import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

const { mockAuth, mockGetUploadUrl, mockGetPublicUrl, mockDeleteObject, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUploadUrl: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockDeleteObject: vi.fn(),
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
  deleteObject: mockDeleteObject,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock nanoid for predictable key generation
vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-456',
}))

// Import AFTER mocks are set up
import { POST, DELETE } from '../route'

describe('POST /api/companies/banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns presigned URL for authenticated company user with JPEG', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/companies/company-1/banner-test-nanoid-456.jpeg')

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBe('https://r2.example.com/presigned-url')
      expect(data.publicUrl).toBe('https://cdn.example.com/companies/company-1/banner-test-nanoid-456.jpeg')

      expect(mockGetUploadUrl).toHaveBeenCalledWith({
        key: 'companies/company-1/banner-test-nanoid-456.jpeg',
        contentType: 'image/jpeg',
      })
      expect(mockGetPublicUrl).toHaveBeenCalledWith('companies/company-1/banner-test-nanoid-456.jpeg')
    })

    it('returns presigned URL for PNG image', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/companies/company-1/banner-test-nanoid-456.png')

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/png' }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBeDefined()
      expect(data.publicUrl).toContain('.png')
    })

    it('returns presigned URL for WebP image', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGetUploadUrl.mockResolvedValue('https://r2.example.com/presigned-url')
      mockGetPublicUrl.mockReturnValue('https://cdn.example.com/companies/company-1/banner-test-nanoid-456.webp')

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/webp' }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.publicUrl).toContain('.webp')
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
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

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
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

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
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

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
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
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it('returns 400 when contentType is missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid content type')
      expect(mockGetUploadUrl).not.toHaveBeenCalled()
    })

    it('returns 400 when contentType is not an image', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'application/pdf' }),
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid content type')
    })

    it('returns 400 when contentType is video', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'video/mp4' }),
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it('returns 400 when contentType is empty string', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: '' }),
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
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGetUploadUrl.mockRejectedValue(new Error('R2 service unavailable'))

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/jpeg' }),
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
    it('handles malformed JSON body gracefully', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'POST',
        body: 'invalid-json',
      })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(500)
    })
  })
})

describe('DELETE /api/companies/banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('deletes banner from R2 when banner exists', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: 'https://cdn.example.com/companies/company-1/banner-123.jpg',
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockDeleteObject).toHaveBeenCalledWith('companies/company-1/banner-123.jpg')
    })

    it('extracts correct key from different URL formats', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: 'https://different-cdn.com/companies/company-1/banner-456.png',
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      await DELETE(req)

      // Assert
      expect(mockDeleteObject).toHaveBeenCalledWith('companies/company-1/banner-456.png')
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
      expect(mockDeleteObject).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)

      // Assert
      expect(response.status).toBe(401)
    })

    it('returns 401 when session has no user ID', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)

      // Assert
      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // NOT FOUND
  // ===========================================================================

  describe('Not Found Errors', () => {
    it('returns 404 when company has no banner', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('No banner to delete')
      expect(mockDeleteObject).not.toHaveBeenCalled()
    })

    it('returns 404 when user has no company profile', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('No banner to delete')
    })
  })

  // ===========================================================================
  // R2 ERRORS
  // ===========================================================================

  describe('R2 Errors', () => {
    it('returns 500 when R2 deleteObject fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: 'https://cdn.example.com/companies/company-1/banner-123.jpg',
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockRejectedValue(new Error('R2 service unavailable'))

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(req)
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
    it('handles banner URL with query parameters', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: 'https://cdn.example.com/companies/company-1/banner-789.jpg?v=123',
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)

      const req = new NextRequest('http://localhost:3000/api/companies/banner', {
        method: 'DELETE',
      })

      // Act
      await DELETE(req)

      // Assert - Query params should be stripped
      expect(mockDeleteObject).toHaveBeenCalledWith('companies/company-1/banner-789.jpg?v=123')
    })
  })
})
