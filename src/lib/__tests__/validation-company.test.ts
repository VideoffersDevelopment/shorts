import { describe, it, expect } from 'vitest'
import {
  nipSchema,
  companyUpgradeSchema,
  companyProfileSchema,
  categorySchema
} from '../validation'

describe('Company Validation Schemas', () => {
  // ===========================================================================
  // NIP SCHEMA
  // ===========================================================================

  describe('nipSchema', () => {
    it('accepts 10 digit NIP', () => {
      // Act
      const result = nipSchema.safeParse('1234567890')

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('1234567890')
      }
    })

    it('accepts NIP with dashes and normalizes', () => {
      // Act
      const result = nipSchema.safeParse('12-345-678-90')

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('1234567890')
      }
    })

    it('normalizes multiple dash formats', () => {
      // Act
      const result1 = nipSchema.safeParse('12-34-567-890')
      const result2 = nipSchema.safeParse('123-456-78-90')
      const result3 = nipSchema.safeParse('1-2-3-4-5-6-7-8-9-0')

      // Assert - Only valid format: XX-XXX-XXX-XX (10 digits)
      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
      expect(result3.success).toBe(false)
    })

    it('rejects short NIP', () => {
      // Act
      const result = nipSchema.safeParse('123')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects long NIP', () => {
      // Act
      const result = nipSchema.safeParse('12345678901')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects non-numeric NIP', () => {
      // Act
      const result = nipSchema.safeParse('abcdefghij')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects NIP with letters and numbers', () => {
      // Act
      const result = nipSchema.safeParse('12345abc90')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects empty string', () => {
      // Act
      const result = nipSchema.safeParse('')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects NIP with spaces', () => {
      // Act
      const result = nipSchema.safeParse('123 456 78 90')

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects NIP with special characters', () => {
      // Act
      const result = nipSchema.safeParse('123-456.78/90')

      // Assert
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // COMPANY UPGRADE SCHEMA
  // ===========================================================================

  describe('companyUpgradeSchema', () => {
    const validData = {
      companyName: 'Test Company',
      nip: '1234567890',
      address: 'Test Street 123'
    }

    it('accepts valid data', () => {
      // Act
      const result = companyUpgradeSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid data with phone', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        phone: '+48123456789'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects short company name', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        companyName: 'A'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects long company name', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        companyName: 'A'.repeat(101)
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts company name with exactly 2 characters', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        companyName: 'AB'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts company name with exactly 100 characters', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        companyName: 'A'.repeat(100)
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects invalid NIP', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        nip: '123'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts NIP with dashes', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        nip: '12-345-678-90'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects short address', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        address: 'Test'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects long address', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        address: 'A'.repeat(201)
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts address with exactly 5 characters', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        ...validData,
        address: 'Str 1'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects missing required fields', () => {
      // Act
      const result = companyUpgradeSchema.safeParse({
        companyName: 'Test'
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // COMPANY PROFILE SCHEMA
  // ===========================================================================

  describe('companyProfileSchema', () => {
    it('accepts empty object (all optional)', () => {
      // Act
      const result = companyProfileSchema.safeParse({})

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid website URL', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        website: 'https://example.com'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts empty string for optional URL fields', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        website: ''
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects invalid website URL', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        website: 'not-a-url'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts HTTP URL', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        website: 'http://example.com'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('validates latitude range - accepts valid', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        latitude: 45.5
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('validates latitude range - rejects too high', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        latitude: 91
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('validates latitude range - rejects too low', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        latitude: -91
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('validates latitude range - accepts boundary values', () => {
      // Act
      const result1 = companyProfileSchema.safeParse({ latitude: 90 })
      const result2 = companyProfileSchema.safeParse({ latitude: -90 })

      // Assert
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('validates longitude range - accepts valid', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        longitude: 120.5
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('validates longitude range - rejects too high', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        longitude: 181
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('validates longitude range - rejects too low', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        longitude: -181
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('validates longitude range - accepts boundary values', () => {
      // Act
      const result1 = companyProfileSchema.safeParse({ longitude: 180 })
      const result2 = companyProfileSchema.safeParse({ longitude: -180 })

      // Assert
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('validates business hours format - accepts valid', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        businessHours: {
          monday: { open: '09:00', close: '17:00' }
        }
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('validates business hours format - rejects invalid format', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        businessHours: {
          monday: { open: '9:00', close: '17:00' }
        }
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('validates business hours format - accepts multiple days', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        businessHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' }
        }
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('validates business hours format - rejects 24-hour format without colon', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        businessHours: {
          monday: { open: '0900', close: '1700' }
        }
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts valid social links', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        socialLinks: {
          facebook: 'https://facebook.com/company',
          instagram: 'https://instagram.com/company',
          tiktok: 'https://tiktok.com/@company'
        }
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts empty string for social links', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        socialLinks: {
          facebook: '',
          instagram: '',
          tiktok: ''
        }
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects invalid social link URLs', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        socialLinks: {
          facebook: 'not-a-url'
        }
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts valid logo URL', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        logo: 'https://example.com/logo.png'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid banner URL', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        banner: 'https://example.com/banner.jpg'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid company name', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        companyName: 'Test Company'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects short company name', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        companyName: 'A'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts valid description', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        description: 'Company description'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects long description', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        description: 'A'.repeat(2001)
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts valid categoryId (CUID)', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        categoryId: 'clx1234567890'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts empty string for categoryId', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        categoryId: ''
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid phone number', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        phone: '+48123456789'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid address', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        address: 'Test Street 123'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects long address', () => {
      // Act
      const result = companyProfileSchema.safeParse({
        address: 'A'.repeat(201)
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // CATEGORY SCHEMA
  // ===========================================================================

  describe('categorySchema', () => {
    it('accepts valid category', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test Category',
        slug: 'test-category'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts category with all optional fields', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test Category',
        slug: 'test-category',
        icon: 'icon-name',
        parentId: 'clx1234567890',
        order: 5,
        enabled: true
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects short name', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'A',
        slug: 'a'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects long name', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'A'.repeat(51),
        slug: 'test'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts name with exactly 2 characters', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'AB',
        slug: 'ab'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts name with exactly 50 characters', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'A'.repeat(50),
        slug: 'test'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects invalid slug format - uppercase', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'Test-Category'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects invalid slug format - spaces', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test category'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('rejects invalid slug format - special characters', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test_category'
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts slug with numbers', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test-123'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts slug with only numbers', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: '123'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts optional parentId (CUID)', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Subcategory',
        slug: 'subcategory',
        parentId: 'clx123abc'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts null parentId', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Root Category',
        slug: 'root',
        parentId: null
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('accepts valid order number', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        order: 10
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects negative order number', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        order: -1
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts order number of 0', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        order: 0
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects float order number', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        order: 1.5
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it('accepts enabled flag', () => {
      // Act
      const result1 = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        enabled: true
      })
      const result2 = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        enabled: false
      })

      // Assert
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('accepts optional icon', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        icon: 'shopping-cart'
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it('rejects missing required fields', () => {
      // Act
      const result = categorySchema.safeParse({
        name: 'Test'
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })
})
