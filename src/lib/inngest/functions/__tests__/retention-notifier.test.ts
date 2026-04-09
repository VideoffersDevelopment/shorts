import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    creditBatch: { findMany: vi.fn() },
    notificationLog: { findUnique: vi.fn(), create: vi.fn() },
    shortStats: { aggregate: vi.fn() },
    user: { findUnique: vi.fn() },
    $queryRaw: vi.fn()
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

vi.mock('@/lib/email', () => ({
  sendCreditExpiry30dEmail: vi.fn(),
  sendCreditExpiry7dEmail: vi.fn(),
  sendCreditExpiry1dEmail: vi.fn(),
  sendReachLossWarningEmail: vi.fn(),
  sendMaintenanceFeeNoticeEmail: vi.fn()
}))

vi.mock('@/lib/wallet/pricing-service', () => ({
  getPrice: vi.fn()
}))

vi.mock('@/lib/wallet/wallet-constants', () => ({
  pointsToApproxPLN: vi.fn((points: number) => (points * 0.0015).toFixed(2))
}))

import { prisma } from '@/lib/prisma'
import {
  sendCreditExpiry30dEmail,
  sendCreditExpiry7dEmail,
  sendCreditExpiry1dEmail,
  sendReachLossWarningEmail,
  sendMaintenanceFeeNoticeEmail
} from '@/lib/email'
import { getPrice } from '@/lib/wallet/pricing-service'
import { pointsToApproxPLN } from '@/lib/wallet/wallet-constants'
import { sendRetentionNotifications } from '../retention-notifier'

const mockPrisma = vi.mocked(prisma)
const mockEmailFunctions = {
  sendCreditExpiry30dEmail: vi.mocked(sendCreditExpiry30dEmail),
  sendCreditExpiry7dEmail: vi.mocked(sendCreditExpiry7dEmail),
  sendCreditExpiry1dEmail: vi.mocked(sendCreditExpiry1dEmail),
  sendReachLossWarningEmail: vi.mocked(sendReachLossWarningEmail),
  sendMaintenanceFeeNoticeEmail: vi.mocked(sendMaintenanceFeeNoticeEmail)
}
const mockGetPrice = vi.mocked(getPrice)
const mockPointsToApproxPLN = vi.mocked(pointsToApproxPLN)

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
  totalSent: number
  breakdown: {
    expiry30d: number
    expiry7d: number
    expiry1d: number
    promoReachLoss: number
    maintenanceFee: number
  }
}
type HandlerFn = (ctx: { step: ReturnType<typeof createMockStep> }) => Promise<HandlerResult>

