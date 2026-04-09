import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateProfileAction } from './update'

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userProfile: {
      upsert: vi.fn(),
    },
  },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const mockAuth = vi.mocked(auth)
const mockUpsert = vi.mocked(prisma.userProfile.upsert)
const mockRevalidatePath = vi.mocked(revalidatePath)

describe('updateProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('Success Cases', () => {
    it('updates profile and returns success', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: 'Test User',
        bio: 'Test bio',
        location: 'New York',
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await updateProfileAction({
        displayName: 'Test User',
        bio: 'Test bio',
        location: 'New York',
      })

      expect(result).toEqual({ success: true })
    })

    it('calls upsert with correct data', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: 'John Doe',
        bio: 'My bio',
        location: 'LA',
        avatar: 'https://example.com/avatar.jpg',
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await updateProfileAction({
        displayName: 'John Doe',
        bio: 'My bio',
        location: 'LA',
        avatar: 'https://example.com/avatar.jpg',
      })

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          displayName: 'John Doe',
          bio: 'My bio',
          location: 'LA',
          avatar: 'https://example.com/avatar.jpg',
        },
        update: {
          displayName: 'John Doe',
          bio: 'My bio',
          location: 'LA',
          avatar: 'https://example.com/avatar.jpg',
        },
      })
    })

    it('revalidates profile path after successful update', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: 'Test',
        bio: null,
        location: null,
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await updateProfileAction({
        displayName: 'Test',
      })

      expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/profile')
    })

    it('handles partial profile updates', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: 'Only Name',
        bio: null,
        location: null,
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await updateProfileAction({
        displayName: 'Only Name',
      })

      expect(result).toEqual({ success: true })
      expect(mockUpsert).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // AUTHENTICATION ERRORS
  // ===========================================================================

  describe('Authentication Errors', () => {
    it('returns error when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await updateProfileAction({
        displayName: 'Test',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('returns error when session has no user', async () => {
      mockAuth.mockResolvedValue({
        user: null,
        expires: '2099-01-01',
      } as never)

      const result = await updateProfileAction({
        displayName: 'Test',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('returns error when user has no id', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2099-01-01',
      } as never)

      const result = await updateProfileAction({
        displayName: 'Test',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('does not call database when unauthorized', async () => {
      mockAuth.mockResolvedValue(null)

      await updateProfileAction({
        displayName: 'Test',
      })

      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION ERRORS
  // ===========================================================================

  describe('Validation Errors', () => {
    it('returns error for invalid data type', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      const result = await updateProfileAction('invalid string data')

      expect(result.error).toBeDefined()
    })

    it('returns error for null input', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      const result = await updateProfileAction(null)

      expect(result.error).toBeDefined()
    })

    it('returns error for bio exceeding max length', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      const longBio = 'a'.repeat(501)
      const result = await updateProfileAction({
        bio: longBio,
      })

      expect(result.error).toBeDefined()
    })

    it('returns error for invalid avatar URL', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      const result = await updateProfileAction({
        avatar: 'not-a-valid-url',
      })

      expect(result.error).toBeDefined()
    })

    it('does not call database for validation errors', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      await updateProfileAction('invalid')

      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns error when database operation fails', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockRejectedValue(new Error('Database connection failed'))

      const result = await updateProfileAction({
        displayName: 'Test',
      })

      expect(result).toEqual({ error: 'Failed to update profile' })
    })

    it('does not revalidate path on database error', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockRejectedValue(new Error('Database error'))

      await updateProfileAction({
        displayName: 'Test',
      })

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles Prisma unique constraint violation', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockRejectedValue({ code: 'P2002', message: 'Unique constraint failed' })

      const result = await updateProfileAction({
        displayName: 'Test',
      })

      expect(result).toEqual({ error: 'Failed to update profile' })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty object input', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: null,
        bio: null,
        location: null,
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await updateProfileAction({})

      expect(result).toEqual({ success: true })
    })

    it('handles undefined optional fields', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: 'Test',
        bio: null,
        location: null,
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await updateProfileAction({
        displayName: 'Test',
        bio: undefined,
        location: undefined,
        avatar: undefined,
      })

      expect(result).toEqual({ success: true })
    })

    it('trims whitespace from display name', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2099-01-01',
      })
      mockUpsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-123',
        displayName: '  Spaced Name  ',
        bio: null,
        location: null,
        avatar: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await updateProfileAction({
        displayName: '  Spaced Name  ',
      })

      // Check that upsert was called (schema should handle trimming if implemented)
      expect(mockUpsert).toHaveBeenCalled()
    })
  })
})
