import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS - must be before imports
// ===========================================================================

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    companyProfile: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  }
}))
vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn()
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { verifyCompanyAction } from '../verify'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/resend'
import { revalidatePath } from 'next/cache'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockSendEmail = vi.mocked(sendEmail)
const mockRevalidatePath = vi.mocked(revalidatePath)

// Valid CUID for testing
const VALID_CUID = 'clj0000000000000000000000'
const VALID_CUID_2 = 'clj0000000000000000000001'

describe('verifyCompanyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('verifies company with valid input and returns success', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        slug: 'test-company',
        nip: '1234567890',
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'admin-123',
        userId: 'user-123',
        user: {
          email: 'company@example.com'
        }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()

      // Verify company existence check
      expect(mockPrisma.companyProfile.findUnique).toHaveBeenCalledWith({
        where: { id: VALID_CUID }
      })

      // Verify company update
      expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith({
        where: { id: VALID_CUID },
        data: {
          viesVerified: true,
          verifiedAt: expect.any(Date),
          verifiedBy: 'admin-123'
        },
        include: { user: true }
      })

      // Verify audit log creation
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-123',
          action: 'VERIFY_COMPANY',
          targetType: 'COMPANY',
          targetId: VALID_CUID,
          metadata: undefined
        }
      })

      // Verify email sent
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'company@example.com',
        subject: 'Company Verified - VideoShorts',
        html: expect.stringContaining('Test Company')
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/companies')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/test-company')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it('verifies company with optional reason parameter', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        slug: 'test-company',
        viesVerified: true,
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: false
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await verifyCompanyAction(VALID_CUID, 'Verified after document review')

      // Assert
      expect(result.success).toBe(true)

      // Verify reason included in audit log
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-123',
          action: 'VERIFY_COMPANY',
          targetType: 'COMPANY',
          targetId: VALID_CUID,
          metadata: { reason: 'Verified after document review' }
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
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.unauthorized')
        expect(result.code).toBe('UNAUTHORIZED')
      }

      // Verify no database operations performed
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('returns error when user does not have ADMIN role', async () => {
      // Arrange
      const userSession = {
        user: { id: 'user-123', email: 'user@example.com', role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(userSession)

      // Act
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.unauthorized')
        expect(result.code).toBe('UNAUTHORIZED')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when user has COMPANY role', async () => {
      // Arrange
      const companySession = {
        user: { id: 'user-123', email: 'user@example.com', role: 'COMPANY' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(companySession)

      // Act
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.unauthorized')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns error when session has no user ID', async () => {
      // Arrange
      const invalidSession = {
        user: { id: undefined, email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(invalidSession as any)

      // Act
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(false)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error for invalid companyId format (not CUID)', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      // Act
      const result = await verifyCompanyAction('invalid-id-123')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.invalidInput')
        expect(result.code).toBe('INVALID_INPUT')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns error for empty companyId', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      // Act
      const result = await verifyCompanyAction('')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.invalidInput')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    // Note: This action doesn't check company ownership by admin
    // Only checks ADMIN role, which is covered in Auth Failures
    it('allows any ADMIN to verify any company', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-999', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        slug: 'test-company',
        viesVerified: true,
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: false
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await verifyCompanyAction(VALID_CUID)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when company not found', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      // Company doesn't exist
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await verifyCompanyAction('clj0000000000000000000000')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.companyNotFound')
        expect(result.code).toBe('COMPANY_NOT_FOUND')
      }

      // Verify update not attempted
      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when audit log creation fails', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-123',
        viesVerified: false
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: 'company-123',
        companyName: 'Test Company',
        slug: 'test-company',
        user: { email: 'company@example.com' }
      } as any)

      // Audit log creation fails
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database constraint violation'))

      // Act
      const result = await verifyCompanyAction('clj0000000000000000000001')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.verifyFailed')
        expect(result.code).toBe('VERIFY_FAILED')
      }
    })

    it('returns error when database transaction fails', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      // Act
      const result = await verifyCompanyAction('clj0000000000000000000002')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.verifyFailed')
      }
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles email send failure gracefully', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const testCuid = 'clj0000000000000000000003'
      const mockCompany = {
        id: testCuid,
        companyName: 'Test Company',
        slug: 'test-company',
        viesVerified: true,
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: testCuid,
        viesVerified: false
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      // Email service fails
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'))

      // Act
      const result = await verifyCompanyAction(testCuid)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.verifyFailed')
      }
    })

    it('handles already verified company', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const testCuid = 'clj0000000000000000000004'
      const mockCompany = {
        id: testCuid,
        companyName: 'Test Company',
        slug: 'test-company',
        viesVerified: true,
        verifiedAt: new Date('2025-01-01'),
        verifiedBy: 'admin-999',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      // Company already verified
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompany as any)
      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await verifyCompanyAction(testCuid)

      // Assert - Should still succeed (idempotent operation)
      expect(result.success).toBe(true)
    })

    it('logs structured error information on failure', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

      // Act
      await verifyCompanyAction('clj0000000000000000000005')

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ADMIN_VERIFY_COMPANY]',
        expect.objectContaining({
          adminId: 'admin-123',
          companyId: 'clj0000000000000000000005',
          error: 'Database error',
          timestamp: expect.any(String)
        })
      )

      consoleSpy.mockRestore()
    })
  })
})