function createMockBatch(overrides = {}) {
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30)

  return {
    id: 'batch-1',
    userId: 'user-1',
    wallet: 'MAIN',
    type: 'PURCHASED',
    currentBalance: 1000,
    isFrozen: false,
    expiresAt,
    user: {
      id: 'user-1',
      email: 'user@example.com'
    },
    ...overrides
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('sendRetentionNotifications Inngest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks: empty arrays/null
    mockPrisma.creditBatch.findMany.mockResolvedValue([])
    mockPrisma.notificationLog.findUnique.mockResolvedValue(null)
    mockPrisma.notificationLog.create.mockResolvedValue({} as never)
    mockPrisma.shortStats.aggregate.mockResolvedValue({ _sum: { views: 0 } } as never)
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.$queryRaw.mockResolvedValue([])
    mockGetPrice.mockResolvedValue(100)
    mockPointsToApproxPLN.mockImplementation((points: number) => (points * 0.0015).toFixed(2))
  })

  // =========================================================================
  // EMPTY STATE
  // =========================================================================

  describe('Empty State', () => {
    it('returns totalSent 0 when no batches found', async () => {
      const mockStep = createMockStep()

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.totalSent).toBe(0)
      expect(result.breakdown).toEqual({
        expiry30d: 0,
        expiry7d: 0,
        expiry1d: 0,
        promoReachLoss: 0,
        maintenanceFee: 0
      })
    })
  })

  // =========================================================================
  // 30-DAY EXPIRY WARNINGS
  // =========================================================================

  describe('30-Day Expiry Warnings', () => {
    it('sends 30d expiry email for MAIN batch expiring in 30 days', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({ expiresAt, currentBalance: 5000 })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(1)
      expect(result.breakdown.expiry30d).toBe(1)
      expect(mockEmailFunctions.sendCreditExpiry30dEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        points: 5000,
        valuePLN: '7.50',
        expiresAt,
        topUpUrl: expect.stringContaining('/panel/wallet')
      })
    })

    it('creates NotificationLog record after sending 30d email', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({ expiresAt })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          triggerType: 'EXPIRY_WARN_30D',
          batchId: 'batch-1',
          channel: 'email'
        }
      })
    })

    it('uses pointsToApproxPLN for 30d email valuePLN', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({ expiresAt, currentBalance: 10000 })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPointsToApproxPLN).toHaveBeenCalledWith(10000)
      expect(mockEmailFunctions.sendCreditExpiry30dEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          valuePLN: '15.00'
        })
      )
    })
  })

  // =========================================================================
  // 7-DAY EXPIRY WARNINGS
  // =========================================================================

  describe('7-Day Expiry Warnings', () => {
    it('sends 7d expiry email for MAIN batch expiring in 7 days', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)

      const batch = createMockBatch({ expiresAt, currentBalance: 3000 })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 6 && dayDiff <= 8) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(1)
      expect(result.breakdown.expiry7d).toBe(1)
      expect(mockEmailFunctions.sendCreditExpiry7dEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        points: 3000,
        expiresAt,
        topUpUrl: expect.stringContaining('/panel/wallet')
      })
    })

    it('creates NotificationLog with triggerType EXPIRY_WARN_7D', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)

      const batch = createMockBatch({ expiresAt })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 6 && dayDiff <= 8) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          triggerType: 'EXPIRY_WARN_7D',
          batchId: 'batch-1',
          channel: 'email'
        }
      })
    })
  })

  // =========================================================================
  // 1-DAY EXPIRY WARNINGS
  // =========================================================================

  describe('1-Day Expiry Warnings', () => {
    it('sends 1d expiry email for MAIN batch expiring in 1 day', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 1)

      const batch = createMockBatch({ expiresAt, currentBalance: 2000 })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const lte = (query.where.expiresAt as { lte?: Date }).lte as Date
          const gteDay = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const lteDay = Math.round((lte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (gteDay >= 0 && lteDay <= 2) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(1)
      expect(result.breakdown.expiry1d).toBe(1)
      expect(mockEmailFunctions.sendCreditExpiry1dEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        points: 2000,
        expiresAt,
        topUpUrl: expect.stringContaining('/panel/wallet')
      })
    })

    it('creates NotificationLog with triggerType EXPIRY_WARN_1D', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 1)

      const batch = createMockBatch({ expiresAt })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const lte = (query.where.expiresAt as { lte?: Date }).lte as Date
          const gteDay = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const lteDay = Math.round((lte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (gteDay >= 0 && lteDay <= 2) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          triggerType: 'EXPIRY_WARN_1D',
          batchId: 'batch-1',
          channel: 'email'
        }
      })
    })
  })

  // =========================================================================
  // ANTI-SPAM
  // =========================================================================

  describe('Anti-Spam', () => {
    it('skips email if NotificationLog already exists', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({ expiresAt })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      // NotificationLog exists (email already sent)
      mockPrisma.notificationLog.findUnique.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        triggerType: 'EXPIRY_WARN_30D',
        batchId: 'batch-1'
      } as never)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(0)
      expect(mockEmailFunctions.sendCreditExpiry30dEmail).not.toHaveBeenCalled()
      expect(mockPrisma.notificationLog.create).not.toHaveBeenCalled()
    })

    it('skips batch if user has no email', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({
        expiresAt,
        user: {
          id: 'user-1',
          email: null
        }
      })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(0)
      expect(mockEmailFunctions.sendCreditExpiry30dEmail).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // PROMO REACH LOSS WARNINGS
  // =========================================================================

  describe('Promo Reach Loss Warnings', () => {
    it('sends reach-loss-warning for PROMO-only users', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)

      const promoBatch = createMockBatch({
        wallet: 'PROMO',
        expiresAt,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          creditBatches: [] // No PURCHASED MAIN batches
        }
      })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'PROMO' && query?.where?.expiresAt?.gte) {
          return [promoBatch] as never
        }
        return [] as never
      })

      mockPrisma.shortStats.aggregate.mockResolvedValue({
        _sum: { views: 15000 }
      } as never)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(1)
      expect(result.breakdown.promoReachLoss).toBe(1)
      expect(mockEmailFunctions.sendReachLossWarningEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        views: 15000,
        promoExpiresAt: expiresAt,
        topUpUrl: expect.stringContaining('/panel/wallet')
      })
    })

    it('does NOT send reach-loss for users with PURCHASED batches', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)

      const promoBatch = createMockBatch({
        wallet: 'PROMO',
        expiresAt,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          creditBatches: [{ id: 'main-batch-1' }] // Has PURCHASED MAIN batch
        }
      })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'PROMO' && query?.where?.expiresAt?.gte) {
          return [promoBatch] as never
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(0)
      expect(mockEmailFunctions.sendReachLossWarningEmail).not.toHaveBeenCalled()
    })

    it('creates NotificationLog with triggerType REACH_LOSS_WARN', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)

      const promoBatch = createMockBatch({
        wallet: 'PROMO',
        expiresAt,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          creditBatches: []
        }
      })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'PROMO' && query?.where?.expiresAt?.gte) {
          return [promoBatch] as never
        }
        return [] as never
      })

      mockPrisma.shortStats.aggregate.mockResolvedValue({
        _sum: { views: 5000 }
      } as never)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          triggerType: 'REACH_LOSS_WARN',
          batchId: 'batch-1',
          channel: 'email'
        }
      })
    })
  })

  // =========================================================================
  // MAINTENANCE FEE WARNINGS
  // =========================================================================

  describe('Maintenance Fee Warnings', () => {
    it('sends maintenance-fee-notice for inactive users', async () => {
      const mockStep = createMockStep()
      const now = new Date()

      const inactiveUser = {
        userId: 'user-inactive',
        totalBalance: 5000,
        lastActivity: new Date('2025-01-01')
      }

      mockPrisma.$queryRaw.mockResolvedValue([inactiveUser] as never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-inactive',
        email: 'inactive@example.com'
      } as never)
      mockGetPrice.mockResolvedValue(200)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.totalSent).toBe(1)
      expect(result.breakdown.maintenanceFee).toBe(1)
      expect(mockEmailFunctions.sendMaintenanceFeeNoticeEmail).toHaveBeenCalledWith({
        to: 'inactive@example.com',
        amount: 200,
        remainingBalance: 5000,
        topUpUrl: expect.stringContaining('/panel/wallet')
      })
    })

    it('uses getPrice for maintenance fee amount', async () => {
      const mockStep = createMockStep()

      const inactiveUser = {
        userId: 'user-inactive',
        totalBalance: 3000,
        lastActivity: new Date('2025-01-01')
      }

      mockPrisma.$queryRaw.mockResolvedValue([inactiveUser] as never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-inactive',
        email: 'inactive@example.com'
      } as never)
      mockGetPrice.mockResolvedValue(150)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockGetPrice).toHaveBeenCalledWith('MAINTENANCE_FEE')
      expect(mockEmailFunctions.sendMaintenanceFeeNoticeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150
        })
      )
    })

    it('creates NotificationLog with triggerType MAINTENANCE_FEE_WARN and null batchId', async () => {
      const mockStep = createMockStep()

      const inactiveUser = {
        userId: 'user-inactive',
        totalBalance: 4000,
        lastActivity: new Date('2025-01-01')
      }

      mockPrisma.$queryRaw.mockResolvedValue([inactiveUser] as never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-inactive',
        email: 'inactive@example.com'
      } as never)

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-inactive',
          triggerType: 'MAINTENANCE_FEE_WARN',
          batchId: null,
          channel: 'email'
        }
      })
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('handles email sending errors gracefully without crashing', async () => {
      const mockStep = createMockStep()
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)

      const batch = createMockBatch({ expiresAt })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch] as never
          }
        }
        return [] as never
      })

      mockEmailFunctions.sendCreditExpiry30dEmail.mockRejectedValue(
        new Error('Email service unavailable')
      )

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      // Should not crash, should return success: true
      expect(result.success).toBe(true)
      expect(result.totalSent).toBe(0)
      expect(mockPrisma.notificationLog.create).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // STEP EXECUTION
  // =========================================================================

  describe('Step Execution', () => {
    it('runs all 5 steps', async () => {
      const mockStep = createMockStep()

      const handler = sendRetentionNotifications as unknown as HandlerFn
      await handler({ step: mockStep })

      expect(mockStep.run).toHaveBeenCalledTimes(5)
      expect(mockStep.run).toHaveBeenCalledWith('warn-30d', expect.any(Function))
      expect(mockStep.run).toHaveBeenCalledWith('warn-7d', expect.any(Function))
      expect(mockStep.run).toHaveBeenCalledWith('warn-1d', expect.any(Function))
      expect(mockStep.run).toHaveBeenCalledWith('warn-promo-expiry', expect.any(Function))
      expect(mockStep.run).toHaveBeenCalledWith('warn-maintenance-fee', expect.any(Function))
    })
  })

  // =========================================================================
  // RESULT BREAKDOWN
  // =========================================================================

  describe('Result Breakdown', () => {
    it('returns correct breakdown in result', async () => {
      const mockStep = createMockStep()
      const now = new Date()

      // Reset email mocks to resolve successfully
      mockEmailFunctions.sendCreditExpiry30dEmail.mockResolvedValue(undefined)
      mockEmailFunctions.sendCreditExpiry7dEmail.mockResolvedValue(undefined)

      // 30d batch
      const batch30d = createMockBatch({
        id: 'batch-30d',
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      })

      // 7d batch
      const batch7d = createMockBatch({
        id: 'batch-7d',
        userId: 'user-2',
        user: { id: 'user-2', email: 'user2@example.com' },
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      })

      mockPrisma.creditBatch.findMany.mockImplementation(async (query) => {
        if (query?.where?.wallet === 'MAIN' && query?.where?.expiresAt?.gte) {
          const gte = query.where.expiresAt.gte as Date
          const dayDiff = Math.round((gte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (dayDiff >= 29 && dayDiff <= 31) {
            return [batch30d] as never
          }
          if (dayDiff >= 6 && dayDiff <= 8) {
            return [batch7d] as never
          }
        }
        return [] as never
      })

      const handler = sendRetentionNotifications as unknown as HandlerFn
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.totalSent).toBe(2)
      expect(result.breakdown.expiry30d).toBe(1)
      expect(result.breakdown.expiry7d).toBe(1)
      expect(result.breakdown.expiry1d).toBe(0)
      expect(result.breakdown.promoReachLoss).toBe(0)
      expect(result.breakdown.maintenanceFee).toBe(0)
    })
  })
})
