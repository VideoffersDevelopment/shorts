import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock wallet services
vi.mock('@/lib/wallet/wallet-service', () => ({
  getWalletBalance: vi.fn(),
  spendCredits: vi.fn(),
  addCredits: vi.fn(),
  topUp: vi.fn(),
  refundToExactBatch: vi.fn(),
}))

// Mock pricing service
vi.mock('@/lib/wallet/pricing-service', () => ({
  getPrice: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    companyProfile: {
      findUnique: vi.fn()
    },
    short: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    creditTransaction: {
      findMany: vi.fn()
    }
  }
}))

// Mock inngest
vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn()
  }
}))

import { prisma } from '@/lib/prisma'
import { inngest } from '@/lib/inngest/client'
import { getWalletBalance, spendCredits, addCredits, topUp, refundToExactBatch } from '@/lib/wallet/wallet-service'
import { getPrice } from '@/lib/wallet/pricing-service'
import {
  initiatePublication,
  addCreditsFromPayment,
  deductCredit,
  getCreditBalance,
  refundCredit
} from '../publication-controller'

describe('Publication Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // initiatePublication
  // ===========================================================================

  describe('initiatePublication', () => {
    // -------------------------------------------------------------------------
    // HAPPY PATH
    // -------------------------------------------------------------------------

    describe('Happy Path', () => {
      it('successfully initiates publication when wallet has enough credits', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)

        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 500,
          bonus: 300,
          voucher: 200
        })

        vi.mocked(getPrice).mockResolvedValue(100)

        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: 'videos/raw/test.mp4',
          title: 'Test Short'
        } as never)

        vi.mocked(spendCredits).mockResolvedValue({
          newBalance: 900,
          spent: {
            main: 100,
            bonus: 0,
            voucher: 0
          }
        })

        vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-1'] } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(true)
        expect(result.requiresPayment).toBe(false)
        expect(result.processing).toBe(true)
        expect(result.redirectUrl).toBe('/panel/shorts/short-1')
        expect(spendCredits).toHaveBeenCalledWith('user-1', 100, 'PUBLICATION', 'short-1')
        expect(inngest.send).toHaveBeenCalledWith({
          name: 'shorts/transcode.started',
          data: {
            shortId: 'short-1',
            rawVideoKey: 'videos/raw/test.mp4',
            userId: 'user-1'
          }
        })
      })

      it('returns requiresPayment when wallet has insufficient credits', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)

        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 50,
          main: 50,
          bonus: 0,
          voucher: 0
        })

        vi.mocked(getPrice).mockResolvedValue(100)

        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: 'videos/raw/test.mp4',
          title: 'Test Short'
        } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(true)
        expect(result.requiresPayment).toBe(true)
        expect(result.processing).toBeUndefined()
        expect(spendCredits).not.toHaveBeenCalled()
        expect(inngest.send).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // VALIDATION FAILURES
    // -------------------------------------------------------------------------

    describe('Validation Failures', () => {
      it('returns error when company not found', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue(null)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: 'test.mp4'
        } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Company not found')
      })

      it('returns error when short not found', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Short not found')
      })

      it('returns error when short is not in DRAFT status', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'PUBLISHED',
          rawVideoKey: 'test.mp4',
          title: 'Test'
        } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Short must be in DRAFT status')
      })

      it('returns error when no video uploaded', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: null,
          title: 'Test'
        } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('No video uploaded')
      })
    })

    // -------------------------------------------------------------------------
    // AUTHORIZATION FAILURES
    // -------------------------------------------------------------------------

    describe('Authorization Failures', () => {
      it('returns requiresVerification when company not verified', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: false
        } as never)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: 'test.mp4',
          title: 'Test'
        } as never)

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.requiresVerification).toBe(true)
        expect(result.error).toBe('Company must be verified first')
      })
    })

    // -------------------------------------------------------------------------
    // PAYMENT ERRORS
    // -------------------------------------------------------------------------

    describe('Payment Errors', () => {
      it('returns error when credit deduction fails', async () => {
        vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
          id: 'company-1',
          viesVerified: true
        } as never)
        vi.mocked(getWalletBalance).mockResolvedValue({
          total: 1000,
          main: 1000,
          bonus: 0,
          voucher: 0
        })
        vi.mocked(getPrice).mockResolvedValue(100)
        vi.mocked(prisma.short.findFirst).mockResolvedValue({
          id: 'short-1',
          status: 'DRAFT',
          rawVideoKey: 'test.mp4',
          title: 'Test'
        } as never)
        vi.mocked(spendCredits).mockRejectedValue(new Error('Insufficient funds'))

        const result = await initiatePublication('user-1', 'short-1', 'company-1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to deduct credit')
      })
    })
  })

  // ===========================================================================
  // addCreditsFromPayment
  // ===========================================================================

  describe('addCreditsFromPayment', () => {
    it('adds credits with payment reference via topUp', async () => {
      vi.mocked(topUp).mockResolvedValue()

      await addCreditsFromPayment('user-1', 5, 'payment-123')

      expect(topUp).toHaveBeenCalledWith('user-1', 5, 'payment-123')
    })

    it('handles large credit amounts', async () => {
      vi.mocked(topUp).mockResolvedValue()

      await addCreditsFromPayment('user-1', 1000, 'payment-999')

      expect(topUp).toHaveBeenCalledWith('user-1', 1000, 'payment-999')
    })
  })

  // ===========================================================================
  // deductCredit
  // ===========================================================================

  describe('deductCredit', () => {
    it('successfully deducts credits for publication', async () => {
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(spendCredits).mockResolvedValue({
        newBalance: 900,
        spent: {
          main: 100,
          bonus: 0,
          voucher: 0
        }
      })

      const result = await deductCredit('user-1', 'short-1')

      expect(result).toBe(true)
      expect(getPrice).toHaveBeenCalledWith('PUBLICATION')
      expect(spendCredits).toHaveBeenCalledWith('user-1', 100, 'PUBLICATION', 'short-1')
    })

    it('returns false when spendCredits throws error', async () => {
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(spendCredits).mockRejectedValue(new Error('Insufficient funds'))

      const result = await deductCredit('user-1', 'short-1')

      expect(result).toBe(false)
    })

    it('returns false when getPrice throws error', async () => {
      vi.mocked(getPrice).mockRejectedValue(new Error('Price not found'))

      const result = await deductCredit('user-1', 'short-1')

      expect(result).toBe(false)
    })

    it('uses correct publication type', async () => {
      vi.mocked(getPrice).mockResolvedValue(150)
      vi.mocked(spendCredits).mockResolvedValue({
        newBalance: 850,
        spent: {
          main: 150,
          bonus: 0,
          voucher: 0
        }
      })

      await deductCredit('user-1', 'short-2')

      expect(getPrice).toHaveBeenCalledWith('PUBLICATION')
      expect(spendCredits).toHaveBeenCalledWith('user-1', 150, 'PUBLICATION', 'short-2')
    })
  })

  // ===========================================================================
  // getCreditBalance
  // ===========================================================================

  describe('getCreditBalance', () => {
    it('returns total credit balance from wallet', async () => {
      vi.mocked(getWalletBalance).mockResolvedValue({
        total: 1234,
        main: 1000,
        bonus: 200,
        voucher: 34
      })

      const balance = await getCreditBalance('user-1')

      expect(balance).toBe(1234)
      expect(getWalletBalance).toHaveBeenCalledWith('user-1')
    })

    it('returns 0 when wallet has no credits', async () => {
      vi.mocked(getWalletBalance).mockResolvedValue({
        total: 0,
        main: 0,
        bonus: 0,
        voucher: 0
      })

      const balance = await getCreditBalance('user-1')

      expect(balance).toBe(0)
    })

    it('handles large balance amounts', async () => {
      vi.mocked(getWalletBalance).mockResolvedValue({
        total: 999999,
        main: 999999,
        bonus: 0,
        voucher: 0
      })

      const balance = await getCreditBalance('user-1')

      expect(balance).toBe(999999)
    })
  })

  // ===========================================================================
  // refundCredit
  // ===========================================================================

  describe('refundCredit', () => {
    it('refunds to exact batch when spend transaction found', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([
        { id: 'tx-1', userId: 'user-1', shortId: 'short-1', amount: -100, batchId: 'batch-1', actionType: 'PUBLICATION' }
      ] as never)
      vi.mocked(refundToExactBatch).mockResolvedValue()

      await refundCredit('user-1', 'short-1')

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          shortId: 'short-1',
          amount: { lt: 0 },
          actionType: 'PUBLICATION'
        }
      })
      expect(refundToExactBatch).toHaveBeenCalledWith('user-1', 'batch-1', 100)
      expect(addCredits).not.toHaveBeenCalled()
    })

    it('refunds to multiple batches when spend touched multiple batches', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([
        { id: 'tx-1', userId: 'user-1', shortId: 'short-1', amount: -60, batchId: 'batch-1', actionType: 'PUBLICATION' },
        { id: 'tx-2', userId: 'user-1', shortId: 'short-1', amount: -40, batchId: 'batch-2', actionType: 'PUBLICATION' }
      ] as never)
      vi.mocked(refundToExactBatch).mockResolvedValue()

      await refundCredit('user-1', 'short-1')

      expect(refundToExactBatch).toHaveBeenCalledTimes(2)
      expect(refundToExactBatch).toHaveBeenCalledWith('user-1', 'batch-1', 60)
      expect(refundToExactBatch).toHaveBeenCalledWith('user-1', 'batch-2', 40)
      expect(addCredits).not.toHaveBeenCalled()
    })

    it('falls back to addCredits when no transactions found', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([] as never)
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(addCredits).mockResolvedValue()

      await refundCredit('user-1', 'short-1')

      expect(getPrice).toHaveBeenCalledWith('PUBLICATION')
      expect(addCredits).toHaveBeenCalledWith('user-1', 'MAIN', 'BONUS', 100, {
        metadata: { action: 'refund', shortId: 'short-1' }
      })
      expect(refundToExactBatch).not.toHaveBeenCalled()
    })

    it('skips transactions without batchId', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([
        { id: 'tx-1', userId: 'user-1', shortId: 'short-1', amount: -50, batchId: null, actionType: 'PUBLICATION' },
        { id: 'tx-2', userId: 'user-1', shortId: 'short-1', amount: -50, batchId: 'batch-2', actionType: 'PUBLICATION' }
      ] as never)
      vi.mocked(refundToExactBatch).mockResolvedValue()

      await refundCredit('user-1', 'short-1')

      expect(refundToExactBatch).toHaveBeenCalledTimes(1)
      expect(refundToExactBatch).toHaveBeenCalledWith('user-1', 'batch-2', 50)
      expect(addCredits).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles wallet with exactly enough credits', async () => {
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
        id: 'company-1',
        viesVerified: true
      } as never)
      vi.mocked(getWalletBalance).mockResolvedValue({
        total: 100,
        main: 100,
        bonus: 0,
        voucher: 0
      })
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: 'short-1',
        status: 'DRAFT',
        rawVideoKey: 'test.mp4',
        title: 'Test'
      } as never)
      vi.mocked(spendCredits).mockResolvedValue({
        newBalance: 0,
        spent: {
          main: 100,
          bonus: 0,
          voucher: 0
        }
      })
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-1'] } as never)

      const result = await initiatePublication('user-1', 'short-1', 'company-1')

      expect(result.success).toBe(true)
      expect(result.processing).toBe(true)
    })

    it('handles wallet with mixed credit types', async () => {
      vi.mocked(prisma.companyProfile.findUnique).mockResolvedValue({
        id: 'company-1',
        viesVerified: true
      } as never)
      vi.mocked(getWalletBalance).mockResolvedValue({
        total: 500,
        main: 200,
        bonus: 200,
        voucher: 100
      })
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(prisma.short.findFirst).mockResolvedValue({
        id: 'short-1',
        status: 'DRAFT',
        rawVideoKey: 'test.mp4',
        title: 'Test'
      } as never)
      vi.mocked(spendCredits).mockResolvedValue({
        newBalance: 400,
        spent: {
          main: 0,
          bonus: 100,
          voucher: 0
        }
      })
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-1'] } as never)

      const result = await initiatePublication('user-1', 'short-1', 'company-1')

      expect(result.success).toBe(true)
      expect(result.processing).toBe(true)
    })

    it('handles edge case with 0 credits needed (free publication)', async () => {
      vi.mocked(getPrice).mockResolvedValue(0)
      vi.mocked(spendCredits).mockResolvedValue({
        newBalance: 1000,
        spent: {
          main: 0,
          bonus: 0,
          voucher: 0
        }
      })

      const result = await deductCredit('user-1', 'short-1')

      expect(result).toBe(true)
      expect(spendCredits).toHaveBeenCalledWith('user-1', 0, 'PUBLICATION', 'short-1')
    })
  })
})
