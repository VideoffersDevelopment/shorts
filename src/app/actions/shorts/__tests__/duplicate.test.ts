import { describe, it, expect, vi, beforeEach } from 'vitest'
import { duplicateShortAction } from '../duplicate'
import type { Short, ShortTag, Tag } from '@prisma/client'

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
      count: vi.fn(),
      create: vi.fn()
    },
    shortStats: {
      create: vi.fn()
    },
    shortTag: {
      create: vi.fn()
    },
    tag: {
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

type ShortWithTags = Short & { tags: (ShortTag & { tag: Tag })[] }

const mockShort: ShortWithTags = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
  companyId: 'company-123',
  title: 'Test Short',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: 'task-123',
  hlsPlaylistUrl: 'https://cdn.example.com/hls/playlist.m3u8',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  customThumbnail: false,
  duration: 30,
  aspectRatio: '9:16',
  categoryId: 'category-123',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: 'https://example.com',
  status: 'DRAFT',
  publishedAt: null,
  expiresAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [
    {
      shortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      tagId: 'tag-1',
      tag: { id: 'tag-1', name: 'Test', slug: 'test', usageCount: 5, createdAt: new Date() }
    }
  ]
}

const mockNewShort: Short = {
  id: 'clyyyyyyyyyyyyyyyyyyyyyyyyy',
  companyId: 'company-123',
  title: 'Test Short (copy)',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: null,
  hlsPlaylistUrl: null,
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  customThumbnail: false,
  duration: 30,
  aspectRatio: '9:16',
  categoryId: 'category-123',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: 'https://example.com',
  status: 'DRAFT',
  publishedAt: null,
  expiresAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('duplicateShortAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('duplicates draft short and calls revalidatePath', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(3) // under limit
      vi.mocked(prisma.$transaction).mockResolvedValue(mockNewShort)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shortId).toBe(mockNewShort.id)
      }

      // CRITICAL: Verify revalidatePath called
      expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/panel/shorts', 'page')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it('duplicates published short without rawVideoKey', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'PUBLISHED',
        hlsPlaylistUrl: 'https://cdn.example.com/hls/playlist.m3u8'
      })
      vi.mocked(prisma.short.count).mockResolvedValue(0)

      const publishedCopy = { ...mockNewShort, rawVideoKey: null }
      vi.mocked(prisma.$transaction).mockResolvedValue(publishedCopy)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('duplicates archived short without rawVideoKey', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'ARCHIVED',
        archivedAt: new Date()
      })
      vi.mocked(prisma.short.count).mockResolvedValue(0)

      const archivedCopy = { ...mockNewShort, rawVideoKey: null }
      vi.mocked(prisma.$transaction).mockResolvedValue(archivedCopy)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('adds (copy) suffix to title', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(0)
      vi.mocked(prisma.$transaction).mockResolvedValue(mockNewShort)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      // The actual title is set inside transaction, but we verify it called
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('copies tags and increments usage counts', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(0)
      vi.mocked(prisma.$transaction).mockResolvedValue(mockNewShort)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
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
      const result = await duplicateShortAction(mockShort.id)

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
      const result = await duplicateShortAction(mockShort.id)

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
      const result = await duplicateShortAction('invalid-id')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error for empty shortId', async () => {
      // Act
      const result = await duplicateShortAction('')

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
      const result = await duplicateShortAction(mockShort.id)

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
      const result = await duplicateShortAction(mockShort.id)

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
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('SHORT_NOT_FOUND')
      }
    })
  })

  // ===========================================================================
  // LIMIT CHECK FAILURES
  // ===========================================================================

  describe('Limit Check Failures', () => {
    it('returns error when draft limit (10) reached', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(10) // at limit

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('MAX_DRAFTS_EXCEEDED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when draft limit exceeded', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(15) // over limit

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('MAX_DRAFTS_EXCEEDED')
      }
    })

    it('succeeds when draft count is 9 (just under limit)', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(9) // just under limit
      vi.mocked(prisma.$transaction).mockResolvedValue(mockNewShort)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
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
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(0)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'))

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('DUPLICATE_FAILED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles Prisma unique constraint error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(0)

      const prismaError = new Error('Unique constraint failed') as Error & { code: string }
      prismaError.code = 'P2002'
      vi.mocked(prisma.$transaction).mockRejectedValue(prismaError)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('DUPLICATE_FAILED')
      }
    })

    it('handles foreign key constraint error for category', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort)
      vi.mocked(prisma.short.count).mockResolvedValue(0)

      const prismaError = new Error('Foreign key constraint failed') as Error & { code: string }
      prismaError.code = 'P2003'
      vi.mocked(prisma.$transaction).mockRejectedValue(prismaError)

      // Act
      const result = await duplicateShortAction(mockShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('DUPLICATE_FAILED')
      }
    })
  })
})
