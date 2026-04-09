import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetPasswordAction } from './reset-password'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

const mockPrisma = vi.mocked(prisma)
const mockBcryptHash = vi.mocked(bcrypt.hash)

describe('resetPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('resets password with valid token and returns success', async () => {
      // Arrange
      const token = 'valid-reset-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockBcryptHash.mockResolvedValue('new-hashed-password')

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'new-hashed-password',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.verificationToken.delete.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      const input = {
        token,
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify token lookup
      expect(mockPrisma.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token },
      })

      // Verify password hashing
      expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10)

      // Verify user password update
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: { passwordHash: 'new-hashed-password' },
      })

      // Verify token deletion
      expect(mockPrisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token },
      })
    })

    it('hashes password with bcrypt salt rounds 10', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockBcryptHash.mockResolvedValue('hashed')

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      await resetPasswordAction(input)

      // Assert
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10)
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error when passwords do not match', async () => {
      // Arrange
      const input = {
        token: 'token',
        password: 'password123',
        confirmPassword: 'different-password',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result).toEqual({ error: "Passwords don't match" })
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when password is too short', async () => {
      // Arrange
      const input = {
        token: 'token',
        password: 'short',
        confirmPassword: 'short',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Password must be at least 8 characters' })
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when token is missing', async () => {
      // Arrange
      const input = {
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when password is missing', async () => {
      // Arrange
      const input = {
        token: 'token',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('returns error when confirmPassword is missing', async () => {
      // Arrange
      const input = {
        token: 'token',
        password: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when token not found', async () => {
      // Arrange
      mockPrisma.verificationToken.findUnique.mockResolvedValue(null)

      const input = {
        token: 'nonexistent-token',
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Token expired or invalid' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('returns error when token is expired', async () => {
      // Arrange
      const token = 'expired-token'
      const pastDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: pastDate,
      })

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Token expired or invalid' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('handles user update failure', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockBcryptHash.mockResolvedValue('hashed-password')
      mockPrisma.user.update.mockRejectedValue(new Error('User not found'))

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act & Assert
      await expect(resetPasswordAction(input)).rejects.toThrow('User not found')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it.skip('returns error when token expires exactly now', async () => {
      // Arrange
      const token = 'token'
      const now = new Date()

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: now,
      })

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert - tokens expiring "now" should be considered expired
      expect(result).toEqual({ error: 'Token expired or invalid' })
    })

    it('handles empty token string', async () => {
      // Arrange
      const input = {
        token: '',
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles empty password strings', async () => {
      // Arrange
      const input = {
        token: 'token',
        password: '',
        confirmPassword: '',
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles malformed data', async () => {
      // Arrange
      const input = {
        token: 123,
        password: true,
        confirmPassword: [],
      }

      // Act
      const result = await resetPasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles null input', async () => {
      // Act
      const result = await resetPasswordAction(null)

      // Assert
      expect(result.error).toBeDefined()
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      // Arrange
      mockPrisma.verificationToken.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      const input = {
        token: 'token',
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act & Assert
      await expect(resetPasswordAction(input)).rejects.toThrow('Database connection failed')
    })

    it('handles bcrypt hashing failure', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockBcryptHash.mockRejectedValue(new Error('Hashing failed'))

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act & Assert
      await expect(resetPasswordAction(input)).rejects.toThrow('Hashing failed')
    })

    it('handles token deletion failure after successful reset', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockBcryptHash.mockResolvedValue('hashed-password')

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.verificationToken.delete.mockRejectedValue(new Error('Delete failed'))

      const input = {
        token,
        password: 'password123',
        confirmPassword: 'password123',
      }

      // Act & Assert
      await expect(resetPasswordAction(input)).rejects.toThrow('Delete failed')
    })
  })
})
