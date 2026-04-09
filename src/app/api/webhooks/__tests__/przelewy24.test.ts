import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/payments/przelewy24', () => ({
  verifyPrzelewy24Signature: vi.fn(),
  verifyPrzelewy24Transaction: vi.fn()
}))

vi.mock('@/lib/publication/publication-controller', () => ({
  addCreditsFromPayment: vi.fn()
}))

import { prisma } from '@/lib/prisma'
import { verifyPrzelewy24Signature, verifyPrzelewy24Transaction } from '@/lib/payments/przelewy24'
import { addCreditsFromPayment } from '@/lib/publication/publication-controller'
import { POST } from '../przelewy24/route'

describe('POST /api/webhooks/przelewy24', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create form data request with proper Content-Type header
  function createWebhookRequest(data: Record<string, string | number>): Request {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, String(value))
    })

    return new Request('http://localhost:3000/api/webhooks/przelewy24', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
  }

  const validWebhookData = {
    merchantId: 12345,
    posId: 12345,
    sessionId: 'session_abc123',
    amount: 10000,
    originAmount: 10000,
    currency: 'PLN',
    orderId: 99999,
    methodId: 1,
    statement: 'Payment statement',
    sign: 'valid_signature'
  }

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('successfully processes payment and adds credits', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.status).toBe('succeeded')
      expect(addCreditsFromPayment).toHaveBeenCalledWith(
        'user-1',
        10000,
        'payment-123'
      )
    })

    it('skips already processed payment (SUCCEEDED)', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'SUCCEEDED',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('already_processed')
      expect(addCreditsFromPayment).not.toHaveBeenCalled()
    })

    it('skips already processed payment (FAILED)', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        status: 'FAILED'
      } as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('already_processed')
      expect(verifyPrzelewy24Transaction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  describe('Signature Verification', () => {
    it('returns 401 when signature is invalid', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(false)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid signature')
    })

    it('verifies signature with correct data structure', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      await POST(createWebhookRequest(validWebhookData))

      expect(verifyPrzelewy24Signature).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: 12345,
          sessionId: 'session_abc123',
          amount: 10000,
          currency: 'PLN',
          orderId: 99999,
          sign: 'valid_signature'
        })
      )
    })
  })

  // ===========================================================================
  // TRANSACTION VERIFICATION
  // ===========================================================================

  describe('Transaction Verification', () => {
    it('marks payment as FAILED when transaction verification fails', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(false)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('failed')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          status: 'FAILED',
          metadata: expect.objectContaining({
            error: 'Transaction verification failed'
          })
        })
      })
    })

    it('verifies transaction with correct parameters', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      await POST(createWebhookRequest(validWebhookData))

      expect(verifyPrzelewy24Transaction).toHaveBeenCalledWith(
        'session_abc123',
        99999,
        10000,
        'PLN'
      )
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns 404 when payment not found', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Payment not found')
    })

    it('returns 500 on database error', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockRejectedValue(
        new Error('Database error')
      )

      const response = await POST(createWebhookRequest(validWebhookData))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ===========================================================================
  // METADATA STORAGE
  // ===========================================================================

  describe('Metadata Storage', () => {
    it('stores webhook data in payment metadata on success', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: { existingData: 'value' }
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          status: 'SUCCEEDED',
          metadata: expect.objectContaining({
            existingData: 'value',
            webhookData: expect.objectContaining({
              sessionId: 'session_abc123',
              orderId: 99999
            }),
            verifiedAt: expect.any(String)
          })
        })
      })
    })

    it('stores webhook data in metadata on failure', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(false)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            webhookData: expect.objectContaining({
              sessionId: 'session_abc123',
              orderId: 99999
            }),
            verifiedAt: expect.any(String)
          })
        })
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('uses sessionId to find payment', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          providerSessionId: 'session_abc123',
          provider: 'PRZELEWY24'
        }
      })
    })

    it('stores orderId as providerPaymentId on success', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          providerPaymentId: '99999'
        })
      })
    })

    it('preserves existing metadata when updating', async () => {
      vi.mocked(verifyPrzelewy24Signature).mockReturnValue(true)
      vi.mocked(verifyPrzelewy24Transaction).mockResolvedValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: { existingKey: 'existingValue' }
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            existingKey: 'existingValue',
            webhookData: expect.any(Object)
          })
        })
      })
    })
  })
})
