import { describe, it, expect, vi, beforeEach } from 'vitest'
import { changePasswordAction } from './change-password'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

const mockPrisma = vi.mocked(prisma)
const mockBcryptCompare = vi.mocked(bcrypt.compare)
const mockBcryptHash = vi.mocked(bcrypt.hash)

// Import after mocking
import { auth, signOut } from '@/lib/auth'
const mockAuth = vi.mocked(auth)
const mockSignOut = vi.mocked(signOut)

describe('changePasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('changes password successfully with valid data', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('new-hashed-password')
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'new-hashed-password',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 })

      const input = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-password' },
      })
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    })

    it('invalidates all sessions after password change', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('new-hash')
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 })

      const input = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      await changePasswordAction(input)

      // Assert
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('hashes new password with bcrypt salt rounds 10', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('hashed')

      const input = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      await changePasswordAction(input)

      // Assert
      expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10)
    })
  })

  // ===========================================================================
  // AUTHENTICATION FAILURES
  // ===========================================================================

  describe('Authentication Failures', () => {
    it('returns error when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when session has no user id', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error when current password is missing', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = {
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when new password is too short', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = {
        currentPassword: 'currentpass',
        newPassword: 'short',
        confirmPassword: 'short',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result.error).toContain('8 characters')
    })

    it('returns error when passwords do not match', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = {
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result.error).toContain("match")
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    it('returns error for OAuth account (no passwordHash)', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: null, // OAuth account
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Account created with OAuth' })
      expect(mockBcryptCompare).not.toHaveBeenCalled()
    })

    it('returns error when current password is wrong', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(false) // Wrong password

      const input = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Wrong current password' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('throws when user lookup fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act & Assert
      await expect(changePasswordAction(input)).rejects.toThrow('Database error')
    })

    it('throws when password update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('new-hash')
      mockPrisma.user.update.mockRejectedValue(new Error('Update failed'))

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act & Assert
      await expect(changePasswordAction(input)).rejects.toThrow('Update failed')
    })

    it('handles user not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result).toEqual({ error: 'Account created with OAuth' })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null input', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      // Act
      const result = await changePasswordAction(null)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles undefined input', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      // Act
      const result = await changePasswordAction(undefined)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles malformed input', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = {
        currentPassword: 123,
        newPassword: true,
        confirmPassword: [],
      }

      // Act
      const result = await changePasswordAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('signs out user after successful password change', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('new-hash')
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'new-hash',
        emailVerified: new Date(),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 })

      const input = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      // Act
      await changePasswordAction(input)

      // Assert
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    })
  })
})
