import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    shortBoost: { updateMany: vi.fn() }
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
import { expireActiveBoosts } from '../expire-boosts'

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

type HandlerResult = { success: boolean; completedCount: number }
type HandlerFn = (ctx: { step: ReturnType<typeof createMockStep> }) => Promise<HandlerResult>

// ===========================================================================
// TESTS
// ===========================================================================

describe('expireActiveBoosts Inngest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe('Happy Path', () => {
    it('marks expired ACTIVE boosts as COMPLETED', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockResolvedValue({ count: 3 })

      const handler = expireActiveBoosts as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.completedCount).toBe(3)
      expect(mockPrisma.shortBoost.updateMany).toHaveBeenCalled()
    })

    it('returns completedCount from updateMany result', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockResolvedValue({ count: 7 })

      const handler = expireActiveBoosts as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.completedCount).toBe(7)
    })
  })

  // =========================================================================
  // NO EXPIRED BOOSTS
  // =========================================================================

  describe('No Expired Boosts', () => {
    it('returns 0 when no expired boosts found', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockResolvedValue({ count: 0 })

      const handler = expireActiveBoosts as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.completedCount).toBe(0)
    })
  })

  // =========================================================================
  // WHERE CLAUSE
  // =========================================================================

  describe('Where Clause', () => {
    it('queries with correct WHERE clause (ACTIVE + expiresAt <= now)', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockResolvedValue({ count: 1 })

      const handler = expireActiveBoosts as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.shortBoost.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: expect.any(Date) }
        },
        data: {
          status: 'COMPLETED'
        }
      })
    })

    it('sets status to COMPLETED (not EXPIRED or deleted)', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockResolvedValue({ count: 2 })

      const handler = expireActiveBoosts as unknown as HandlerFn
      await handler({ step: mockStep })

      const updateCall = mockPrisma.shortBoost.updateMany.mock.calls[0][0]
      expect(updateCall.data).toEqual({ status: 'COMPLETED' })
      expect(updateCall.data).not.toHaveProperty('deletedAt')
    })
  })

  // =========================================================================
  // DATABASE ERRORS
  // =========================================================================

  describe('Database Errors', () => {
    it('throws error when updateMany fails', async () => {
      const mockStep = createMockStep()
      mockPrisma.shortBoost.updateMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const handler = expireActiveBoosts as unknown as HandlerFn

      await expect(handler({ step: mockStep })).rejects.toThrow(
        'Database connection failed'
      )
    })
  })
})
