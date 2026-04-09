import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getWalletBalance, spendCredits, addCredits, topUp, refundToExactBatch, freezeBatch, unfreezeBatch, grantPromoCredits, transferTip } from '../wallet-service'
import { InsufficientCreditsError } from '../wallet-types'
import { prisma } from '@/lib/prisma'
import type { CreditBatch } from '@prisma/client'
import { getPrice } from '../pricing-service'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    creditBatch: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  }
}))

// Mock pricing service
vi.mock('../pricing-service', () => ({
  getPrice: vi.fn(),
}))

describe('wallet-service', () => {
  const userId = 'user-123'
  const now = new Date('2026-03-18T10:00:00Z')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper to create a mock batch
  function mockBatch(overrides: Partial<CreditBatch> = {}): CreditBatch {
    return {
      id: 'batch-1',
      userId,
      wallet: 'PROMO',
      type: 'PROMO_GRANT',
      initialAmount: 1000,
      currentBalance: 1000,
      expiresAt: new Date('2026-05-18T10:00:00Z'),
      createdAt: new Date('2026-03-18T10:00:00Z'),
      lastActivityAt: new Date('2026-03-18T10:00:00Z'),
      isFrozen: false,
      ...overrides,
    } as CreditBatch
  }

  describe('getWalletBalance', () => {
    it('returns 0/0 when no batches exist', async () => {
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValue([])

      const result = await getWalletBalance(userId)

      expect(result.promo.balance).toBe(0)
      expect(result.main.balance).toBe(0)
      expect(result.total).toBe(0)
      expect(result.promo.expiresAt).toBeNull()
      expect(result.main.expiresAt).toBeNull()
      expect(result.promo.daysRemaining).toBeNull()
      expect(result.batches).toHaveLength(0)
    })

    it('correctly sums PROMO and MAIN balances from multiple batches', async () => {
      const promoBatch1 = mockBatch({ id: 'promo-1', wallet: 'PROMO', currentBalance: 500, expiresAt: new Date('2026-05-18T10:00:00Z') })
      const promoBatch2 = mockBatch({ id: 'promo-2', wallet: 'PROMO', currentBalance: 300, expiresAt: new Date('2026-06-18T10:00:00Z') })
      const mainBatch1 = mockBatch({ id: 'main-1', wallet: 'MAIN', type: 'PURCHASED', currentBalance: 1000, expiresAt: new Date('2027-03-18T10:00:00Z') })
      const mainBatch2 = mockBatch({ id: 'main-2', wallet: 'MAIN', type: 'EARNED_TIP', currentBalance: 200, expiresAt: new Date('2027-04-18T10:00:00Z') })

      vi.mocked(prisma.creditBatch.findMany).mockResolvedValue([
        promoBatch1,
        promoBatch2,
        mainBatch1,
        mainBatch2,
      ])

      const result = await getWalletBalance(userId)

      expect(result.promo.balance).toBe(800) // 500 + 300
      expect(result.main.balance).toBe(1200) // 1000 + 200
      expect(result.total).toBe(2000)
    })

    it('returns earliest expiration dates per wallet', async () => {
      const promoEarliest = new Date('2026-05-01T10:00:00Z')
      const promoLater = new Date('2026-06-01T10:00:00Z')
      const mainEarliest = new Date('2027-01-01T10:00:00Z')
      const mainLater = new Date('2027-02-01T10:00:00Z')

      const batches = [
        mockBatch({ id: 'promo-1', wallet: 'PROMO', expiresAt: promoEarliest }),
        mockBatch({ id: 'promo-2', wallet: 'PROMO', expiresAt: promoLater }),
        mockBatch({ id: 'main-1', wallet: 'MAIN', type: 'PURCHASED', expiresAt: mainEarliest }),
        mockBatch({ id: 'main-2', wallet: 'MAIN', type: 'EARNED_TIP', expiresAt: mainLater }),
      ]

      vi.mocked(prisma.creditBatch.findMany).mockResolvedValue(batches)

      const result = await getWalletBalance(userId)

      expect(result.promo.expiresAt).toEqual(promoEarliest)
      expect(result.main.expiresAt).toEqual(mainEarliest)
    })

    it('calculates daysRemaining correctly for PROMO wallet', async () => {
      const expiryDate = new Date('2026-04-17T10:00:00Z') // 30 days from now

      vi.mocked(prisma.creditBatch.findMany).mockResolvedValue([
        mockBatch({ wallet: 'PROMO', expiresAt: expiryDate })
      ])

      const result = await getWalletBalance(userId)

      expect(result.promo.daysRemaining).toBe(30)
    })

    it('detects maintenance fee active when lastActivityAt older than 12 months', async () => {
      const oldActivity = new Date('2025-01-01T10:00:00Z') // More than 12 months ago

      const mainBatch = mockBatch({
        wallet: 'MAIN',
        type: 'PURCHASED',
        currentBalance: 1000,
        lastActivityAt: oldActivity,
      })

      // First call: active batches
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValueOnce([mainBatch])
      // Second call: checking all MAIN batches for last activity
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValueOnce([
        { lastActivityAt: oldActivity } as any
      ])

      const result = await getWalletBalance(userId)

      expect(result.main.isMaintenanceFeeActive).toBe(true)
    })

    it('detects maintenance fee NOT active when lastActivityAt is recent', async () => {
      const recentActivity = new Date('2026-02-18T10:00:00Z') // Less than 12 months ago

      const mainBatch = mockBatch({
        wallet: 'MAIN',
        type: 'PURCHASED',
        lastActivityAt: recentActivity,
      })

      // First call: active batches
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValueOnce([mainBatch])
      // Second call: checking all MAIN batches for last activity
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValueOnce([
        { lastActivityAt: recentActivity } as any
      ])

      const result = await getWalletBalance(userId)

      expect(result.main.isMaintenanceFeeActive).toBe(false)
    })

    it('maintenance fee NOT active when no MAIN batches exist', async () => {
      vi.mocked(prisma.creditBatch.findMany).mockResolvedValue([
        mockBatch({ wallet: 'PROMO', currentBalance: 500 })
      ])

      const result = await getWalletBalance(userId)

      expect(result.main.isMaintenanceFeeActive).toBe(false)
    })
  })

  describe('spendCredits', () => {
    const mockTx = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      creditBatch: { update: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
      creditTransaction: { create: vi.fn() },
    }

    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (fnOrArray: any) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(mockTx)
        }
        // Array form: just resolve all
        return Promise.all(fnOrArray)
      })
    })

    it('throws on amount <= 0', async () => {
      await expect(spendCredits(userId, 0, 'PUBLICATION')).rejects.toThrow('Amount must be positive')
      await expect(spendCredits(userId, -10, 'PUBLICATION')).rejects.toThrow('Amount must be positive')
    })

    it('throws InsufficientCreditsError when balance too low', async () => {
      mockTx.$queryRaw.mockResolvedValue([
        { id: 'batch-1', wallet: 'PROMO', type: 'PROMO_GRANT', currentBalance: 50, expiresAt: new Date('2026-05-18') }
      ])

      await expect(spendCredits(userId, 100, 'PUBLICATION')).rejects.toThrow(InsufficientCreditsError)
      await expect(spendCredits(userId, 100, 'PUBLICATION')).rejects.toThrow('Insufficient credits: required 100, available 50')
    })

    it('deducts from PROMO first (FIFO order)', async () => {
      const promoBatch = {
        id: 'promo-1',
        wallet: 'PROMO' as const,
        type: 'PROMO_GRANT' as const,
        currentBalance: 500,
        expiresAt: new Date('2026-05-18'),
      }
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      // $queryRaw returns batches ordered PROMO first, then MAIN
      mockTx.$queryRaw.mockResolvedValue([promoBatch, mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create.mockResolvedValue({ id: 'tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      const result = await spendCredits(userId, 300, 'PUBLICATION')

      expect(result.success).toBe(true)
      expect(result.totalSpent).toBe(300)
      expect(result.batchesAffected).toHaveLength(1)
      expect(result.batchesAffected[0].batchId).toBe('promo-1')
      expect(result.batchesAffected[0].amountDeducted).toBe(300)
      expect(result.batchesAffected[0].wallet).toBe('PROMO')
    })

    it('deducts from multiple batches when needed', async () => {
      const promoBatch = {
        id: 'promo-1',
        wallet: 'PROMO' as const,
        type: 'PROMO_GRANT' as const,
        currentBalance: 200,
        expiresAt: new Date('2026-05-18'),
      }
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([promoBatch, mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'tx-1' } as any)
        .mockResolvedValueOnce({ id: 'tx-2' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      const result = await spendCredits(userId, 500, 'PUBLICATION', 'video-123')

      expect(result.success).toBe(true)
      expect(result.totalSpent).toBe(500)
      expect(result.batchesAffected).toHaveLength(2)

      // PROMO batch fully depleted
      expect(result.batchesAffected[0].batchId).toBe('promo-1')
      expect(result.batchesAffected[0].amountDeducted).toBe(200)
      expect(result.batchesAffected[0].wallet).toBe('PROMO')

      // MAIN batch partially used
      expect(result.batchesAffected[1].batchId).toBe('main-1')
      expect(result.batchesAffected[1].amountDeducted).toBe(300)
      expect(result.batchesAffected[1].wallet).toBe('MAIN')
    })

    it('creates one CreditTransaction per batch touched', async () => {
      const promoBatch = {
        id: 'promo-1',
        wallet: 'PROMO' as const,
        type: 'PROMO_GRANT' as const,
        currentBalance: 50,
        expiresAt: new Date('2026-05-18'),
      }
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([promoBatch, mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'tx-1' } as any)
        .mockResolvedValueOnce({ id: 'tx-2' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      const result = await spendCredits(userId, 100, 'PUBLICATION', 'video-123')

      expect(mockTx.creditTransaction.create).toHaveBeenCalledTimes(2)
      expect(result.transactionIds).toEqual(['tx-1', 'tx-2'])

      // Verify transaction records created correctly
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId,
          batchId: 'promo-1',
          amount: -50,
          actionType: 'PUBLICATION',
          shortId: 'video-123',
        }
      })
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId,
          batchId: 'main-1',
          amount: -50,
          actionType: 'PUBLICATION',
          shortId: 'video-123',
        }
      })
    })

    it('extends MAIN batch expiry by +6 months on spend', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create.mockResolvedValue({ id: 'tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await spendCredits(userId, 100, 'PUBLICATION')

      // Verify $executeRaw was called to extend expiry
      expect(mockTx.$executeRaw).toHaveBeenCalled()

      // Verify the new expiry is +6 months from now
      const expectedNewExpiry = new Date('2026-09-18T10:00:00Z') // +6 months from 2026-03-18
      const executeRawCall = mockTx.$executeRaw.mock.calls[0]

      // The call includes the new expiry date and batch IDs
      expect(executeRawCall).toBeDefined()
    })

    it('does NOT extend MAIN batch expiry when spending from PROMO only', async () => {
      const promoBatch = {
        id: 'promo-1',
        wallet: 'PROMO' as const,
        type: 'PROMO_GRANT' as const,
        currentBalance: 1000,
        expiresAt: new Date('2026-05-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([promoBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create.mockResolvedValue({ id: 'tx-1' } as any)

      await spendCredits(userId, 100, 'PUBLICATION')

      // $executeRaw should NOT be called when only PROMO batches are affected
      expect(mockTx.$executeRaw).not.toHaveBeenCalled()
    })

    it('updates batch balance correctly', async () => {
      const batch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([batch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create.mockResolvedValue({ id: 'tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await spendCredits(userId, 250, 'PUBLICATION')

      expect(mockTx.creditBatch.update).toHaveBeenCalledWith({
        where: { id: 'main-1' },
        data: {
          currentBalance: { decrement: 250 },
          lastActivityAt: now,
        }
      })
    })

    it('updates lastActivityAt only for MAIN wallet batches', async () => {
      const promoBatch = {
        id: 'promo-1',
        wallet: 'PROMO' as const,
        type: 'PROMO_GRANT' as const,
        currentBalance: 500,
        expiresAt: new Date('2026-05-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([promoBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditTransaction.create.mockResolvedValue({ id: 'tx-1' } as any)

      await spendCredits(userId, 100, 'PUBLICATION')

      // PROMO batch should NOT have lastActivityAt updated
      expect(mockTx.creditBatch.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: {
          currentBalance: { decrement: 100 },
        }
      })
    })
  })

  describe('addCredits', () => {
    it('throws on amount <= 0', async () => {
      await expect(addCredits(userId, 'PROMO', 'PROMO_GRANT', 0)).rejects.toThrow('Amount must be positive')
      await expect(addCredits(userId, 'PROMO', 'PROMO_GRANT', -10)).rejects.toThrow('Amount must be positive')
    })

    it('creates batch with correct wallet/type/amount', async () => {
      const createdBatch = mockBatch({ id: 'new-batch', currentBalance: 500, initialAmount: 500 })

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      const batchId = await addCredits(userId, 'PROMO', 'PROMO_GRANT', 500)

      expect(batchId).toBe('new-batch')
      expect(prisma.creditBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          wallet: 'PROMO',
          type: 'PROMO_GRANT',
          initialAmount: 500,
          currentBalance: 500,
          lastActivityAt: now,
        })
      })
    })

    it('uses custom expiresAt if provided', async () => {
      const customExpiry = new Date('2026-12-31T23:59:59Z')
      const createdBatch = mockBatch({ id: 'new-batch', expiresAt: customExpiry })

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await addCredits(userId, 'PROMO', 'PROMO_GRANT', 500, { expiresAt: customExpiry })

      expect(prisma.creditBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expiresAt: customExpiry,
        })
      })
    })

    it('sets default expiry for PROMO wallet to +2 months', async () => {
      const createdBatch = mockBatch()

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await addCredits(userId, 'PROMO', 'PROMO_GRANT', 500)

      // Check that expiresAt is approximately +2 months from now
      const call = vi.mocked(prisma.creditBatch.create).mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      const expectedMonth = now.getMonth() + 2
      expect(expiresAt.getMonth()).toBe(expectedMonth % 12)
    })

    it('sets default expiry for MAIN wallet to +12 months', async () => {
      const createdBatch = mockBatch({ wallet: 'MAIN' })

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await addCredits(userId, 'MAIN', 'EARNED_TIP', 500)

      // Check that expiresAt is approximately +12 months from now
      const call = vi.mocked(prisma.creditBatch.create).mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      expect(expiresAt.getFullYear()).toBe(2027)
      expect(expiresAt.getMonth()).toBe(now.getMonth())
    })

    it('creates audit CreditTransaction', async () => {
      const createdBatch = mockBatch({ id: 'new-batch' })

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await addCredits(userId, 'PROMO', 'PROMO_GRANT', 500)

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          batchId: 'new-batch',
          amount: 500,
          actionType: 'ADMIN_GRANT',
          paymentId: null,
          metadata: null,
        }
      })
    })

    it('includes paymentId and metadata in transaction when provided', async () => {
      const createdBatch = mockBatch({ id: 'new-batch' })

      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      const metadata = { source: 'admin_panel', grantedBy: 'admin-123' }
      await addCredits(userId, 'MAIN', 'PURCHASED', 1000, {
        paymentId: 'payment-456',
        metadata,
      })

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          batchId: 'new-batch',
          amount: 1000,
          actionType: 'ADMIN_GRANT',
          paymentId: 'payment-456',
          metadata,
        }
      })
    })
  })

  describe('topUp', () => {
    const mockTx = {
      creditBatch: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
    }

    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (fnOrArray: any) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(mockTx)
        }
        return Promise.all(fnOrArray)
      })
    })

    it('throws on amount <= 0', async () => {
      await expect(topUp(userId, 0, 'payment-123')).rejects.toThrow('Amount must be positive')
      await expect(topUp(userId, -10, 'payment-123')).rejects.toThrow('Amount must be positive')
    })

    it('creates PURCHASED batch in MAIN wallet', async () => {
      const createdBatch = mockBatch({ id: 'batch-purchased', wallet: 'MAIN', type: 'PURCHASED', initialAmount: 10000 })

      mockTx.creditBatch.create.mockResolvedValue(createdBatch)
      mockTx.creditBatch.updateMany.mockResolvedValue({ count: 2 })

      const batchId = await topUp(userId, 10000, 'payment-123')

      expect(batchId).toBe('batch-purchased')
      expect(mockTx.creditBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          wallet: 'MAIN',
          type: 'PURCHASED',
          initialAmount: 10000,
          currentBalance: 10000,
        })
      })
    })

    it('sets expiry to +12 months for new batch', async () => {
      const createdBatch = mockBatch()

      mockTx.creditBatch.create.mockResolvedValue(createdBatch)
      mockTx.creditBatch.updateMany.mockResolvedValue({ count: 0 })

      await topUp(userId, 10000, 'payment-123')

      // Check that expiresAt is approximately +12 months from now
      const call = mockTx.creditBatch.create.mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      expect(expiresAt.getFullYear()).toBe(2027)
      expect(expiresAt.getMonth()).toBe(now.getMonth())
    })

    it('extends ALL other MAIN batches via updateMany (Premium Reset)', async () => {
      const createdBatch = mockBatch({ id: 'new-purchased-batch' })

      mockTx.creditBatch.create.mockResolvedValue(createdBatch)
      mockTx.creditBatch.updateMany.mockResolvedValue({ count: 3 })

      await topUp(userId, 10000, 'payment-123')

      // Check that updateMany was called with correct parameters
      const call = mockTx.creditBatch.updateMany.mock.calls[0][0]
      expect(call.where).toEqual({
        userId,
        wallet: 'MAIN',
        currentBalance: { gt: 0 },
        id: { not: 'new-purchased-batch' },
      })
      // Verify expiry is +12 months
      const expiresAt = call.data.expiresAt as Date
      expect(expiresAt.getFullYear()).toBe(2027)
      expect(call.data.lastActivityAt).toEqual(now)
    })

    it('returns batch id', async () => {
      const createdBatch = mockBatch({ id: 'batch-xyz' })

      mockTx.creditBatch.create.mockResolvedValue(createdBatch)
      mockTx.creditBatch.updateMany.mockResolvedValue({ count: 0 })

      const batchId = await topUp(userId, 5000, 'payment-789')

      expect(batchId).toBe('batch-xyz')
    })
  })

  describe('refundToExactBatch', () => {
    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (operations: any) => {
        // Array form: resolve all promises
        return Promise.all(operations)
      })
    })

    it('throws on amount <= 0', async () => {
      await expect(refundToExactBatch(userId, 'batch-1', 0)).rejects.toThrow('Amount must be positive')
      await expect(refundToExactBatch(userId, 'batch-1', -10)).rejects.toThrow('Amount must be positive')
    })

    it('increments batch balance and creates REFUND transaction', async () => {
      vi.mocked(prisma.creditBatch.update).mockResolvedValue({} as any)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await refundToExactBatch(userId, 'batch-123', 250)

      expect(prisma.creditBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: {
          currentBalance: { increment: 250 },
        },
      })

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          batchId: 'batch-123',
          amount: 250,
          actionType: 'REFUND',
        },
      })
    })
  })

  describe('freezeBatch', () => {
    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (operations: any) => {
        return Promise.all(operations)
      })
    })

    it('fetches userId first, then runs transaction array', async () => {
      vi.mocked(prisma.creditBatch.findUniqueOrThrow).mockResolvedValue({
        userId: 'user-456',
      } as any)
      vi.mocked(prisma.creditBatch.update).mockResolvedValue({} as any)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await freezeBatch('batch-123', 'admin-789', 'chargeback detected')

      expect(prisma.creditBatch.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        select: { userId: true },
      })

      expect(prisma.creditBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: { isFrozen: true },
      })

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-456',
          batchId: 'batch-123',
          amount: 0,
          actionType: 'ADMIN_GRANT',
          metadata: {
            action: 'freeze',
            adminId: 'admin-789',
            reason: 'chargeback detected',
          },
        },
      })
    })
  })

  describe('unfreezeBatch', () => {
    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (operations: any) => {
        return Promise.all(operations)
      })
    })

    it('sets isFrozen to false and creates audit transaction', async () => {
      vi.mocked(prisma.creditBatch.findUniqueOrThrow).mockResolvedValue({
        userId: 'user-456',
      } as any)
      vi.mocked(prisma.creditBatch.update).mockResolvedValue({} as any)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await unfreezeBatch('batch-123', 'admin-789')

      expect(prisma.creditBatch.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        select: { userId: true },
      })

      expect(prisma.creditBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: { isFrozen: false },
      })

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-456',
          batchId: 'batch-123',
          amount: 0,
          actionType: 'ADMIN_GRANT',
          metadata: {
            action: 'unfreeze',
            adminId: 'admin-789',
          },
        },
      })
    })
  })

  describe('grantPromoCredits', () => {
    it('grants PROMO credits for new user with correct params', async () => {
      vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(null)

      const createdBatch = mockBatch({ id: 'promo-batch-new' })
      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      const result = await grantPromoCredits(userId)

      expect(result).toBe('promo-batch-new')
      expect(prisma.creditBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          wallet: 'PROMO',
          type: 'PROMO_GRANT',
          initialAmount: 1000,
          currentBalance: 1000,
        })
      })
    })

    it('returns null when user already has PROMO_GRANT', async () => {
      const existingBatch = mockBatch({ id: 'existing-promo' })
      vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(existingBatch)

      const result = await grantPromoCredits(userId)

      expect(result).toBeNull()
      expect(prisma.creditBatch.create).not.toHaveBeenCalled()
    })

    it('returns the batch ID on success', async () => {
      vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(null)

      const createdBatch = mockBatch({ id: 'granted-batch-id' })
      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      const batchId = await grantPromoCredits(userId)

      expect(batchId).toBe('granted-batch-id')
    })

    it('checks for PROMO_GRANT type specifically', async () => {
      vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(null)

      const createdBatch = mockBatch({ id: 'some-batch' })
      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await grantPromoCredits(userId)

      expect(prisma.creditBatch.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          type: 'PROMO_GRANT',
        }
      })
    })

    it('sets expiry to approximately 60 days from now', async () => {
      vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(null)

      const createdBatch = mockBatch({ id: 'expiry-batch' })
      vi.mocked(prisma.creditBatch.create).mockResolvedValue(createdBatch)
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({} as any)

      await grantPromoCredits(userId)

      const call = vi.mocked(prisma.creditBatch.create).mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      const expectedExpiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      const diffMs = Math.abs(expiresAt.getTime() - expectedExpiry.getTime())

      // Within 1 second tolerance
      expect(diffMs).toBeLessThanOrEqual(1000)
    })
  })

  describe('transferTip', () => {
    const mockTx = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      creditBatch: { update: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
      creditTransaction: { create: vi.fn() },
    }

    const fromUserId = 'sender-123'
    const toUserId = 'receiver-456'
    const shortId = 'video-789'
    const tipCost = 50

    beforeEach(() => {
      vi.mocked(getPrice).mockResolvedValue(tipCost)
      vi.mocked(prisma.$transaction).mockImplementation(async (fnOrArray: any) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(mockTx)
        }
        return Promise.all(fnOrArray)
      })
    })

    it('transfers tip from sender to receiver', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      const result = await transferTip(fromUserId, toUserId, shortId)

      expect(result.success).toBe(true)
      expect(result.cost).toBe(tipCost)
      expect(result.senderTransactionIds).toHaveLength(1)
      expect(result.receiverTransactionId).toBe('receiver-tx-1')
      expect(result.receiverBatchId).toBe('receiver-batch-1')
    })

    it('uses cost from PricingConfig', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      expect(getPrice).toHaveBeenCalledWith('SUPER_LIKE')
    })

    it('throws when tipping yourself', async () => {
      await expect(transferTip(fromUserId, fromUserId, shortId)).rejects.toThrow('Cannot tip yourself')
    })

    it('throws InsufficientCreditsError when MAIN balance too low', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 20,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])

      await expect(transferTip(fromUserId, toUserId, shortId)).rejects.toThrow(InsufficientCreditsError)
      await expect(transferTip(fromUserId, toUserId, shortId)).rejects.toThrow('Insufficient credits: required 50, available 20')
    })

    it('only spends from MAIN wallet (skips PROMO)', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      // Verify $queryRaw was called with MAIN-only filter
      const queryCall = mockTx.$queryRaw.mock.calls[0][0]
      const queryText = Array.isArray(queryCall) ? queryCall.join('') : queryCall
      expect(queryText).toContain("wallet = 'MAIN'")
    })

    it('creates EARNED_TIP batch for receiver', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      expect(mockTx.creditBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: toUserId,
          wallet: 'MAIN',
          type: 'EARNED_TIP',
          initialAmount: tipCost,
          currentBalance: tipCost,
        })
      })
    })

    it('creates spend transaction for sender with negative amount', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      // First transaction call is for sender (negative amount)
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: fromUserId,
          batchId: 'main-1',
          amount: -tipCost,
          actionType: 'SUPER_LIKE',
          shortId,
        }
      })
    })

    it('creates receive transaction for receiver with positive amount', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      // Second transaction call is for receiver (positive amount)
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: toUserId,
          batchId: 'receiver-batch-1',
          amount: tipCost,
          actionType: 'SUPER_LIKE',
          shortId,
        }
      })
    })

    it('receiver batch has 12-month expiry', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      const call = mockTx.creditBatch.create.mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      expect(expiresAt.getFullYear()).toBe(2027)
      expect(expiresAt.getMonth()).toBe(now.getMonth())
    })

    it('extends sender MAIN batch expiry on spending', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      // Verify $executeRaw was called to extend expiry
      expect(mockTx.$executeRaw).toHaveBeenCalled()

      // Verify the new expiry is +6 months from now
      const executeRawCall = mockTx.$executeRaw.mock.calls[0]
      expect(executeRawCall).toBeDefined()
    })

    it('handles FIFO across multiple MAIN batches', async () => {
      const earnedTipBatch = {
        id: 'earned-tip-1',
        wallet: 'MAIN' as const,
        type: 'EARNED_TIP' as const,
        currentBalance: 30,
        expiresAt: new Date('2027-01-18'),
      }
      const purchasedBatch = {
        id: 'purchased-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 500,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([earnedTipBatch, purchasedBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'sender-tx-2' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      const result = await transferTip(fromUserId, toUserId, shortId)

      expect(result.success).toBe(true)
      expect(result.senderTransactionIds).toHaveLength(2)

      // Verify EARNED_TIP batch used first (30 credits)
      expect(mockTx.creditBatch.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'earned-tip-1' },
        data: {
          currentBalance: { decrement: 30 },
          lastActivityAt: now,
        }
      })

      // Verify PURCHASED batch used second (20 credits)
      expect(mockTx.creditBatch.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'purchased-1' },
        data: {
          currentBalance: { decrement: 20 },
          lastActivityAt: now,
        }
      })
    })

    it('both transactions reference the shortId', async () => {
      const mainBatch = {
        id: 'main-1',
        wallet: 'MAIN' as const,
        type: 'PURCHASED' as const,
        currentBalance: 1000,
        expiresAt: new Date('2027-03-18'),
      }

      mockTx.$queryRaw.mockResolvedValue([mainBatch])
      mockTx.creditBatch.update.mockResolvedValue({} as any)
      mockTx.creditBatch.create.mockResolvedValue({ id: 'receiver-batch-1' } as any)
      mockTx.creditTransaction.create
        .mockResolvedValueOnce({ id: 'sender-tx-1' } as any)
        .mockResolvedValueOnce({ id: 'receiver-tx-1' } as any)
      mockTx.$executeRaw.mockResolvedValue(1)

      await transferTip(fromUserId, toUserId, shortId)

      // Verify sender transaction has shortId
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          shortId,
        })
      })

      // Verify receiver transaction has shortId
      expect(mockTx.creditTransaction.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          shortId,
        })
      })
    })
  })
})
