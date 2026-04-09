import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signupAction } from './signup'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateVerificationEmail } from '@/lib/resend'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/utils'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
  generateVerificationEmail: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

vi.mock('@/lib/utils', () => ({
  generateToken: vi.fn(),
}))

const mockPrisma = vi.mocked(prisma)
const mockSendEmail = vi.mocked(sendEmail)
const mockGenerateVerificationEmail = vi.mocked(generateVerificationEmail)
const mockBcryptHash = vi.mocked(bcrypt.hash)
const mockGenerateToken = vi.mocked(generateToken)

describe('signupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('creates user, sends verification email, and returns success', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcryptHash.mockResolvedValue('hashed-password-123')
      mockGenerateToken.mockReturnValue('verification-token-abc')
      mockGenerateVerificationEmail.mockResolvedValue('<html>Verification Email</html>')
      mockSendEmail.mockResolvedValue(undefined)

      const input = {
        email: 'newuser@example.com',
        password: 'password123',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      })

      // Verify password hashing
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10)

      // Verify user creation
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          passwordHash: 'hashed-password-123',
          role: 'USER',
        },
      })

      // Verify verification token creation
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith({
        data: {
          identifier: 'newuser@example.com',
          token: 'verification-token-abc',
          expires: expect.any(Date),
        },
      })

      // Verify email generation and sending
      expect(mockGenerateVerificationEmail).toHaveBeenCalledWith('verification-token-abc')
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: 'Verify your email',
        html: '<html>Verification Email</html>',
      })
    })

    it('generates token that expires in 24 hours', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcryptHash.mockResolvedValue('hashed-password')
      mockGenerateToken.mockReturnValue('token')
      mockGenerateVerificationEmail.mockResolvedValue('<html>Email</html>')

      const before = Date.now()

      // Act
      await signupAction({ email: 'test@example.com', password: 'password123' })

      const after = Date.now()

      // Assert
      const createCall = mockPrisma.verificationToken.create.mock.calls[0][0]
      const expiresDate = createCall.data.expires as Date
      const expiresTime = expiresDate.getTime()

      // Should be ~24 hours from now (with 1 second tolerance)
      const expectedMin = before + 24 * 60 * 60 * 1000 - 1000
      const expectedMax = after + 24 * 60 * 60 * 1000 + 1000

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
      const input = {
        email: 'not-an-email',
        password: 'password123',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result).toEqual({ error: 'Invalid email address' })
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('returns error for short password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'short',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result).toEqual({ error: 'Password must be at least 8 characters' })
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('returns error for missing email', async () => {
      // Arrange
      const input = {
        password: 'password123',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('returns error for missing password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when email already registered', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
        passwordHash: 'hash',
        emailVerified: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const input = {
        email: 'existing@example.com',
        password: 'password123',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result).toEqual({ error: 'Email already registered' })
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('handles database connection errors', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Act & Assert
      await expect(signupAction(input)).rejects.toThrow('Database connection failed')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty string email', async () => {
      // Arrange
      const input = {
        email: '',
        password: 'password123',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('handles empty string password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: '',
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('handles malformed data', async () => {
      // Arrange
      const input = {
        email: 123,
        password: true,
      }

      // Act
      const result = await signupAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles null input', async () => {
      // Act
      const result = await signupAction(null)

      // Assert
      expect(result.error).toBeDefined()
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('handles email sending failure gracefully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcryptHash.mockResolvedValue('hashed-password')
      mockGenerateToken.mockReturnValue('token')
      mockGenerateVerificationEmail.mockResolvedValue('<html>Email</html>')
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'))

      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Act & Assert
      await expect(signupAction(input)).rejects.toThrow('Email service unavailable')
    })

    it('handles token generation failure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcryptHash.mockResolvedValue('hashed-password')
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerified: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.verificationToken.create.mockRejectedValue(new Error('Token creation failed'))

      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Act & Assert
      await expect(signupAction(input)).rejects.toThrow('Token creation failed')
    })
  })
})
