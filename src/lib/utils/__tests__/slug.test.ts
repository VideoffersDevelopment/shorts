import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSlug } from '../slug'

describe('generateSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // BASIC FUNCTIONALITY
  // ===========================================================================

  describe('Basic Functionality', () => {
    it('generates slug from text', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test Company', mockModel)

      // Assert
      expect(slug).toBe('test-company')
      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-company' }
      })
    })

    it('handles Polish characters', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Żółta Łódka', mockModel)

      // Assert
      expect(slug).toBe('zolta-lodka')
    })

    it('converts to lowercase', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('UPPERCASE TEXT', mockModel)

      // Assert
      expect(slug).toBe('uppercase-text')
    })

    it('handles special characters', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test & Company!', mockModel)

      // Assert
      // Note: & is converted to 'and' by slugify with strict: true
      expect(slug).toBe('test-and-company')
    })

    it('replaces spaces with hyphens', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Multi Word Title', mockModel)

      // Assert
      expect(slug).toBe('multi-word-title')
    })

    it('handles multiple consecutive spaces', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test    Multiple    Spaces', mockModel)

      // Assert
      expect(slug).toBe('test-multiple-spaces')
    })
  })

  // ===========================================================================
  // CONFLICT RESOLUTION
  // ===========================================================================

  describe('Conflict Resolution', () => {
    it('appends number on conflict', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ slug: 'test' }) // First call: exists
          .mockResolvedValueOnce(null) // Second call: doesn't exist
      }

      // Act
      const slug = await generateSlug('Test', mockModel)

      // Assert
      expect(slug).toBe('test-1')
      expect(mockModel.findUnique).toHaveBeenCalledTimes(2)
      expect(mockModel.findUnique).toHaveBeenNthCalledWith(1, { where: { slug: 'test' } })
      expect(mockModel.findUnique).toHaveBeenNthCalledWith(2, { where: { slug: 'test-1' } })
    })

    it('increments number until unique', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ slug: 'test' })
          .mockResolvedValueOnce({ slug: 'test-1' })
          .mockResolvedValueOnce({ slug: 'test-2' })
          .mockResolvedValueOnce(null)
      }

      // Act
      const slug = await generateSlug('Test', mockModel)

      // Assert
      expect(slug).toBe('test-3')
      expect(mockModel.findUnique).toHaveBeenCalledTimes(4)
    })

    it('handles high conflict numbers', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ slug: 'popular' })
          .mockResolvedValueOnce({ slug: 'popular-1' })
          .mockResolvedValueOnce({ slug: 'popular-2' })
          .mockResolvedValueOnce({ slug: 'popular-3' })
          .mockResolvedValueOnce({ slug: 'popular-4' })
          .mockResolvedValueOnce(null)
      }

      // Act
      const slug = await generateSlug('Popular', mockModel)

      // Assert
      expect(slug).toBe('popular-5')
    })
  })

  // ===========================================================================
  // MAX RETRIES & FALLBACK
  // ===========================================================================

  describe('Max Retries & Fallback', () => {
    it('falls back to timestamp after max retries', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn().mockResolvedValue({ slug: 'exists' })
      }
      const timestampBefore = Date.now()

      // Act
      const slug = await generateSlug('Test', mockModel, 3)

      // Assert
      const timestampAfter = Date.now()
      expect(slug).toMatch(/^test-\d+$/) // test-<timestamp>

      // Extract timestamp from slug
      const timestamp = parseInt(slug.split('-')[1])
      expect(timestamp).toBeGreaterThanOrEqual(timestampBefore)
      expect(timestamp).toBeLessThanOrEqual(timestampAfter)
    })

    it('respects custom maxRetries parameter', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn().mockResolvedValue({ slug: 'exists' })
      }

      // Act
      await generateSlug('Test', mockModel, 5)

      // Assert
      expect(mockModel.findUnique).toHaveBeenCalledTimes(5)
    })

    it('uses default maxRetries of 10', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn().mockResolvedValue({ slug: 'exists' })
      }

      // Act
      await generateSlug('Test', mockModel)

      // Assert
      expect(mockModel.findUnique).toHaveBeenCalledTimes(10)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty string', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('', mockModel)

      // Assert
      expect(slug).toBe('')
    })

    it('handles only special characters', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('!@#$%^&*()', mockModel)

      // Assert
      // Note: Some special chars are converted to words by slugify
      // $ -> dollar, % -> percent, & -> and
      expect(slug).toMatch(/^[a-z-]*$/) // Valid slug format
      expect(slug.length).toBeGreaterThan(0)
    })

    it('handles numbers', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('123 Test 456', mockModel)

      // Assert
      expect(slug).toBe('123-test-456')
    })

    it('handles mixed Polish and English characters', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test Żółw Company', mockModel)

      // Assert
      expect(slug).toBe('test-zolw-company')
    })

    it('handles very long text', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }
      const longText = 'A'.repeat(200)

      // Act
      const slug = await generateSlug(longText, mockModel)

      // Assert
      expect(slug.length).toBeGreaterThan(0)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    })

    it('handles Unicode emojis', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test 🚀 Company', mockModel)

      // Assert
      expect(slug).toBe('test-company')
    })

    it('handles leading and trailing spaces', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('  Test Company  ', mockModel)

      // Assert
      expect(slug).toBe('test-company')
    })

    it('handles hyphens in input', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Test-Company-Name', mockModel)

      // Assert
      expect(slug).toBe('test-company-name')
    })
  })

  // ===========================================================================
  // MODEL INTERACTION
  // ===========================================================================

  describe('Model Interaction', () => {
    it('calls findUnique with correct parameters', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      await generateSlug('Test', mockModel)

      // Assert
      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test' }
      })
    })

    it('stops checking after finding unique slug', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ slug: 'test' })
          .mockResolvedValueOnce({ slug: 'test-1' })
          .mockResolvedValueOnce(null)
      }

      // Act
      await generateSlug('Test', mockModel)

      // Assert
      expect(mockModel.findUnique).toHaveBeenCalledTimes(3)
    })

    it('handles database errors gracefully', async () => {
      // Arrange
      const mockModel = {
        findUnique: vi.fn().mockRejectedValue(new Error('Database error'))
      }

      // Act & Assert
      await expect(generateSlug('Test', mockModel)).rejects.toThrow('Database error')
    })
  })

  // ===========================================================================
  // POLISH LOCALE SPECIFIC
  // ===========================================================================

  describe('Polish Locale Specific', () => {
    it('handles all Polish diacritics', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ', mockModel)

      // Assert
      expect(slug).toBe('acelnoszz-acelnoszz')
    })

    it('handles Polish company name with SP Z OO', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('Testowa Firma Sp. z o.o.', mockModel)

      // Assert
      expect(slug).toBe('testowa-firma-sp-z-oo')
    })

    it('handles Polish street names', async () => {
      // Arrange
      const mockModel = { findUnique: vi.fn().mockResolvedValue(null) }

      // Act
      const slug = await generateSlug('ul. Świętokrzyska 123', mockModel)

      // Assert
      expect(slug).toBe('ul-swietokrzyska-123')
    })
  })
})
