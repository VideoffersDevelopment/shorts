import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteAccountAction } from './delete-account'
import { prisma } from '@/lib/prisma'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
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

const mockPrisma = vi.mocked(prisma)

// Import after mocking
import { auth, signOut } from '@/lib/auth'
const mockAuth = vi.mocked(auth)
const mockSignOut = vi.mocked(signOut)

describe('deleteAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('soft deletes account successfully with valid confirmation', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerified: null, // Soft deleted
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 })

      const input = { confirmation: 'DELETE' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerified: null },
      })
    })

    it('invalidates all sessions after account deletion', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 })

      const input = { confirmation: 'DELETE' }

      // Act
      await deleteAccountAction(input)

      // Assert
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('signs out user after account deletion', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: 'DELETE' }

      // Act
      await deleteAccountAction(input)

      // Assert
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    })
  })

  // ===========================================================================
  // AUTHENTICATION FAILURES
  // ===========================================================================

  describe('Authentication Failures', () => {
    it('returns error when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      const input = { confirmation: 'DELETE' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('returns error when session has no user id', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: 'DELETE' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns error when confirmation is missing', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: '' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result.error).toBeDefined()
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('returns error when confirmation is not DELETE', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: 'delete' } // lowercase

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result.error).toContain('DELETE')
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('returns error when confirmation has extra spaces', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: ' DELETE ' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('returns error for wrong confirmation text', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: 'CONFIRM' }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('throws when user update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.update.mockRejectedValue(new Error('Database error'))

      const input = { confirmation: 'DELETE' }

      // Act & Assert
      await expect(deleteAccountAction(input)).rejects.toThrow('Database error')
    })

    it('throws when session deletion fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerified: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.session.deleteMany.mockRejectedValue(new Error('Session delete failed'))

      const input = { confirmation: 'DELETE' }

      // Act & Assert
      await expect(deleteAccountAction(input)).rejects.toThrow('Session delete failed')
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
      const result = await deleteAccountAction(null)

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
      const result = await deleteAccountAction(undefined)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles malformed input', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      const input = { confirmation: 123 }

      // Act
      const result = await deleteAccountAction(input)

      // Assert
      expect(result.error).toBeDefined()
    })

    it('handles empty object input', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      // Act
      const result = await deleteAccountAction({})

      // Assert
      expect(result.error).toBeDefined()
    })

    it('soft delete sets emailVerified to null', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      })

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerified: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 })

      const input = { confirmation: 'DELETE' }

      // Act
      await deleteAccountAction(input)

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerified: null },
      })
    })
  })
})
