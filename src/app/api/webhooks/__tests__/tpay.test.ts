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

vi.mock('@/lib/payments/tpay', () => ({
  verifyTpaySignature: vi.fn(),
  parseTpayStatus: vi.fn()
}))

vi.mock('@/lib/publication/publication-controller', () => ({
  addCreditsFromPayment: vi.fn()
}))

import { prisma } from '@/lib/prisma'
import { verifyTpaySignature, parseTpayStatus } from '@/lib/payments/tpay'
import { addCreditsFromPayment } from '@/lib/publication/publication-controller'
import { POST } from '../tpay/route'

describe('POST /api/webhooks/tpay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create URL-encoded form request with proper Content-Type header
  function createWebhookRequest(data: Record<string, string>): Request {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, value)
    })

    return new Request('http://localhost:3000/api/webhooks/tpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
  }

  const validWebhookData = {
    id: 'merchant123',
    tr_id: 'tr_99999',
    tr_date: '2025-01-01 12:00:00',
    tr_crc: 'session_abc123', // This is our sessionId
    tr_amount: '100.00',
    tr_paid: '100.00',
    tr_desc: '10000 points - VideoShorts',
    tr_status: 'TRUE',
    tr_error: '',
    tr_email: 'test@example.com',
    md5sum: 'valid_signature'
  }

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('successfully processes payment and returns TRUE', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('SUCCEEDED')

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
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toBe('TRUE')
      expect(addCreditsFromPayment).toHaveBeenCalledWith(
        'user-1',
        10000,
        'payment-123'
      )
    })

    it('skips already processed payment and returns TRUE', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        status: 'SUCCEEDED' // Already processed
      } as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toBe('TRUE')
      expect(addCreditsFromPayment).not.toHaveBeenCalled()
    })

    it('handles PENDING status by returning TRUE without processing', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('PENDING')

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toBe('TRUE')
      expect(addCreditsFromPayment).not.toHaveBeenCalled()
      expect(prisma.payment.update).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  describe('Signature Verification', () => {
    it('returns FALSE with 401 when signature is invalid', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(false)

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(response.status).toBe(401)
      expect(text).toBe('FALSE')
    })

    it('verifies signature with correct data structure', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      await POST(createWebhookRequest(validWebhookData))

      expect(verifyTpaySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'merchant123',
          tr_id: 'tr_99999',
          tr_crc: 'session_abc123',
          tr_amount: '100.00',
          tr_status: 'TRUE',
          md5sum: 'valid_signature'
        })
      )
    })
  })

  // ===========================================================================
  // FAILED STATUS HANDLING
  // ===========================================================================

  describe('Failed Status Handling', () => {
    it('marks payment as FAILED when status is FAILED', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('FAILED')

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      const response = await POST(createWebhookRequest({
        ...validWebhookData,
        tr_status: 'FALSE',
        tr_error: 'Payment cancelled by user'
      }))
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toBe('TRUE')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          status: 'FAILED'
        })
      })
    })

    it('stores error message in metadata', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('FAILED')

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      await POST(createWebhookRequest({
        ...validWebhookData,
        tr_status: 'FALSE',
        tr_error: 'Insufficient funds'
      }))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            error: 'Insufficient funds'
          })
        })
      })
    })

    it('uses default error message when tr_error is empty', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('FAILED')

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      await POST(createWebhookRequest({
        ...validWebhookData,
        tr_status: 'FALSE',
        tr_error: ''
      }))

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            error: 'Payment failed'
          })
        })
      })
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns FALSE with 404 when payment not found', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(response.status).toBe(404)
      expect(text).toBe('FALSE')
    })

    it('returns FALSE with 500 on database error', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockRejectedValue(
        new Error('Database error')
      )

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(response.status).toBe(500)
      expect(text).toBe('FALSE')
    })
  })

  // ===========================================================================
  // METADATA STORAGE
  // ===========================================================================

  describe('Metadata Storage', () => {
    it('stores webhook data in metadata on success', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('SUCCEEDED')

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
          metadata: expect.objectContaining({
            webhookData: expect.objectContaining({
              tr_id: 'tr_99999',
              tr_crc: 'session_abc123',
              tr_amount: '100.00'
            }),
            processedAt: expect.any(String)
          })
        })
      })
    })

    it('handles test_mode in webhook data', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('SUCCEEDED')

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 10000,
        metadata: {}
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(addCreditsFromPayment).mockResolvedValue(undefined)

      const response = await POST(createWebhookRequest({
        ...validWebhookData,
        test_mode: '1'
      }))

      expect(response.status).toBe(200)
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            webhookData: expect.objectContaining({
              test_mode: '1'
            })
          })
        })
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('skips FAILED payment as already processed', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'payment-123',
        status: 'FAILED'
      } as never)

      const response = await POST(createWebhookRequest(validWebhookData))
      const text = await response.text()

      expect(text).toBe('TRUE')
      expect(prisma.payment.update).not.toHaveBeenCalled()
    })

    it('uses tr_crc (sessionId) to find payment', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      await POST(createWebhookRequest(validWebhookData))

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          providerSessionId: 'session_abc123',
          provider: 'TPAY'
        }
      })
    })

    it('stores provider payment ID (tr_id) on success', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('SUCCEEDED')

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
          providerPaymentId: 'tr_99999'
        })
      })
    })

    it('preserves existing metadata when updating', async () => {
      vi.mocked(verifyTpaySignature).mockReturnValue(true)
      vi.mocked(parseTpayStatus).mockReturnValue('SUCCEEDED')

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
          metadata: expect.objectContaining({
            existingData: 'value',
            webhookData: expect.any(Object)
          })
        })
      })
    })
  })
})
