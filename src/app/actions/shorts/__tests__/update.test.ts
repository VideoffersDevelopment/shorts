import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateShortMetadataAction } from '../update'
import type { Short } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    companyProfile: {
      findUnique: vi.fn()
    },
    short: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    shortTag: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn()
    },
    tag: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const mockAuth = vi.mocked(auth)
const mockRevalidatePath = vi.mocked(revalidatePath)

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'COMPANY' as const
  },
  expires: new Date(Date.now() + 86400000).toISOString()
}

const mockCompanyProfile = {
  id: 'company-123'
}

const mockShort: Short = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
  companyId: 'company-123',
  title: 'Test Short',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: null,
  hlsPlaylistUrl: null,
  thumbnailUrl: null,
  customThumbnail: false,
  duration: 30,
  aspectRatio: '9:16',
  categoryId: 'category-123',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: null,
  status: 'DRAFT',
  publishedAt: null,
  expiresAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('updateShortMetadataAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('updates short metadata and calls revalidatePath', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      const updatedShort = { ...mockShort, title: 'Updated Title', description: 'Updated desc' }
      vi.mocked(prisma.$transaction).mockResolvedValue(updatedShort)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        title: 'Updated Title',
        description: 'Updated desc'
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Title')
      }

      // CRITICAL: Verify revalidatePath called
      expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/panel/shorts', 'page')
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/[locale]/panel/shorts/${mockShort.id}`, 'page')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it('updates only provided fields', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PUBLISHED'
      })

      const updatedShort = { ...mockShort, title: 'New Title' }
      vi.mocked(prisma.$transaction).mockResolvedValue(updatedShort)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        title: 'New Title'
      })

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('handles ctaLink update with empty string converting to null', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      const updatedShort = { ...mockShort, ctaLink: null }
      vi.mocked(prisma.$transaction).mockResolvedValue(updatedShort)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        title: 'Title',
        ctaLink: ''
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns error when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when session user id is missing', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { email: 'test@test.com' }, expires: '' })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED')
      }
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error for invalid shortId format', async () => {
      // Act - invalid CUID format
      const result = await updateShortMetadataAction('invalid-id', { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error for empty shortId', async () => {
      // Act
      const result = await updateShortMetadataAction('', { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
      }
    })

    it('returns error for title exceeding max length', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        title: 'a'.repeat(101) // exceeds 100 char limit
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('returns error for description exceeding max length', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        description: 'a'.repeat(501) // exceeds 500 char limit
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('returns error for invalid ctaLink URL', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, {
        ctaLink: 'not-a-valid-url'
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    it('returns error when user role is not COMPANY', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, role: 'USER' as const }
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_COMPANY')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when company profile not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(null)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NO_COMPANY_PROFILE')
      }
    })

    it('returns error when short not owned by user', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null) // Short not found for this company

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('SHORT_NOT_FOUND')
      }
    })
  })

  // ===========================================================================
  // STATUS CHECK FAILURES
  // ===========================================================================

  describe('Status Check Failures', () => {
    it('returns error when short status is PROCESSING', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PROCESSING'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_STATUS')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when short status is ARCHIVED', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'ARCHIVED'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_STATUS')
      }
    })

    it('returns error when short status is PENDING_PAYMENT', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PENDING_PAYMENT'
      })

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_STATUS')
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when transaction fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'))

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UPDATE_FAILED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles Prisma unique constraint error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      const prismaError = new Error('Unique constraint failed') as Error & { code: string }
      prismaError.code = 'P2002'
      vi.mocked(prisma.$transaction).mockRejectedValue(prismaError)

      // Act
      const result = await updateShortMetadataAction(mockShort.id, { title: 'Test' })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('UPDATE_FAILED')
      }
    })
  })
})
