import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCKS - Must be before imports
// =============================================================================

// Create mocks using vi.hoisted
const { mockAuth, mockDeleteObject, mockRevalidatePath, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDeleteObject: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockPrisma: {
    userProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/r2', () => ({
  deleteObject: mockDeleteObject,
  getUploadUrl: vi.fn(),
  getDownloadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// Import AFTER mocks are set up
import { deleteAvatarAction } from '../delete-avatar'

describe('deleteAvatarAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('deletes avatar from R2 and DB when avatar exists', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'https://cdn.example.com/avatars/user-123/1234567890.jpg',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)
      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ success: true })

      // Verify profile lookup
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { avatar: true },
      })

      // Verify R2 deletion with correct key
      expect(mockDeleteObject).toHaveBeenCalledWith('avatars/user-123/1234567890.jpg')

      // Verify DB update
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { avatar: null },
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/profile')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it('updates DB when no avatar exists (sets null anyway)', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-456', email: 'noavatar@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-456',
        userId: 'user-456',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-456',
        userId: 'user-456',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ success: true })

      // Should NOT call deleteObject if no avatar
      expect(mockDeleteObject).not.toHaveBeenCalled()

      // Should still update DB (idempotent)
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        data: { avatar: null },
      })

      // CRITICAL: Still revalidate
      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/profile')
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns error when not authenticated (no session)', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(mockPrisma.userProfile.findUnique).not.toHaveBeenCalled()
      expect(mockDeleteObject).not.toHaveBeenCalled()
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when session has no user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(mockPrisma.userProfile.findUnique).not.toHaveBeenCalled()
    })

    it('returns error when session has no user ID', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: undefined, email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when profile not found and update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-999', email: 'orphan@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue(null)
      // Simulate Prisma behavior: update throws when record doesn't exist
      mockPrisma.userProfile.update.mockRejectedValue(new Error('Record to update not found'))

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Failed to delete avatar' })
      expect(mockDeleteObject).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when DB update fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'https://cdn.example.com/avatars/user-123/1234567890.jpg',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)
      mockPrisma.userProfile.update.mockRejectedValue(new Error('Database connection lost'))

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Failed to delete avatar' })
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('returns error when R2 deletion fails', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'https://cdn.example.com/avatars/user-123/1234567890.jpg',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockRejectedValue(new Error('R2 service unavailable'))

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Failed to delete avatar' })
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles invalid avatar URL gracefully', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'not-a-valid-url',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert
      expect(result).toEqual({ error: 'Failed to delete avatar' })
    })

    it('handles empty string avatar URL', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: '',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const result = await deleteAvatarAction()

      // Assert - Empty string is falsy, so deleteObject not called
      expect(result).toEqual({ success: true })
      expect(mockDeleteObject).not.toHaveBeenCalled()
      expect(mockPrisma.userProfile.update).toHaveBeenCalled()
    })

    it('extracts correct key from different URL formats', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'https://different-cdn.com/avatars/user-123/file.png',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)
      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      await deleteAvatarAction()

      // Assert - Key should be pathname without leading slash
      expect(mockDeleteObject).toHaveBeenCalledWith('avatars/user-123/file.png')
    })

    it('handles URLs with query parameters', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: 'https://cdn.example.com/avatars/user-123/file.jpg?v=123',
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockDeleteObject.mockResolvedValue(undefined)
      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      await deleteAvatarAction()

      // Assert - Query params should be ignored (pathname only)
      expect(mockDeleteObject).toHaveBeenCalledWith('avatars/user-123/file.jpg')
    })
  })

  // ===========================================================================
  // CACHE REVALIDATION
  // ===========================================================================

  describe('Cache Revalidation', () => {
    it('revalidates correct path on success', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.userProfile.update.mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        avatar: null,
        bio: null,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      await deleteAvatarAction()

      // Assert - Must revalidate profile page
      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/profile')
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it('does not revalidate on auth error', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      await deleteAvatarAction()

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('does not revalidate on DB error', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockPrisma.userProfile.findUnique.mockRejectedValue(new Error('DB error'))

      // Act
      await deleteAvatarAction()

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
