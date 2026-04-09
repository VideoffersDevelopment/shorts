import { describe, it, expect } from 'vitest'
import {
  POINT_PACKAGES,
  getPointPackage,
  isValidPackageId,
  formatAmount,
  type PointPackageId
} from '../index'

describe('Payment Utilities', () => {
  // ===========================================================================
  // CONSTANTS RE-EXPORT
  // ===========================================================================

  describe('POINT_PACKAGES', () => {
    it('re-exports POINT_PACKAGES from wallet-constants', () => {
      expect(POINT_PACKAGES).toBeDefined()
      expect(Array.isArray(POINT_PACKAGES)).toBe(true)
      expect(POINT_PACKAGES).toHaveLength(4)
    })

    it('has correct structure for all packages', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(pkg).toHaveProperty('id')
        expect(pkg).toHaveProperty('points')
        expect(pkg).toHaveProperty('pricePLN')
        expect(pkg).toHaveProperty('label')
        expect(pkg).toHaveProperty('description')
        expect(typeof pkg.id).toBe('string')
        expect(typeof pkg.points).toBe('number')
        expect(typeof pkg.pricePLN).toBe('number')
      })
    })

    it('has all expected package IDs', () => {
      const ids = POINT_PACKAGES.map(p => p.id)
      expect(ids).toContain('starter')
      expect(ids).toContain('standard')
      expect(ids).toContain('premium')
      expect(ids).toContain('business')
    })

    it('starter package has correct values', () => {
      const starter = POINT_PACKAGES.find(p => p.id === 'starter')
      expect(starter).toBeDefined()
      expect(starter?.points).toBe(10_000)
      expect(starter?.pricePLN).toBe(1_500)
    })

    it('standard package has correct values', () => {
      const standard = POINT_PACKAGES.find(p => p.id === 'standard')
      expect(standard).toBeDefined()
      expect(standard?.points).toBe(50_000)
      expect(standard?.pricePLN).toBe(6_500)
    })

    it('premium package has correct values', () => {
      const premium = POINT_PACKAGES.find(p => p.id === 'premium')
      expect(premium).toBeDefined()
      expect(premium?.points).toBe(100_000)
      expect(premium?.pricePLN).toBe(12_000)
    })

    it('business package has correct values', () => {
      const business = POINT_PACKAGES.find(p => p.id === 'business')
      expect(business).toBeDefined()
      expect(business?.points).toBe(500_000)
      expect(business?.pricePLN).toBe(50_000)
    })
  })

  // ===========================================================================
  // getPointPackage
  // ===========================================================================

  describe('getPointPackage', () => {
    it('returns correct package for "starter" ID', () => {
      const pkg = getPointPackage('starter')
      expect(pkg).toBeDefined()
      expect(pkg?.id).toBe('starter')
      expect(pkg?.points).toBe(10_000)
      expect(pkg?.pricePLN).toBe(1_500)
    })

    it('returns correct package for "standard" ID', () => {
      const pkg = getPointPackage('standard')
      expect(pkg).toBeDefined()
      expect(pkg?.id).toBe('standard')
      expect(pkg?.points).toBe(50_000)
      expect(pkg?.pricePLN).toBe(6_500)
    })

    it('returns correct package for "premium" ID', () => {
      const pkg = getPointPackage('premium')
      expect(pkg).toBeDefined()
      expect(pkg?.id).toBe('premium')
      expect(pkg?.points).toBe(100_000)
      expect(pkg?.pricePLN).toBe(12_000)
    })

    it('returns correct package for "business" ID', () => {
      const pkg = getPointPackage('business')
      expect(pkg).toBeDefined()
      expect(pkg?.id).toBe('business')
      expect(pkg?.points).toBe(500_000)
      expect(pkg?.pricePLN).toBe(50_000)
    })

    it('returns null for invalid package ID', () => {
      expect(getPointPackage('invalid')).toBeNull()
      expect(getPointPackage('nonexistent')).toBeNull()
      expect(getPointPackage('')).toBeNull()
      expect(getPointPackage('STARTER')).toBeNull() // case sensitive
    })

    it('returns null for numeric string IDs', () => {
      expect(getPointPackage('1')).toBeNull()
      expect(getPointPackage('5')).toBeNull()
      expect(getPointPackage('20')).toBeNull()
    })

    it('returns complete package object with all properties', () => {
      const pkg = getPointPackage('starter')
      expect(pkg).toEqual({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })
    })
  })

  // ===========================================================================
  // isValidPackageId
  // ===========================================================================

  describe('isValidPackageId', () => {
    it('returns true for "starter" package ID', () => {
      expect(isValidPackageId('starter')).toBe(true)
    })

    it('returns true for "standard" package ID', () => {
      expect(isValidPackageId('standard')).toBe(true)
    })

    it('returns true for "premium" package ID', () => {
      expect(isValidPackageId('premium')).toBe(true)
    })

    it('returns true for "business" package ID', () => {
      expect(isValidPackageId('business')).toBe(true)
    })

    it('returns false for invalid package IDs', () => {
      expect(isValidPackageId('invalid')).toBe(false)
      expect(isValidPackageId('nonexistent')).toBe(false)
      expect(isValidPackageId('')).toBe(false)
      expect(isValidPackageId('STARTER')).toBe(false) // case sensitive
      expect(isValidPackageId('1')).toBe(false)
      expect(isValidPackageId('basic')).toBe(false)
      expect(isValidPackageId('enterprise')).toBe(false)
    })

    it('type guard narrows to PointPackageId type', () => {
      const value: string = 'starter'
      if (isValidPackageId(value)) {
        // TypeScript now knows value is PointPackageId
        const id: PointPackageId = value
        expect(id).toBe('starter')
      }
    })

    it('returns true for all valid package IDs from POINT_PACKAGES', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(isValidPackageId(pkg.id)).toBe(true)
      })
    })
  })

  // ===========================================================================
  // formatAmount
  // ===========================================================================

  describe('formatAmount', () => {
    it('formats 1_500 grosze as "15.00" (starter package)', () => {
      expect(formatAmount(1_500)).toBe('15.00')
    })

    it('formats 6_500 grosze as "65.00" (standard package)', () => {
      expect(formatAmount(6_500)).toBe('65.00')
    })

    it('formats 12_000 grosze as "120.00" (premium package)', () => {
      expect(formatAmount(12_000)).toBe('120.00')
    })

    it('formats 50_000 grosze as "500.00" (business package)', () => {
      expect(formatAmount(50_000)).toBe('500.00')
    })

    it('formats 0 grosze as "0.00"', () => {
      expect(formatAmount(0)).toBe('0.00')
    })

    it('formats amounts with fractional grosze correctly', () => {
      expect(formatAmount(123)).toBe('1.23')
      expect(formatAmount(999)).toBe('9.99')
      expect(formatAmount(1)).toBe('0.01')
      expect(formatAmount(99)).toBe('0.99')
    })

    it('formats large amounts correctly', () => {
      expect(formatAmount(100_000)).toBe('1000.00')
      expect(formatAmount(1_000_000)).toBe('10000.00')
    })

    it('always returns 2 decimal places', () => {
      expect(formatAmount(100)).toBe('1.00')
      expect(formatAmount(1000)).toBe('10.00')
      expect(formatAmount(10_000)).toBe('100.00')
    })

    it('handles negative amounts', () => {
      expect(formatAmount(-500)).toBe('-5.00')
      expect(formatAmount(-1_500)).toBe('-15.00')
    })
  })

  // ===========================================================================
  // EDGE CASES & INTEGRATION
  // ===========================================================================

  describe('Edge Cases', () => {
    it('all package IDs pass isValidPackageId', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(isValidPackageId(pkg.id)).toBe(true)
      })
    })

    it('all package IDs can be retrieved with getPointPackage', () => {
      POINT_PACKAGES.forEach(pkg => {
        const retrieved = getPointPackage(pkg.id)
        expect(retrieved).toEqual(pkg)
      })
    })

    it('formatAmount handles all package prices correctly', () => {
      expect(formatAmount(1_500)).toBe('15.00')   // starter
      expect(formatAmount(6_500)).toBe('65.00')   // standard
      expect(formatAmount(12_000)).toBe('120.00') // premium
      expect(formatAmount(50_000)).toBe('500.00') // business
    })

    it('getPointPackage and isValidPackageId are consistent', () => {
      const testIds = ['starter', 'standard', 'premium', 'business', 'invalid', '', 'nonexistent']

      testIds.forEach(id => {
        const isValid = isValidPackageId(id)
        const pkg = getPointPackage(id)

        // If isValidPackageId returns true, getPointPackage should return non-null
        if (isValid) {
          expect(pkg).not.toBeNull()
        } else {
          expect(pkg).toBeNull()
        }
      })
    })
  })

  // ===========================================================================
  // PACKAGE STRUCTURE VALIDATION
  // ===========================================================================

  describe('Package Structure', () => {
    it('packages are ordered by price ascending', () => {
      POINT_PACKAGES.slice(0, -1).forEach((current, i) => {
        const next = POINT_PACKAGES[i + 1]
        expect(current.pricePLN).toBeLessThan(next.pricePLN)
      })
    })

    it('packages are ordered by points ascending', () => {
      POINT_PACKAGES.slice(0, -1).forEach((current, i) => {
        const next = POINT_PACKAGES[i + 1]
        expect(current.points).toBeLessThan(next.points)
      })
    })

    it('larger packages offer better value (price per point)', () => {
      const starterPPP = POINT_PACKAGES[0].pricePLN / POINT_PACKAGES[0].points
      const businessPPP = POINT_PACKAGES[3].pricePLN / POINT_PACKAGES[3].points
      expect(businessPPP).toBeLessThan(starterPPP)
    })

    it('all packages have non-empty labels', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(pkg.label).toBeTruthy()
        expect(pkg.label.length).toBeGreaterThan(0)
      })
    })

    it('all packages have non-empty descriptions', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(pkg.description).toBeTruthy()
        expect(pkg.description.length).toBeGreaterThan(0)
      })
    })

    it('all packages have positive points', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(pkg.points).toBeGreaterThan(0)
      })
    })

    it('all packages have positive prices', () => {
      POINT_PACKAGES.forEach(pkg => {
        expect(pkg.pricePLN).toBeGreaterThan(0)
      })
    })
  })
})
