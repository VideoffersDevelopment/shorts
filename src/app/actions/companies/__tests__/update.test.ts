import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

// Create mocks using vi.hoisted
const { mockAuth, mockRevalidatePath, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockPrisma: {
    companyProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// Import AFTER mocks are set up
import { updateCompanyProfileAction } from '../update'

describe('updateCompanyProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('updates company profile and revalidates paths', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Old Company Name',
        nip: '1234567890',
        address: 'Old Address',
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

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Updated Company',
        nip: '1234567890',
        address: 'Old Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: 'New description',
        website: 'https://example.com',
        categoryId: 'clabcd123xyz456789012345',
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Updated Company',
        description: 'New description',
        website: 'https://example.com',
        categoryId: 'clabcd123xyz456789012345',
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject({
          companyName: 'Updated Company',
          description: 'New description',
          website: 'https://example.com',
          categoryId: 'clabcd123xyz456789012345',
        })
      }

      expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          companyName: 'Updated Company',
          description: 'New description',
          website: 'https://example.com',
          categoryId: 'clabcd123xyz456789012345',
        },
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/test-company')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/company/profile')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it('updates company with optional fields empty', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: '',
        website: '',
        categoryId: '',
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        description: '',
        website: '',
        categoryId: '',
      })

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/test-company')
    })

    it('updates company with social links', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: {
          facebook: 'https://facebook.com/test',
          instagram: 'https://instagram.com/test',
          tiktok: '',
        },
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        socialLinks: {
          facebook: 'https://facebook.com/test',
          instagram: 'https://instagram.com/test',
          tiktok: '',
        },
      })

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('updates company with location coordinates', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
        nip: '1234567890',
        address: 'Updated Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: 52.2297,
        longitude: 21.0122,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        address: 'Updated Address',
        latitude: 52.2297,
        longitude: 21.0122,
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.latitude).toBe(52.2297)
        expect(result.data.longitude).toBe(21.0122)
      }
    })

    it('updates company with business hours JSON', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      const businessHours = {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
      }

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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
        businessHours,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        businessHours,
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.businessHours).toEqual(businessHours)
      }
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns error when not authenticated (no session)', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Test Company',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED')
        expect(result.error).toBe('errors.unauthorized')
      }
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Test Company',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED')
      }
      expect(mockPrisma.companyProfile.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when session has no user ID', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Test Company',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED')
      }
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    it('returns error when user has no company profile', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Test Company',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_COMPANY')
        expect(result.error).toBe('companies.errors.notCompany')
      }
      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
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
        slug: 'test-company',
        companyName: 'Company Name',
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

    it('rejects company name too short (< 2 chars)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'A',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('rejects company name too long (> 100 chars)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'A'.repeat(101),
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects description too long (> 2000 chars)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        description: 'A'.repeat(2001),
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects invalid website URL', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        website: 'not-a-valid-url',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects invalid categoryId (not CUID)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        categoryId: 'invalid-id',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects invalid social link URLs', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        socialLinks: {
          facebook: 'not-a-url',
          instagram: '',
          tiktok: '',
        },
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects latitude out of range (< -90)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        latitude: -91,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects latitude out of range (> 90)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        latitude: 91,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects longitude out of range (< -180)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        longitude: -181,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects longitude out of range (> 180)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        longitude: 181,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects address too long (> 200 chars)', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        address: 'A'.repeat(201),
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('rejects invalid business hours format', async () => {
      // Act
      const result = await updateCompanyProfileAction({
        businessHours: {
          monday: { open: '9:00', close: '17:00' }, // Invalid format (should be 09:00)
        },
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when DB update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      mockPrisma.companyProfile.update.mockRejectedValue(new Error('Database connection lost'))

      // Act
      const result = await updateCompanyProfileAction({
        companyName: 'Updated Company',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UPDATE_FAILED')
        expect(result.error).toBe('companies.errors.updateFailed')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('throws error when profile lookup fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(updateCompanyProfileAction({
        companyName: 'Updated Company',
      })).rejects.toThrow('Database error')

      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
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
        slug: 'test-company',
        companyName: 'Company Name',
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

    it('handles empty update object', async () => {
      // Arrange
      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      // Act
      const result = await updateCompanyProfileAction({})

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('accepts boundary values for coordinates', async () => {
      // Arrange
      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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
        latitude: -90,
        longitude: 180,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        latitude: -90,
        longitude: 180,
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.latitude).toBe(-90)
        expect(result.data.longitude).toBe(180)
      }
    })

    it('handles undefined optional fields gracefully', async () => {
      // Arrange
      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
        nip: '1234567890',
        address: 'Address',
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: undefined,
        website: undefined,
        categoryId: undefined,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await updateCompanyProfileAction({
        description: undefined,
        website: undefined,
        categoryId: undefined,
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // CACHE REVALIDATION
  // ===========================================================================

  describe('Cache Revalidation', () => {
    it('revalidates correct paths on success', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'my-company',
        companyName: 'My Company',
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

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'my-company',
        companyName: 'Updated Company',
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

      // Act
      await updateCompanyProfileAction({
        companyName: 'Updated Company',
      })

      // Assert - Must revalidate both company public page and profile edit page
      expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/my-company')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/company/profile')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it('does not revalidate on auth error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      await updateCompanyProfileAction({
        companyName: 'Test',
      })

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('does not revalidate on authorization error', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      // Act
      await updateCompanyProfileAction({
        companyName: 'Test',
      })

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('does not revalidate on validation error', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      // Act
      await updateCompanyProfileAction({
        companyName: 'A', // Too short
      })

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('does not revalidate on DB error', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        userId: 'user-1',
        slug: 'test-company',
        companyName: 'Company Name',
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

      mockPrisma.companyProfile.update.mockRejectedValue(new Error('DB error'))

      // Act
      await updateCompanyProfileAction({
        companyName: 'Updated',
      })

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
