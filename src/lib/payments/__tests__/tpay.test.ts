import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import type { CheckoutOptions } from '../index'
import type { TpayWebhookData } from '../tpay'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Store original env values
const originalEnv = { ...process.env }

describe('Tpay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up test environment variables
    process.env.TPAY_MERCHANT_ID = 'merchant123'
    process.env.TPAY_SECURITY_CODE = 'security_code_123'
    process.env.TPAY_API_KEY = 'api_key_123'
    process.env.NODE_ENV = 'test' // Sandbox mode
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  // ===========================================================================
  // createTpayCheckout
  // ===========================================================================

  describe('createTpayCheckout', () => {
    const validCheckoutOptions: CheckoutOptions = {
      sessionId: 'session_abc123',
      amount: 500, // 5.00 PLN in grosze
      currency: 'PLN',
      description: '1 credit - VideoShorts',
      email: 'test@example.com',
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/webhook'
    }

    it('creates checkout session with valid options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://secure.sandbox.tpay.com/checkout/abc123' })
      })

      const { createTpayCheckout } = await import('../tpay')
      const result = await createTpayCheckout(validCheckoutOptions)

      expect(result).toBe('https://secure.sandbox.tpay.com/checkout/abc123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('sends form-urlencoded request to Tpay API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout(validCheckoutOptions)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('secure.sandbox.tpay.com/api/gw/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          body: expect.any(String)
        })
      )
    })

    it('converts amount from grosze to PLN', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout(validCheckoutOptions)

      const body = mockFetch.mock.calls[0][1].body as string
      expect(body).toContain('amount=5.00')
    })

    it('uses sessionId as crc parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout(validCheckoutOptions)

      const body = mockFetch.mock.calls[0][1].body as string
      expect(body).toContain(`crc=${validCheckoutOptions.sessionId}`)
    })

    it('includes email in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout(validCheckoutOptions)

      const body = mockFetch.mock.calls[0][1].body as string
      expect(body).toContain('email=test%40example.com')
    })

    it('throws error when API returns result !== 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 0, err: 'Invalid amount' })
      })

      const { createTpayCheckout } = await import('../tpay')

      await expect(createTpayCheckout(validCheckoutOptions))
        .rejects
        .toThrow('Tpay registration failed: Invalid amount')
    })

    it('throws error when API returns no URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1 }) // Missing url
      })

      const { createTpayCheckout } = await import('../tpay')

      await expect(createTpayCheckout(validCheckoutOptions))
        .rejects
        .toThrow('Tpay registration failed')
    })

    it('throws error when HTTP request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error'
      })

      const { createTpayCheckout } = await import('../tpay')

      await expect(createTpayCheckout(validCheckoutOptions))
        .rejects
        .toThrow('Tpay registration failed: 500')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const { createTpayCheckout } = await import('../tpay')

      await expect(createTpayCheckout(validCheckoutOptions))
        .rejects
        .toThrow('Network timeout')
    })
  })

  // ===========================================================================
  // verifyTpaySignature
  // ===========================================================================

  describe('verifyTpaySignature', () => {
    it('returns true for valid MD5 signature', async () => {
      const { verifyTpaySignature } = await import('../tpay')

      // Generate expected MD5 signature
      // Format: merchantId + tr_id + tr_amount + tr_crc + securityCode
      const signString = 'merchant123tr_999995.00session_abc123security_code_123'
      const expectedMd5 = crypto.createHash('md5').update(signString).digest('hex')

      const webhookData = {
        id: 'merchant123',
        tr_id: 'tr_99999',
        tr_date: '2025-01-01 12:00:00',
        tr_crc: 'session_abc123',
        tr_amount: '5.00',
        tr_paid: '5.00',
        tr_desc: '1 credit - VideoShorts',
        tr_status: 'TRUE',
        tr_error: '',
        tr_email: 'test@example.com',
        md5sum: expectedMd5
      }

      const result = verifyTpaySignature(webhookData)
      expect(result).toBe(true)
    })

    it('returns false for invalid signature', async () => {
      const { verifyTpaySignature } = await import('../tpay')

      const webhookData = {
        id: 'merchant123',
        tr_id: 'tr_99999',
        tr_date: '2025-01-01 12:00:00',
        tr_crc: 'session_abc123',
        tr_amount: '5.00',
        tr_paid: '5.00',
        tr_desc: '1 credit',
        tr_status: 'TRUE',
        tr_error: '',
        tr_email: 'test@example.com',
        md5sum: 'invalid_signature'
      }

      const result = verifyTpaySignature(webhookData)
      expect(result).toBe(false)
    })

    it('returns false when amount is tampered', async () => {
      const { verifyTpaySignature } = await import('../tpay')

      // Generate signature for 5.00 PLN
      const signString = 'merchant123tr_999995.00session_abc123security_code_123'
      const md5 = crypto.createHash('md5').update(signString).digest('hex')

      // But send different amount
      const webhookData = {
        id: 'merchant123',
        tr_id: 'tr_99999',
        tr_date: '2025-01-01 12:00:00',
        tr_crc: 'session_abc123',
        tr_amount: '1.00', // Tampered!
        tr_paid: '1.00',
        tr_desc: '1 credit',
        tr_status: 'TRUE',
        tr_error: '',
        tr_email: 'test@example.com',
        md5sum: md5
      }

      const result = verifyTpaySignature(webhookData)
      expect(result).toBe(false)
    })

    it('returns false when crc (sessionId) is tampered', async () => {
      const { verifyTpaySignature } = await import('../tpay')

      const signString = 'merchant123tr_999995.00session_abc123security_code_123'
      const md5 = crypto.createHash('md5').update(signString).digest('hex')

      const webhookData = {
        id: 'merchant123',
        tr_id: 'tr_99999',
        tr_date: '2025-01-01 12:00:00',
        tr_crc: 'different_session', // Tampered!
        tr_amount: '5.00',
        tr_paid: '5.00',
        tr_desc: '1 credit',
        tr_status: 'TRUE',
        tr_error: '',
        tr_email: 'test@example.com',
        md5sum: md5
      }

      const result = verifyTpaySignature(webhookData)
      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // parseTpayStatus
  // ===========================================================================

  describe('parseTpayStatus', () => {
    it('returns SUCCEEDED for TRUE status', async () => {
      const { parseTpayStatus } = await import('../tpay')
      expect(parseTpayStatus('TRUE')).toBe('SUCCEEDED')
    })

    it('returns SUCCEEDED for PAID status', async () => {
      const { parseTpayStatus } = await import('../tpay')
      expect(parseTpayStatus('PAID')).toBe('SUCCEEDED')
    })

    it('returns FAILED for FALSE status', async () => {
      const { parseTpayStatus } = await import('../tpay')
      expect(parseTpayStatus('FALSE')).toBe('FAILED')
    })

    it('returns FAILED for ERROR status', async () => {
      const { parseTpayStatus } = await import('../tpay')
      expect(parseTpayStatus('ERROR')).toBe('FAILED')
    })

    it('returns PENDING for unknown status', async () => {
      const { parseTpayStatus } = await import('../tpay')
      expect(parseTpayStatus('PENDING')).toBe('PENDING')
      expect(parseTpayStatus('PROCESSING')).toBe('PENDING')
      expect(parseTpayStatus('')).toBe('PENDING')
      expect(parseTpayStatus('UNKNOWN')).toBe('PENDING')
    })
  })

  // ===========================================================================
  // SIGNATURE GENERATION
  // ===========================================================================

  describe('MD5 Signature Generation', () => {
    it('generates 32-character MD5 hash for checkout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout({
        sessionId: 'test',
        amount: 100,
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      const body = mockFetch.mock.calls[0][1].body as string
      const md5sumMatch = body.match(/md5sum=([a-f0-9]+)/)
      expect(md5sumMatch).toBeTruthy()
      expect(md5sumMatch![1]).toHaveLength(32)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles fractional amounts correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout({
        sessionId: 'test',
        amount: 199, // 1.99 PLN
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      const body = mockFetch.mock.calls[0][1].body as string
      expect(body).toContain('amount=1.99')
    })

    it('handles special characters in email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      await createTpayCheckout({
        sessionId: 'test',
        amount: 500,
        currency: 'PLN',
        description: 'Test',
        email: 'test+special@example.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      // URL encoded + should be %2B
      const body = mockFetch.mock.calls[0][1].body as string
      expect(body).toContain('email=test%2Bspecial%40example.com')
    })

    it('uses sandbox URL in non-production mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1, url: 'https://sandbox.tpay.com/checkout' })
      })

      const { createTpayCheckout } = await import('../tpay')
      const result = await createTpayCheckout({
        sessionId: 'test',
        amount: 500,
        currency: 'PLN',
        description: 'Test',
        email: 'test@test.com',
        returnUrl: 'https://test.com',
        notifyUrl: 'https://test.com/notify'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sandbox.tpay.com'),
        expect.any(Object)
      )
    })

    it('handles test_mode in webhook data', async () => {
      const { verifyTpaySignature } = await import('../tpay')

      const signString = 'merchant123tr_999995.00session_abc123security_code_123'
      const md5 = crypto.createHash('md5').update(signString).digest('hex')

      const webhookData = {
        id: 'merchant123',
        tr_id: 'tr_99999',
        tr_date: '2025-01-01 12:00:00',
        tr_crc: 'session_abc123',
        tr_amount: '5.00',
        tr_paid: '5.00',
        tr_desc: '1 credit',
        tr_status: 'TRUE',
        tr_error: '',
        tr_email: 'test@example.com',
        md5sum: md5,
        test_mode: '1' // Test mode enabled
      }

      const result = verifyTpaySignature(webhookData)
      expect(result).toBe(true)
    })
  })
})
