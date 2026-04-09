import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCKS - Use vi.hoisted to make mock available to vi.mock factory
// =============================================================================

const { mockSendFn, mockGetSignedUrl } = vi.hoisted(() => {
  return {
    mockSendFn: vi.fn(),
    mockGetSignedUrl: vi.fn(),
  }
})

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockSendFn,
    })),
    PutObjectCommand: vi.fn((params) => params),
    GetObjectCommand: vi.fn((params) => params),
    DeleteObjectCommand: vi.fn((params) => params),
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}))

// Import after mocks are set up
import {
  getVideoUploadUrl,
  getVideoDownloadUrl,
  getHlsPublicUrl,
  deleteVideoObject,
  isValidVideoType,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE,
} from './r2-video'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

describe('r2-video module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendFn.mockResolvedValue({})
    mockGetSignedUrl.mockResolvedValue('https://r2.example.com/presigned-url')
  })

  // ===========================================================================
  // getVideoUploadUrl
  // ===========================================================================

  describe('getVideoUploadUrl', () => {
    it('generates presigned URL with correct parameters', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
        contentType: 'video/mp4',
      }

      // Act
      const url = await getVideoUploadUrl(options)

      // Assert
      expect(url).toBe('https://r2.example.com/presigned-url')
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: options.key,
          ContentType: options.contentType,
        })
      )
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
    })

    it('uses default expiry time of 3600 seconds', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
        contentType: 'video/mp4',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 }
      )
    })

    it('uses custom expiry time when provided', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
        contentType: 'video/mp4',
        expiresIn: 7200,
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 7200 }
      )
    })

    it('handles video/quicktime content type', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-mov',
        contentType: 'video/quicktime',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'video/quicktime',
        })
      )
    })

    it('handles video/webm content type', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-webm',
        contentType: 'video/webm',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'video/webm',
        })
      )
    })

    it('throws error when getSignedUrl fails', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
        contentType: 'video/mp4',
      }
      mockGetSignedUrl.mockRejectedValue(new Error('R2 service unavailable'))

      // Act & Assert
      await expect(getVideoUploadUrl(options)).rejects.toThrow('R2 service unavailable')
    })
  })

  // ===========================================================================
  // getVideoDownloadUrl
  // ===========================================================================

  describe('getVideoDownloadUrl', () => {
    it('generates presigned URL for download', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
      }

      // Act
      const url = await getVideoDownloadUrl(options)

      // Assert
      expect(url).toBe('https://r2.example.com/presigned-url')
      expect(GetObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: options.key,
        })
      )
    })

    it('uses default expiry time of 3600 seconds', async () => {
      // Arrange
      const options = { key: 'shorts/company-1/video-123' }

      // Act
      await getVideoDownloadUrl(options)

      // Assert
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 }
      )
    })

    it('uses custom expiry time when provided', async () => {
      // Arrange
      const options = {
        key: 'shorts/company-1/video-123',
        expiresIn: 1800,
      }

      // Act
      await getVideoDownloadUrl(options)

      // Assert
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 1800 }
      )
    })

    it('throws error when getSignedUrl fails', async () => {
      // Arrange
      const options = { key: 'shorts/company-1/video-123' }
      mockGetSignedUrl.mockRejectedValue(new Error('Access denied'))

      // Act & Assert
      await expect(getVideoDownloadUrl(options)).rejects.toThrow('Access denied')
    })
  })

  // ===========================================================================
  // getHlsPublicUrl
  // ===========================================================================

  describe('getHlsPublicUrl', () => {
    it('returns public URL for HLS key', () => {
      // Act
      const url = getHlsPublicUrl('shorts/company-1/master.m3u8')

      // Assert
      expect(url).toContain('shorts/company-1/master.m3u8')
    })

    it('handles nested path keys', () => {
      // Act
      const url = getHlsPublicUrl('shorts/company-1/video-123/playlist.m3u8')

      // Assert
      expect(url).toContain('shorts/company-1/video-123/playlist.m3u8')
    })

    it('handles special characters in key', () => {
      // Act
      const url = getHlsPublicUrl('shorts/company-1/video name.m3u8')

      // Assert
      expect(url).toContain('shorts/company-1/video name.m3u8')
    })
  })

  // ===========================================================================
  // deleteVideoObject
  // ===========================================================================

  describe('deleteVideoObject', () => {
    it('deletes video object with correct key', async () => {
      // Arrange
      const key = 'shorts/company-1/video-123'

      // Act
      await deleteVideoObject(key)

      // Assert
      expect(mockSendFn).toHaveBeenCalledTimes(1)
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('resolves successfully when deletion succeeds', async () => {
      // Arrange
      const key = 'shorts/company-1/video-123'
      mockSendFn.mockResolvedValue({ $metadata: { httpStatusCode: 204 } })

      // Act
      const result = await deleteVideoObject(key)

      // Assert
      expect(result).toBeUndefined()
    })

    it('throws error when deletion fails', async () => {
      // Arrange
      const key = 'shorts/company-1/video-123'
      mockSendFn.mockRejectedValue(new Error('R2 service unavailable'))

      // Act & Assert
      await expect(deleteVideoObject(key)).rejects.toThrow('R2 service unavailable')
    })

    it('handles non-existent key gracefully (R2 behavior)', async () => {
      // Arrange
      const key = 'shorts/nonexistent/video'
      mockSendFn.mockResolvedValue({ $metadata: { httpStatusCode: 204 } })

      // Act & Assert - R2/S3 returns success even for non-existent keys
      await expect(deleteVideoObject(key)).resolves.toBeUndefined()
    })
  })

  // ===========================================================================
  // isValidVideoType
  // ===========================================================================

  describe('isValidVideoType', () => {
    it('returns true for video/mp4', () => {
      expect(isValidVideoType('video/mp4')).toBe(true)
    })

    it('returns true for video/quicktime', () => {
      expect(isValidVideoType('video/quicktime')).toBe(true)
    })

    it('returns true for video/webm', () => {
      expect(isValidVideoType('video/webm')).toBe(true)
    })

    it('returns false for image/jpeg', () => {
      expect(isValidVideoType('image/jpeg')).toBe(false)
    })

    it('returns false for application/pdf', () => {
      expect(isValidVideoType('application/pdf')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidVideoType('')).toBe(false)
    })

    it('returns false for video/avi (not in allowed list)', () => {
      expect(isValidVideoType('video/avi')).toBe(false)
    })
  })

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('Constants', () => {
    it('ALLOWED_VIDEO_TYPES contains mp4, quicktime, and webm', () => {
      expect(ALLOWED_VIDEO_TYPES).toContain('video/mp4')
      expect(ALLOWED_VIDEO_TYPES).toContain('video/quicktime')
      expect(ALLOWED_VIDEO_TYPES).toContain('video/webm')
      expect(ALLOWED_VIDEO_TYPES).toHaveLength(3)
    })

    it('MAX_VIDEO_SIZE is 100MB', () => {
      expect(MAX_VIDEO_SIZE).toBe(100_000_000)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles very long key paths in upload', async () => {
      // Arrange
      const longKey = 'shorts/' + 'a'.repeat(500) + '/video.mp4'
      const options = {
        key: longKey,
        contentType: 'video/mp4',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: longKey,
        })
      )
    })

    it('handles special characters in key path', async () => {
      // Arrange
      const key = 'shorts/company-1/video with spaces.mp4'
      const options = {
        key,
        contentType: 'video/mp4',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })

    it('handles unicode characters in key path', async () => {
      // Arrange
      const key = 'shorts/company-1/wideo.mp4' // Polish character
      const options = {
        key,
        contentType: 'video/mp4',
      }

      // Act
      await getVideoUploadUrl(options)

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      )
    })
  })
})
