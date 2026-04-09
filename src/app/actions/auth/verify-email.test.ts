import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyEmailAction } from './verify-email'
import { prisma } from '@/lib/prisma'

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

const mockPrisma = vi.mocked(prisma)

describe('verifyEmailAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('verifies email with valid token and returns success', async () => {
      // Arrange
      const token = 'valid-token-123'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
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

      // Act
      const result = await verifyEmailAction(token)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify token lookup
      expect(mockPrisma.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token },
      })

      // Verify user email verification
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: { emailVerified: expect.any(Date) },
      })

      // Verify token deletion
      expect(mockPrisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token },
      })
    })

    it('sets emailVerified to current timestamp', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      const before = Date.now()

      // Act
      await verifyEmailAction(token)

      const after = Date.now()

      // Assert
      const updateCall = mockPrisma.user.update.mock.calls[0][0]
      const emailVerifiedDate = updateCall.data.emailVerified as Date
      const emailVerifiedTime = emailVerifiedDate.getTime()

      expect(emailVerifiedTime).toBeGreaterThanOrEqual(before)
      expect(emailVerifiedTime).toBeLessThanOrEqual(after)
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error when token is empty string', async () => {
      // Act
      const result = await verifyEmailAction('')

      // Assert
      expect(result).toEqual({ error: 'Token is required' })
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when token is undefined', async () => {
      // Act
      const result = await verifyEmailAction(undefined as unknown as string)

      // Assert
      expect(result).toEqual({ error: 'Token is required' })
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when token is null', async () => {
      // Act
      const result = await verifyEmailAction(null as unknown as string)

      // Assert
      expect(result).toEqual({ error: 'Token is required' })
      expect(mockPrisma.verificationToken.findUnique).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when token not found', async () => {
      // Arrange
      mockPrisma.verificationToken.findUnique.mockResolvedValue(null)

      // Act
      const result = await verifyEmailAction('nonexistent-token')

      // Assert
      expect(result).toEqual({ error: 'Token expired or invalid' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
      expect(mockPrisma.verificationToken.delete).not.toHaveBeenCalled()
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

      // Act
      const result = await verifyEmailAction(token)

      // Assert
      expect(result).toEqual({ error: 'Token expired or invalid' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
      expect(mockPrisma.verificationToken.delete).not.toHaveBeenCalled()
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

      mockPrisma.user.update.mockRejectedValue(new Error('User not found'))

      // Act & Assert
      await expect(verifyEmailAction(token)).rejects.toThrow('User not found')
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

      // Act
      const result = await verifyEmailAction(token)

      // Assert - tokens expiring "now" should be considered expired
      expect(result).toEqual({ error: 'Token expired or invalid' })
    })

    it('handles very long token strings', async () => {
      // Arrange
      const longToken = 'a'.repeat(1000)
      mockPrisma.verificationToken.findUnique.mockResolvedValue(null)

      // Act
      const result = await verifyEmailAction(longToken)

      // Assert
      expect(result).toEqual({ error: 'Token expired or invalid' })
      expect(mockPrisma.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token: longToken },
      })
    })

    it.skip('handles special characters in token', async () => {
      // Arrange
      const specialToken = 'token-with-special-chars-!@#$%^&*()'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token: specialToken,
        expires: futureDate,
      })

      // Act
      const result = await verifyEmailAction(specialToken)

      // Assert
      expect(result).toEqual({ success: true })
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

      // Act & Assert
      await expect(verifyEmailAction('token')).rejects.toThrow('Database connection failed')
    })

    it('handles token deletion failure after successful verification', async () => {
      // Arrange
      const token = 'valid-token'
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)

      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'user@example.com',
        token,
        expires: futureDate,
      })

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.verificationToken.delete.mockRejectedValue(new Error('Delete failed'))

      // Act & Assert
      await expect(verifyEmailAction(token)).rejects.toThrow('Delete failed')
    })
  })
})
