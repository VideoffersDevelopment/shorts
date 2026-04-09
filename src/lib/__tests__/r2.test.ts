import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCKS - Use vi.hoisted to make mock available to vi.mock factory
// =============================================================================

const { mockSendFn } = vi.hoisted(() => {
  return { mockSendFn: vi.fn() }
})

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockSendFn,
    })),
    DeleteObjectCommand: vi.fn((params) => params),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
  }
})

// Import after mocks are set up
import { deleteObject } from '../r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

describe('deleteObject (R2 utility)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendFn.mockResolvedValue({})
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('calls S3Client send with DeleteObjectCommand', async () => {
      // Arrange
      const key = 'avatars/user-123/1234567890.jpg'

      // Act
      await deleteObject(key)

      // Assert
      expect(mockSendFn).toHaveBeenCalledTimes(1)
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('handles nested folder paths', async () => {
      // Arrange
      const key = 'avatars/subfolder/user-456/file.png'

      // Act
      await deleteObject(key)

      // Assert
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('resolves successfully when deletion succeeds', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'
      mockSendFn.mockResolvedValue({ $metadata: { httpStatusCode: 204 } })

      // Act
      const result = await deleteObject(key)

      // Assert
      expect(result).toBeUndefined() // Function returns void
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('throws error when R2 deletion fails', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'
      const error = new Error('R2 service unavailable')
      mockSendFn.mockRejectedValue(error)

      // Act & Assert
      await expect(deleteObject(key)).rejects.toThrow('R2 service unavailable')
    })

    it('throws error when bucket not found', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'
      const error = { Code: 'NoSuchBucket', message: 'Bucket does not exist' }
      mockSendFn.mockRejectedValue(error)

      // Act & Assert
      await expect(deleteObject(key)).rejects.toEqual(error)
    })

    it('handles network errors', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'
      const error = new Error('Network timeout')
      mockSendFn.mockRejectedValue(error)

      // Act & Assert
      await expect(deleteObject(key)).rejects.toThrow('Network timeout')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles deletion of non-existent key gracefully', async () => {
      // Arrange
      const key = 'avatars/nonexistent.jpg'
      // R2/S3 returns success even if key doesn't exist
      mockSendFn.mockResolvedValue({ $metadata: { httpStatusCode: 204 } })

      // Act & Assert - Should not throw error
      await expect(deleteObject(key)).resolves.toBeUndefined()
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('handles special characters in key', async () => {
      // Arrange
      const key = 'avatars/user-123/file name with spaces.jpg'

      // Act
      await deleteObject(key)

      // Assert
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('handles unicode characters in key', async () => {
      // Arrange
      const key = 'avatars/user-123/аватар.jpg' // Cyrillic characters

      // Act
      await deleteObject(key)

      // Assert
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('handles very long key paths', async () => {
      // Arrange
      const longKey = 'avatars/' + 'a'.repeat(1000) + '/file.jpg'

      // Act
      await deleteObject(longKey)

      // Assert
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: longKey,
        })
      )
    })
  })

  // ===========================================================================
  // COMMAND CONSTRUCTION
  // ===========================================================================

  describe('Command Construction', () => {
    it('creates DeleteObjectCommand with Bucket and Key', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'

      // Act
      await deleteObject(key)

      // Assert - Should have Bucket and Key
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
          Bucket: expect.any(String),
        })
      )
    })

    it('passes correct key to DeleteObjectCommand', async () => {
      // Arrange
      const key = 'test/folder/file.jpg'

      // Act
      await deleteObject(key)

      // Assert
      const callArgs = vi.mocked(DeleteObjectCommand).mock.calls[0][0]
      expect(callArgs.Key).toBe(key)
    })
  })

  // ===========================================================================
  // INTEGRATION
  // ===========================================================================

  describe('Integration with S3Client', () => {
    it('sends command through S3Client', async () => {
      // Arrange
      const key = 'avatars/user-123/file.jpg'

      // Act
      await deleteObject(key)

      // Assert
      expect(mockSendFn).toHaveBeenCalledTimes(1)
    })

    it('handles multiple deletions sequentially', async () => {
      // Arrange
      const keys = [
        'avatars/user-1/file1.jpg',
        'avatars/user-2/file2.jpg',
        'avatars/user-3/file3.jpg',
      ]

      // Act
      for (const key of keys) {
        await deleteObject(key)
      }

      // Assert - Should call send for each key
      expect(mockSendFn).toHaveBeenCalledTimes(3)
    })
  })
})
