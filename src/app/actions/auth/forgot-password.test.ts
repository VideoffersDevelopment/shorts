import { describe, it, expect, vi, beforeEach } from 'vitest'
import { forgotPasswordAction } from './forgot-password'
import { prisma } from '@/lib/prisma'
import { sendEmail, generatePasswordResetEmail } from '@/lib/resend'
import { generateToken } from '@/lib/utils'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
  generatePasswordResetEmail: vi.fn(),
}))

vi.mock('@/lib/utils', () => ({
  generateToken: vi.fn(),
}))

const mockPrisma = vi.mocked(prisma)
const mockSendEmail = vi.mocked(sendEmail)
const mockGeneratePasswordResetEmail = vi.mocked(generatePasswordResetEmail)
const mockGenerateToken = vi.mocked(generateToken)

describe('forgotPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('sends password reset email and returns success', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('reset-token-abc')
      mockGeneratePasswordResetEmail.mockResolvedValue('<html>Reset Email</html>')
      mockSendEmail.mockResolvedValue(undefined)

      const input = { email: 'user@example.com' }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      })

      // Verify token creation
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith({
        data: {
          identifier: 'user@example.com',
          token: 'reset-token-abc',
          expires: expect.any(Date),
        },
      })

      // Verify email generation and sending
      expect(mockGeneratePasswordResetEmail).toHaveBeenCalledWith('reset-token-abc')
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Reset your password',
        html: '<html>Reset Email</html>',
      })
    })

    it('generates token that expires in 1 hour', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('token')
      mockGeneratePasswordResetEmail.mockResolvedValue('<html>Email</html>')

      const before = Date.now()

      // Act
      await forgotPasswordAction({ email: 'user@example.com' })

      const after = Date.now()

      // Assert
      const createCall = mockPrisma.verificationToken.create.mock.calls[0][0]
      const expiresDate = createCall.data.expires as Date
      const expiresTime = expiresDate.getTime()

      // Should be ~1 hour from now (with 1 second tolerance)
      const expectedMin = before + 1 * 60 * 60 * 1000 - 1000
      const expectedMax = after + 1 * 60 * 60 * 1000 + 1000

      expect(expiresTime).toBeGreaterThanOrEqual(expectedMin)
      expect(expiresTime).toBeLessThanOrEqual(expectedMax)
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error for invalid email', async () => {
      // Arrange
      const input = { email: 'not-an-email' }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Invalid email address' })
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('returns error for missing email', async () => {
      // Arrange
      const input = {}

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('returns error for empty email', async () => {
      // Arrange
      const input = { email: '' }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns success when user not found (security: prevent email enumeration)', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const input = { email: 'nonexistent@example.com' }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert - should still return success to prevent email enumeration
      expect(result).toEqual({ success: true })
      expect(mockPrisma.verificationToken.create).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('handles database connection errors', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const input = { email: 'user@example.com' }

      // Act & Assert
      await expect(forgotPasswordAction(input)).rejects.toThrow('Database connection failed')
    })

    it('handles token creation failure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('token')
      mockPrisma.verificationToken.create.mockRejectedValue(new Error('Token creation failed'))

      const input = { email: 'user@example.com' }

      // Act & Assert
      await expect(forgotPasswordAction(input)).rejects.toThrow('Token creation failed')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles malformed data', async () => {
      // Arrange
      const input = { email: 123 }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles null input', async () => {
      // Act
      const result = await forgotPasswordAction(null)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles undefined input', async () => {
      // Act
      const result = await forgotPasswordAction(undefined)

      // Assert
      expect(result.error).toBeDefined()
    })

    it.skip('handles email with uppercase characters', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'USER@EXAMPLE.COM',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('token')
      mockGeneratePasswordResetEmail.mockResolvedValue('<html>Email</html>')

      const input = { email: 'USER@EXAMPLE.COM' }

      // Act
      const result = await forgotPasswordAction(input)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'USER@EXAMPLE.COM' },
      })
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it.skip('handles email sending failure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('token')
      mockGeneratePasswordResetEmail.mockResolvedValue('<html>Email</html>')
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'))

      const input = { email: 'user@example.com' }

      // Act & Assert
      await expect(forgotPasswordAction(input)).rejects.toThrow('Email service unavailable')
    })

    it.skip('handles email generation failure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockGenerateToken.mockReturnValue('token')
      mockGeneratePasswordResetEmail.mockRejectedValue(new Error('Email generation failed'))

      const input = { email: 'user@example.com' }

      // Act & Assert
      await expect(forgotPasswordAction(input)).rejects.toThrow('Email generation failed')
    })
  })
})
