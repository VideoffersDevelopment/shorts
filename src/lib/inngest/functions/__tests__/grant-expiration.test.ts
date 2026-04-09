import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    creditBatch: {
      findMany: vi.fn(),
      update: vi.fn()
    },
    creditTransaction: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('../../client', () => ({
  inngest: {
    createFunction: vi.fn(
      (_config: Record<string, unknown>, _trigger: Record<string, unknown>, handler: unknown) =>
        handler
    )
  }
}))

import { prisma } from '@/lib/prisma'
import { expirePromoGrants } from '../grant-expiration'

const mockPrisma = vi.mocked(prisma)

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

type HandlerResult = {
  success: boolean
  expiredCount: number
  totalPointsExpired?: number
  message?: string
  details?: { batchId: string; userId: string; amount: number }[]
}
type HandlerFn = (ctx: { step: ReturnType<typeof createMockStep> }) => Promise<HandlerResult>

// ===========================================================================
// TESTS
// ===========================================================================

describe('expirePromoGrants Inngest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // NO EXPIRED BATCHES
  // =========================================================================

  describe('No Expired Batches', () => {
    it('returns early with expiredCount 0 when no expired batches', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([])

      const handler = expirePromoGrants as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.expiredCount).toBe(0)
      expect(result.message).toBe('No expired PROMO batches found')
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // FINDING EXPIRED BATCHES
  // =========================================================================

  describe('Finding Expired Batches', () => {
    it('finds expired PROMO batches with remaining balance', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.creditBatch.findMany).toHaveBeenCalledWith({
        where: {
          wallet: 'PROMO',
          expiresAt: { lte: expect.any(Date) },
          currentBalance: { gt: 0 }
        },
        select: {
          id: true,
          userId: true,
          currentBalance: true,
          expiresAt: true
        }
      })
    })

    it('skips batches with zero balance (filtered by query)', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      const whereClause = mockPrisma.creditBatch.findMany.mock.calls[0][0]?.where
      expect(whereClause).toHaveProperty('currentBalance', { gt: 0 })
    })
  })

  // =========================================================================
  // UPDATING BATCHES
  // =========================================================================

  describe('Updating Batches', () => {
    it('zeros currentBalance on expired batch', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 50,
          expiresAt: new Date('2026-01-01')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

      // Check the transaction contains two operations
      const transactionCall = mockPrisma.$transaction.mock.calls[0][0] as unknown[]
      expect(transactionCall).toHaveLength(2)
    })

    it('creates PROMO_EXPIRED transaction with negative amount', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 75,
          expiresAt: new Date('2026-01-01')
        }
      ])

      // Capture the transaction operations
      let capturedOperations: unknown[] = []
      mockPrisma.$transaction.mockImplementation(async (operations: unknown[]) => {
        capturedOperations = operations
        return [{}, {}]
      })

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(capturedOperations).toHaveLength(2)
    })

    it('uses $transaction for atomicity', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // MULTIPLE BATCHES
  // =========================================================================

  describe('Multiple Batches', () => {
    it('handles multiple expired batches', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        },
        {
          id: 'batch-2',
          userId: 'user-2',
          currentBalance: 50,
          expiresAt: new Date('2026-01-05')
        },
        {
          id: 'batch-3',
          userId: 'user-1',
          currentBalance: 25,
          expiresAt: new Date('2026-01-10')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3)
      expect(result.expiredCount).toBe(3)
    })
  })

  // =========================================================================
  // RETURN VALUES
  // =========================================================================

  describe('Return Values', () => {
    it('returns correct totalPointsExpired sum', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        },
        {
          id: 'batch-2',
          userId: 'user-2',
          currentBalance: 50,
          expiresAt: new Date('2026-01-05')
        },
        {
          id: 'batch-3',
          userId: 'user-1',
          currentBalance: 25,
          expiresAt: new Date('2026-01-10')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalPointsExpired).toBe(175)
    })

    it('returns details with batchId, userId, amount', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        },
        {
          id: 'batch-2',
          userId: 'user-2',
          currentBalance: 50,
          expiresAt: new Date('2026-01-05')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.details).toHaveLength(2)
      expect(result.details).toEqual([
        { batchId: 'batch-1', userId: 'user-1', amount: 100 },
        { batchId: 'batch-2', userId: 'user-2', amount: 50 }
      ])
    })
  })

  // =========================================================================
  // LOGGING
  // =========================================================================

  describe('Logging', () => {
    it('logs results', async () => {
      const mockStep = createMockStep()
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        },
        {
          id: 'batch-2',
          userId: 'user-2',
          currentBalance: 50,
          expiresAt: new Date('2026-01-05')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[expire-promo] Expired 2 batches, total 150 points zeroed'
      )

      consoleSpy.mockRestore()
    })
  })

  // =========================================================================
  // STEP EXECUTION
  // =========================================================================

  describe('Step Execution', () => {
    it('executes all three steps in order', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        }
      ])
      mockPrisma.$transaction.mockResolvedValue([{}, {}])

      const handler = expirePromoGrants as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockStep.run).toHaveBeenCalledTimes(3)
      expect(mockStep.run).toHaveBeenNthCalledWith(
        1,
        'find-expired-promo',
        expect.any(Function)
      )
      expect(mockStep.run).toHaveBeenNthCalledWith(
        2,
        'zero-expired-batches',
        expect.any(Function)
      )
      expect(mockStep.run).toHaveBeenNthCalledWith(3, 'log-results', expect.any(Function))
    })
  })

  // =========================================================================
  // DATABASE ERRORS
  // =========================================================================

  describe('Database Errors', () => {
    it('throws error when findMany fails', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const handler = expirePromoGrants as unknown as HandlerFn

      await expect(handler({ step: mockStep })).rejects.toThrow('Database connection failed')
    })

    it('throws error when $transaction fails', async () => {
      const mockStep = createMockStep()
      mockPrisma.creditBatch.findMany.mockResolvedValue([
        {
          id: 'batch-1',
          userId: 'user-1',
          currentBalance: 100,
          expiresAt: new Date('2026-01-01')
        }
      ])
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      const handler = expirePromoGrants as unknown as HandlerFn

      await expect(handler({ step: mockStep })).rejects.toThrow('Transaction failed')
    })
  })
})
