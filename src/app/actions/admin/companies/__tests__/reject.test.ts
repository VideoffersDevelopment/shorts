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
    user: {
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

import { rejectCompanyAction } from '../reject'
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

describe('rejectCompanyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('rejects company with valid input and returns success', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        nip: '1234567890',
        viesVerified: false,
        verifiedAt: null,
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
        viesVerified: true,
        userId: 'user-123'
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid NIP number')

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
          viesVerified: false,
          verifiedAt: null
        },
        include: { user: true }
      })

      // Verify user role reverted to USER
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'USER' }
      })

      // Verify audit log creation
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-123',
          action: 'REJECT_COMPANY',
          targetType: 'COMPANY',
          targetId: VALID_CUID,
          metadata: { reason: 'Invalid NIP number' }
        }
      })

      // Verify email sent with reason
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'company@example.com',
        subject: 'Company Verification Rejected - VideoShorts',
        html: expect.stringContaining('Invalid NIP number')
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/companies')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it('rejects company with longer reason text', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      const longReason = 'Documents submitted do not meet verification requirements. Please resubmit with correct documentation.'

      // Act
      const result = await rejectCompanyAction(VALID_CUID, longReason)

      // Assert
      expect(result.success).toBe(true)

      // Verify reason included in audit log and email
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { reason: longReason }
        })
      })

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(longReason)
        })
      )
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
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid documents')

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
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid documents')

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
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid documents')

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
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid documents')

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
      const result = await rejectCompanyAction('invalid-id-123', 'Invalid documents')

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
      const result = await rejectCompanyAction('', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.invalidInput')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns error for reason shorter than 5 characters', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000001', 'Bad')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.invalidInput')
        expect(result.code).toBe('INVALID_INPUT')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns error for empty reason', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000002', '')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('errors.invalidInput')
      }

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('accepts reason with exactly 5 characters', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000003', 'Error')

      // Assert
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    // Note: This action doesn't check company ownership by admin
    // Only checks ADMIN role, which is covered in Auth Failures
    it('allows any ADMIN to reject any company', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-999', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await rejectCompanyAction(VALID_CUID, 'Invalid NIP')

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
      const result = await rejectCompanyAction('clj0000000000000000000000', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.companyNotFound')
        expect(result.code).toBe('COMPANY_NOT_FOUND')
      }

      // Verify update not attempted
      expect(mockPrisma.companyProfile.update).not.toHaveBeenCalled()
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
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
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: VALID_CUID,
        companyName: 'Test Company',
        userId: 'user-123',
        user: { email: 'company@example.com' }
      } as any)

      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)

      // Audit log creation fails
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database constraint violation'))

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000001', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.rejectFailed')
        expect(result.code).toBe('REJECT_FAILED')
      }
    })

    it('returns error when user role update fails', async () => {
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
        id: VALID_CUID,
        viesVerified: true,
        userId: 'user-123'
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue({
        id: VALID_CUID,
        companyName: 'Test Company',
        userId: 'user-123',
        user: { email: 'company@example.com' }
      } as any)

      // User update fails
      mockPrisma.user.update.mockRejectedValue(new Error('User not found'))

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000002', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.rejectFailed')
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
      const result = await rejectCompanyAction('clj0000000000000000000003', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.rejectFailed')
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

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      // Email service fails
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'))

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000004', 'Invalid documents')

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('admin.errors.rejectFailed')
      }
    })

    it('handles already rejected company', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        verifiedAt: null,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      // Company already not verified
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompany as any)
      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000005', 'Invalid documents')

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
      await rejectCompanyAction('clj0000000000000000000006', 'Invalid documents')

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ADMIN_REJECT_COMPANY]',
        expect.objectContaining({
          adminId: 'admin-123',
          companyId: 'clj0000000000000000000006',
          error: 'Database error',
          timestamp: expect.any(String)
        })
      )

      consoleSpy.mockRestore()
    })

    it('handles special characters in reason text', async () => {
      // Arrange
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      mockAuth.mockResolvedValue(adminSession)

      const mockCompany = {
        id: VALID_CUID,
        companyName: 'Test Company',
        viesVerified: false,
        userId: 'user-123',
        user: { email: 'company@example.com' }
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any)
      })

      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: VALID_CUID,
        viesVerified: true
      } as any)

      mockPrisma.companyProfile.update.mockResolvedValue(mockCompany as any)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-123', role: 'USER' } as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)
      mockSendEmail.mockResolvedValue(undefined)

      const reasonWithSpecialChars = 'Invalid: <script>alert("xss")</script> & "quotes" \'apostrophes\''

      // Act
      const result = await rejectCompanyAction('clj0000000000000000000007', reasonWithSpecialChars)

      // Assert
      expect(result.success).toBe(true)

      // Verify special characters preserved in metadata
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { reason: reasonWithSpecialChars }
        })
      })
    })
  })
})
