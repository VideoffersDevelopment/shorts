import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import type { CheckoutOptions } from '../index'
import type { Przelewy24WebhookData } from '../przelewy24'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Store original env values
const originalEnv = { ...process.env }

describe('Przelewy24 Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up test environment variables
    process.env.PRZELEWY24_MERCHANT_ID = '12345'
    process.env.PRZELEWY24_CRC = 'test_crc_key'
    process.env.PRZELEWY24_API_KEY = 'test_api_key'
    process.env.NODE_ENV = 'test' // Sandbox mode
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  // ===========================================================================
  // createPrzelewy24Checkout
  // ===========================================================================

  describe('createPrzelewy24Checkout', () => {
    const validCheckoutOptions: CheckoutOptions = {
      sessionId: 'session_abc123',
      amount: 500, // 5.00 PLN
      currency: 'PLN',
      description: '1 credit - VideoShorts',
      email: 'test@example.com',
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/webhook'
    }

    it('creates checkout session with valid options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'test_token_123' } })
      })

      // Need to re-import after setting env vars
      const { createPrzelewy24Checkout } = await import('../przelewy24')
      const result = await createPrzelewy24Checkout(validCheckoutOptions)

      expect(result).toBe('https://sandbox.przelewy24.pl/trnRequest/test_token_123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('sends correct request body to P24 API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token123' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      await createPrzelewy24Checkout(validCheckoutOptions)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sandbox.przelewy24.pl/api/v1/transaction/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      )

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body as string)

      expect(body).toMatchObject({
        merchantId: 12345,
        posId: 12345,
        sessionId: 'session_abc123',
        amount: 500,
        currency: 'PLN',
        email: 'test@example.com',
        country: 'PL',
        language: 'pl'
      })
    })

    it('includes Basic auth header with correct credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token123' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      await createPrzelewy24Checkout(validCheckoutOptions)

      const callArgs = mockFetch.mock.calls[0]
      const authHeader = callArgs[1].headers.Authorization

      // Base64 of "12345:test_api_key"
      const expectedAuth = `Basic ${Buffer.from('12345:test_api_key').toString('base64')}`
      expect(authHeader).toBe(expectedAuth)
    })

    it('throws error when API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')

      await expect(createPrzelewy24Checkout(validCheckoutOptions))
        .rejects
        .toThrow('Przelewy24 registration failed: 400')
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { createPrzelewy24Checkout } = await import('../przelewy24')

      await expect(createPrzelewy24Checkout(validCheckoutOptions))
        .rejects
        .toThrow('Network error')
    })
  })

  // ===========================================================================
  // verifyPrzelewy24Signature
  // ===========================================================================

  describe('verifyPrzelewy24Signature', () => {
    it('returns true for valid signature', async () => {
      const { verifyPrzelewy24Signature } = await import('../przelewy24')

      // Generate expected signature manually
      const signData = {
        sessionId: 'session123',
        orderId: 99999,
        amount: 500,
        currency: 'PLN',
        crc: 'test_crc_key'
      }
      const expectedSign = crypto.createHash('sha384').update(JSON.stringify(signData)).digest('hex')

      const webhookData = {
        merchantId: 12345,
        posId: 12345,
        sessionId: 'session123',
        amount: 500,
        originAmount: 500,
        currency: 'PLN',
        orderId: 99999,
        methodId: 1,
        statement: 'Test statement',
        sign: expectedSign
      }

      const result = verifyPrzelewy24Signature(webhookData)
      expect(result).toBe(true)
    })

    it('returns false for invalid signature', async () => {
      const { verifyPrzelewy24Signature } = await import('../przelewy24')

      const webhookData = {
        merchantId: 12345,
        posId: 12345,
        sessionId: 'session123',
        amount: 500,
        originAmount: 500,
        currency: 'PLN',
        orderId: 99999,
        methodId: 1,
        statement: 'Test statement',
        sign: 'invalid_signature_here'
      }

      const result = verifyPrzelewy24Signature(webhookData)
      expect(result).toBe(false)
    })

    it('returns false when amount is tampered', async () => {
      const { verifyPrzelewy24Signature } = await import('../przelewy24')

      // Generate signature for original amount
      const signData = {
        sessionId: 'session123',
        orderId: 99999,
        amount: 500,
        currency: 'PLN',
        crc: 'test_crc_key'
      }
      const sign = crypto.createHash('sha384').update(JSON.stringify(signData)).digest('hex')

      // But send different amount in webhook
      const webhookData = {
        merchantId: 12345,
        posId: 12345,
        sessionId: 'session123',
        amount: 100, // Tampered!
        originAmount: 500,
        currency: 'PLN',
        orderId: 99999,
        methodId: 1,
        statement: 'Test statement',
        sign
      }

      const result = verifyPrzelewy24Signature(webhookData)
      expect(result).toBe(false)
    })

    it('returns false when session is tampered', async () => {
      const { verifyPrzelewy24Signature } = await import('../przelewy24')

      const signData = {
        sessionId: 'session123',
        orderId: 99999,
        amount: 500,
        currency: 'PLN',
        crc: 'test_crc_key'
      }
      const sign = crypto.createHash('sha384').update(JSON.stringify(signData)).digest('hex')

      const webhookData = {
        merchantId: 12345,
        posId: 12345,
        sessionId: 'different_session', // Tampered!
        amount: 500,
        originAmount: 500,
        currency: 'PLN',
        orderId: 99999,
        methodId: 1,
        statement: 'Test statement',
        sign
      }

      const result = verifyPrzelewy24Signature(webhookData)
      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // verifyPrzelewy24Transaction
  // ===========================================================================

  describe('verifyPrzelewy24Transaction', () => {
    it('returns true when verification succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'success' } })
      })

      const { verifyPrzelewy24Transaction } = await import('../przelewy24')
      const result = await verifyPrzelewy24Transaction('session123', 99999, 500, 'PLN')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sandbox.przelewy24.pl/api/v1/transaction/verify',
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })

    it('returns false when verification fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'error' } })
      })

      const { verifyPrzelewy24Transaction } = await import('../przelewy24')
      const result = await verifyPrzelewy24Transaction('session123', 99999, 500, 'PLN')

      expect(result).toBe(false)
    })

    it('returns false when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Verification failed'
      })

      const { verifyPrzelewy24Transaction } = await import('../przelewy24')
      const result = await verifyPrzelewy24Transaction('session123', 99999, 500, 'PLN')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { verifyPrzelewy24Transaction } = await import('../przelewy24')
      const result = await verifyPrzelewy24Transaction('session123', 99999, 500, 'PLN')

      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // SIGNATURE GENERATION
  // ===========================================================================

  describe('Signature Generation', () => {
    it('uses SHA384 for signature generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      await createPrzelewy24Checkout({
        sessionId: 'test',
        amount: 100,
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      // SHA384 produces 96 hex characters
      expect(body.sign).toHaveLength(96)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty string sessionId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      await createPrzelewy24Checkout({
        sessionId: '',
        amount: 500,
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.sessionId).toBe('')
    })

    it('handles special characters in description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      await createPrzelewy24Checkout({
        sessionId: 'test',
        amount: 500,
        currency: 'PLN',
        description: 'Test with "quotes" & <special> chars',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.description).toBe('Test with "quotes" & <special> chars')
    })

    it('uses sandbox URL in non-production mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token' } })
      })

      const { createPrzelewy24Checkout } = await import('../przelewy24')
      const result = await createPrzelewy24Checkout({
        sessionId: 'test',
        amount: 500,
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      expect(result).toContain('sandbox.przelewy24.pl')
    })
  })
})
