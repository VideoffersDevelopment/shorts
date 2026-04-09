import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InsufficientCreditsError } from '@/lib/wallet/wallet-types'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('../../client', () => ({
  inngest: {
    createFunction: vi.fn(
      (_config: Record<string, unknown>, _trigger: Record<string, unknown>, handler: unknown) =>
        handler
    )
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn()
  }
}))

vi.mock('@/lib/wallet/wallet-service', () => ({
  spendCredits: vi.fn()
}))

vi.mock('@/lib/wallet/pricing-service', () => ({
  getPrice: vi.fn()
}))

import { prisma } from '@/lib/prisma'
import { spendCredits } from '@/lib/wallet/wallet-service'
import { getPrice } from '@/lib/wallet/pricing-service'
import { chargeMaintenanceFee } from '../maintenance-fee'

const mockPrisma = vi.mocked(prisma)
const mockSpendCredits = vi.mocked(spendCredits)
const mockGetPrice = vi.mocked(getPrice)

// ===========================================================================
// HELPERS
// ===========================================================================

function createMockStep() {
  return {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => {
      return await fn()
    })
  }
}

interface ChargeResult {
  userId: string
  charged: number
  partial: boolean
  error?: string
}

interface HandlerResult {
  success: boolean
  chargedCount: number
  totalCharged?: number
  message?: string
  details?: ChargeResult[]
}

type HandlerFn = (ctx: { step: ReturnType<typeof createMockStep> }) => Promise<HandlerResult>

// Mock inactive user data
function createInactiveUser(userId: string, totalBalance: number, lastActivity: Date) {
  return {
    userId,
    totalBalance,
    lastActivity
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('chargeMaintenanceFee Inngest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // NO INACTIVE USERS
  // =========================================================================

  describe('No Inactive Users', () => {
    it('returns early with chargedCount 0 when no inactive users', async () => {
      const mockStep = createMockStep()
      mockPrisma.$queryRaw.mockResolvedValue([])

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.chargedCount).toBe(0)
      expect(result.message).toBe('No inactive users found')
      expect(mockGetPrice).not.toHaveBeenCalled()
      expect(mockSpendCredits).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // FINDING INACTIVE USERS
  // =========================================================================

  describe('Finding Inactive Users', () => {
    it('finds users inactive for 12+ months', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      const inactiveUsers = [
        createInactiveUser('user1', 1000, oldActivity)
      ]

      mockPrisma.$queryRaw.mockResolvedValue(inactiveUsers)
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
    })

    it('skips active users (filtered by query)', async () => {
      const mockStep = createMockStep()

      // Query should only return users with lastActivityAt < 12 months ago
      mockPrisma.$queryRaw.mockResolvedValue([])

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.chargedCount).toBe(0)
      expect(mockSpendCredits).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // PRICING
  // =========================================================================

  describe('Pricing', () => {
    it('gets fee amount from PricingConfig', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockGetPrice).toHaveBeenCalledWith('MAINTENANCE_FEE')
    })
  })

  // =========================================================================
  // CHARGING USERS
  // =========================================================================

  describe('Charging Users', () => {
    it('charges full fee for users with sufficient balance', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(mockSpendCredits).toHaveBeenCalledWith('user1', 500, 'MAINTENANCE_FEE')
      expect(result.details?.[0].charged).toBe(500)
      expect(result.details?.[0].partial).toBe(false)
    })

    it('charges partial amount when user has less than fee', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 300, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 300,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(mockSpendCredits).toHaveBeenCalledWith('user1', 300, 'MAINTENANCE_FEE')
      expect(result.details?.[0].charged).toBe(300)
      expect(result.details?.[0].partial).toBe(true)
    })

    it('calls spendCredits with correct actionType', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockSpendCredits).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        'MAINTENANCE_FEE'
      )
    })
  })

  // =========================================================================
  // MULTIPLE USERS
  // =========================================================================

  describe('Multiple Users', () => {
    it('handles multiple inactive users', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity),
        createInactiveUser('user2', 800, oldActivity),
        createInactiveUser('user3', 600, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx1'],
        batchesAffected: []
      })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.chargedCount).toBe(3)
      expect(mockSpendCredits).toHaveBeenCalledTimes(3)
    })

    it('returns correct totalCharged sum', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity),
        createInactiveUser('user2', 300, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)

      mockSpendCredits
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 500,
          transactionIds: ['tx1'],
          batchesAffected: []
        })
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 300,
          transactionIds: ['tx2'],
          batchesAffected: []
        })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalCharged).toBe(800)
    })

    it('returns partial flag in details', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity),
        createInactiveUser('user2', 300, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)

      mockSpendCredits
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 500,
          transactionIds: ['tx1'],
          batchesAffected: []
        })
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 300,
          transactionIds: ['tx2'],
          batchesAffected: []
        })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.details?.[0].partial).toBe(false)
      expect(result.details?.[1].partial).toBe(true)
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('handles InsufficientCreditsError gracefully', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockRejectedValue(
        new InsufficientCreditsError(500, 100)
      )

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.details?.[0].charged).toBe(0)
      expect(result.details?.[0].partial).toBe(true)
      expect(result.details?.[0].error).toBe('Insufficient credits after balance check')
    })

    it('handles other errors gracefully', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)
      mockSpendCredits.mockRejectedValue(new Error('Database error'))

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.details?.[0].charged).toBe(0)
      expect(result.details?.[0].error).toBe('Database error')
    })
  })

  // =========================================================================
  // LOGGING
  // =========================================================================

  describe('Logging', () => {
    it('logs results with totals', async () => {
      const mockStep = createMockStep()
      const oldActivity = new Date()
      oldActivity.setMonth(oldActivity.getMonth() - 13)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockPrisma.$queryRaw.mockResolvedValue([
        createInactiveUser('user1', 1000, oldActivity),
        createInactiveUser('user2', 300, oldActivity)
      ])
      mockGetPrice.mockResolvedValue(500)

      mockSpendCredits
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 500,
          transactionIds: ['tx1'],
          batchesAffected: []
        })
        .mockResolvedValueOnce({
          success: true,
          totalSpent: 300,
          transactionIds: ['tx2'],
          batchesAffected: []
        })

      const handler = chargeMaintenanceFee as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[maintenance-fee] Charged 2 users')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('total 800 points')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 partial')
      )

      consoleSpy.mockRestore()
    })
  })
})
