import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPrice, isServiceEnabled, invalidatePricingCache, getAllPricing, seedDefaultPricing } from '../pricing-service'
import { DEFAULT_PRICING } from '../wallet-constants'
import type { PricingKey } from '../wallet-types'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pricingConfig: {
      findMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

// Helper to create mock PricingConfig objects matching schema
function mockPricingConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cfg-1',
    key: 'PUBLICATION',
    cost: 100,
    label: 'Publikacja wideo',
    description: 'Opłata za publikację nowego wideo',
    enabled: true,
    category: 'publication',
    updatedAt: new Date(),
    updatedBy: null,
    ...overrides,
  }
}

describe('pricing-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidatePricingCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getPrice', () => {
    it('falls back to DEFAULT_PRICING when DB is empty', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([])

      const price = await getPrice("PUBLICATION")

      expect(price).toBe(100)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })

    it('falls back to DEFAULT_PRICING when DB query fails', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockRejectedValue(new Error('DB error'))

      const price = await getPrice("PUBLICATION")

      expect(price).toBe(100)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })

    it('returns DB value when cache is populated', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
      ])

      const price = await getPrice("PUBLICATION")

      expect(price).toBe(150)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })

    it('caches results and does not query DB on second call', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
      ])

      const price1 = await getPrice("PUBLICATION")
      expect(price1).toBe(150)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      const price2 = await getPrice("PUBLICATION")
      expect(price2).toBe(150)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1) // Still 1
    })

    it('refreshes cache after TTL expires', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
      ])

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      // Advance time by 5 minutes + 1ms (past TTL)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(2)
    })

    it('returns correct price for different pricing keys', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
        mockPricingConfig({ id: 'cfg-2', key: 'BOOST_STD', cost: 90, category: 'boost' }) as any,
      ])

      const publicationPrice = await getPrice("PUBLICATION")
      const boostPrice = await getPrice("BOOST_STD")

      expect(publicationPrice).toBe(150)
      expect(boostPrice).toBe(90)
    })
  })

  describe('isServiceEnabled', () => {
    it('falls back to DEFAULT_PRICING.enabled when DB is empty', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([])

      const enabled = await isServiceEnabled("PUBLICATION")

      expect(enabled).toBe(true)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })

    it('falls back to DEFAULT_PRICING.enabled on DB error', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockRejectedValue(new Error('DB error'))

      const enabled = await isServiceEnabled("PUBLICATION")

      expect(enabled).toBe(true)
    })

    it('returns DB enabled status from cache', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', enabled: false }) as any,
      ])

      const enabled = await isServiceEnabled("PUBLICATION")

      expect(enabled).toBe(false)
    })

    it('caches results and does not query DB on second call', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', enabled: false }) as any,
      ])

      await isServiceEnabled("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      await isServiceEnabled("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalidatePricingCache', () => {
    it('clears cache so next getPrice call queries DB again', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
      ])

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      invalidatePricingCache()

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(2)
    })

    it('clears cache so next isServiceEnabled call queries DB again', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', enabled: false }) as any,
      ])

      await isServiceEnabled("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      invalidatePricingCache()

      await isServiceEnabled("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAllPricing', () => {
    it('returns entries from DB ordered by category and key', async () => {
      const mockConfigs = [
        mockPricingConfig({ key: 'BOOST_STD', category: 'boost' }),
        mockPricingConfig({ id: 'cfg-2', key: 'PUBLICATION', category: 'publication' }),
      ]

      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue(mockConfigs as any)

      const result = await getAllPricing()

      expect(result).toEqual(mockConfigs)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      })
    })

    it('returns empty array on error', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockRejectedValue(new Error('DB error'))

      const result = await getAllPricing()

      expect(result).toEqual([])
    })

    it('does not use cache (always queries DB)', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([])

      await getAllPricing()
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      await getAllPricing()
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('seedDefaultPricing', () => {
    it('creates entries when count is 0', async () => {
      vi.mocked(prisma.pricingConfig.count).mockResolvedValue(0)
      vi.mocked(prisma.pricingConfig.createMany).mockResolvedValue({ count: 11 })

      await seedDefaultPricing()

      expect(prisma.pricingConfig.count).toHaveBeenCalledTimes(1)
      expect(prisma.pricingConfig.createMany).toHaveBeenCalledTimes(1)
      expect(prisma.pricingConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ key: 'PUBLICATION', cost: 100 }),
          expect.objectContaining({ key: 'BOOST_STD', cost: 80 }),
        ]),
        skipDuplicates: true,
      })
    })

    it('skips creation when count > 0', async () => {
      vi.mocked(prisma.pricingConfig.count).mockResolvedValue(5)

      await seedDefaultPricing()

      expect(prisma.pricingConfig.count).toHaveBeenCalledTimes(1)
      expect(prisma.pricingConfig.createMany).not.toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      vi.mocked(prisma.pricingConfig.count).mockRejectedValue(new Error('DB error'))

      await expect(seedDefaultPricing()).resolves.toBeUndefined()
      expect(prisma.pricingConfig.createMany).not.toHaveBeenCalled()
    })

    it('seeds all DEFAULT_PRICING entries', async () => {
      vi.mocked(prisma.pricingConfig.count).mockResolvedValue(0)
      vi.mocked(prisma.pricingConfig.createMany).mockResolvedValue({ count: 11 })

      await seedDefaultPricing()

      const createManyCall = vi.mocked(prisma.pricingConfig.createMany).mock.calls[0][0]
      const data = createManyCall.data as any[]

      const keys = data.map((entry: any) => entry.key)
      expect(keys).toContain('PUBLICATION')
      expect(keys).toContain('BOOST_STD')
      expect(keys).toContain('SUPER_LIKE')
      expect(keys).toContain('MAINTENANCE_FEE')
      expect(keys).toContain('WATERMARK_RM')
      expect(data).toHaveLength(Object.keys(DEFAULT_PRICING).length)
    })
  })

  describe('cache integration', () => {
    it('getPrice and isServiceEnabled share the same cache', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150, enabled: false }) as any,
      ])

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      const enabled = await isServiceEnabled("PUBLICATION")
      expect(enabled).toBe(false)
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1) // Still 1
    })

    it('cache persists across different pricing keys within TTL', async () => {
      vi.mocked(prisma.pricingConfig.findMany).mockResolvedValue([
        mockPricingConfig({ key: 'PUBLICATION', cost: 150 }) as any,
        mockPricingConfig({ id: 'cfg-2', key: 'BOOST_STD', cost: 90, category: 'boost' }) as any,
      ])

      await getPrice("PUBLICATION")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)

      await getPrice("BOOST_STD")
      expect(prisma.pricingConfig.findMany).toHaveBeenCalledTimes(1)
    })
  })
})
