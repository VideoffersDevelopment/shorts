import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteShortAction } from '../delete'
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
      delete: vi.fn()
    }
  }
}))

vi.mock('@/lib/r2', () => ({
  deleteObject: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/r2'
import { revalidatePath } from 'next/cache'

const mockAuth = vi.mocked(auth)
const mockDeleteObject = vi.mocked(deleteObject)
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

const mockShort: Partial<Short> = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
  status: 'DRAFT',
  rawVideoKey: 'raw/video.mp4'
}

describe('deleteShortAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('deletes draft short and calls revalidatePath', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort as Short)
      vi.mocked(prisma.short.delete).mockResolvedValue(mockShort as Short)
      mockDeleteObject.mockResolvedValue(undefined)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(true)
      }

      // CRITICAL: Verify revalidatePath called
      expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/panel/shorts', 'page')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it('deletes R2 raw video when rawVideoKey exists', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        rawVideoKey: 'raw/test-video.mp4'
      } as Short)
      vi.mocked(prisma.short.delete).mockResolvedValue(mockShort as Short)
      mockDeleteObject.mockResolvedValue(undefined)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(true)
      expect(mockDeleteObject).toHaveBeenCalledWith('raw/test-video.mp4')
    })

    it('succeeds even if R2 delete fails (non-blocking)', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort as Short)
      vi.mocked(prisma.short.delete).mockResolvedValue(mockShort as Short)
      mockDeleteObject.mockRejectedValue(new Error('R2 error'))

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert - Should still succeed, R2 error is logged but not blocking
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('skips R2 delete when rawVideoKey is null', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        rawVideoKey: null
      } as Short)
      vi.mocked(prisma.short.delete).mockResolvedValue(mockShort as Short)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(true)
      expect(mockDeleteObject).not.toHaveBeenCalled()
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
      const result = await deleteShortAction(mockShort.id!)

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
      const result = await deleteShortAction(mockShort.id!)

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
      const result = await deleteShortAction('invalid-id')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('INVALID_ID')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error for empty shortId', async () => {
      // Act
      const result = await deleteShortAction('')

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
      const result = await deleteShortAction(mockShort.id!)

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
      const result = await deleteShortAction(mockShort.id!)

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
      const result = await deleteShortAction(mockShort.id!)

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
    it('returns error when short status is PUBLISHED', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'PUBLISHED'
      } as Short)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('CANNOT_DELETE_NON_DRAFT')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when short status is ARCHIVED', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'ARCHIVED'
      } as Short)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('CANNOT_DELETE_NON_DRAFT')
      }
    })

    it('returns error when short status is PROCESSING', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'PROCESSING'
      } as Short)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('CANNOT_DELETE_NON_DRAFT')
      }
    })

    it('returns error when short status is PENDING_PAYMENT', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        ...mockShort,
        status: 'PENDING_PAYMENT'
      } as Short)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('CANNOT_DELETE_NON_DRAFT')
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when prisma delete fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort as Short)
      vi.mocked(prisma.short.delete).mockRejectedValue(new Error('Database error'))

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('DELETE_FAILED')
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles foreign key constraint error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession)
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(mockCompanyProfile)
      vi.mocked(prisma.short.findFirst).mockResolvedValue(mockShort as Short)

      const prismaError = new Error('Foreign key constraint failed') as Error & { code: string }
      prismaError.code = 'P2003'
      vi.mocked(prisma.short.delete).mockRejectedValue(prismaError)

      // Act
      const result = await deleteShortAction(mockShort.id!)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('DELETE_FAILED')
      }
    })
  })
})
