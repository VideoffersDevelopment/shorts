import { describe, it, expect, vi, beforeEach } from 'vitest'
import { archiveShortAction } from '../archive'
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
    }
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
  hlsPlaylistUrl: 'https://cdn.example.com/hls/playlist.m3u8',
  thumbnailUrl: null,
  customThumbnail: false,
  duration: 30,
  aspectRatio: '9:16',
  categoryId: 'category-123',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: null,
  status: 'PUBLISHED',
  publishedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('archiveShortAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('archives published short and calls revalidatePath', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PUBLISHED'
      })

      const archivedShort = {
        ...mockShort,
        status: 'ARCHIVED' as const,
        archivedAt: new Date()
      }
      vi.mocked(prisma.short.update).mockResolvedValue(archivedShort)

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('ARCHIVED')
        expect(result.data.archivedAt).toBeDefined()
      }

      // CRITICAL: Verify revalidatePath called
      expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/panel/shorts', 'page')
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/[locale]/panel/shorts/${mockShort.id}`, 'page')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it('sets archivedAt timestamp when archiving', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PUBLISHED'
      })

      const archivedShort = {
        ...mockShort,
        status: 'ARCHIVED' as const,
        archivedAt: new Date()
      }
      vi.mocked(prisma.short.update).mockResolvedValue(archivedShort)

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      expect(vi.mocked(prisma.short.update)).toHaveBeenCalledWith({
        where: { id: mockShort.id },
        data: {
          status: 'ARCHIVED',
          archivedAt: expect.any(Date)
        }
      })
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
      const result = await archiveShortAction(mockShort.id)

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
      const result = await archiveShortAction(mockShort.id)

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
      // Act
      const result = await archiveShortAction('invalid-id')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error for empty shortId', async () => {
      // Act
      const result = await archiveShortAction('')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
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
      const result = await archiveShortAction(mockShort.id)

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
      const result = await archiveShortAction(mockShort.id)

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
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      // Act
      const result = await archiveShortAction(mockShort.id)

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
    it('returns error when short status is DRAFT', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'DRAFT'
      })

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_PUBLISHED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when short status is ARCHIVED (already archived)', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'ARCHIVED'
      })

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_PUBLISHED')
      }
    })

    it('returns error when short status is PROCESSING', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PROCESSING'
      })

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_PUBLISHED')
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
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_PUBLISHED')
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when prisma update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PUBLISHED'
      })
      vi.mocked(prisma.short.update).mockRejectedValue(new Error('Database error'))

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('ARCHIVE_FAILED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles Prisma record not found error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: mockShort.id,
        status: 'PUBLISHED'
      })

      const prismaError = new Error('Record not found') as Error & { code: string }
      prismaError.code = 'P2025'
      vi.mocked(prisma.short.update).mockRejectedValue(prismaError)

      // Act
      const result = await archiveShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('ARCHIVE_FAILED')
      }
    })
  })
})
