import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findUnique: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET } from '../status/[id]/route'

describe('GET /api/payments/status/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create request with params
  function createRequest(paymentId: string): Request {
    return new Request(`http://localhost:3000/api/payments/status/${paymentId}`, {
      method: 'GET'
    })
  }

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('returns payment status for PENDING payment', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'PENDING',
        creditsGranted: 5,
        metadata: null
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('PENDING')
      expect(data.credits).toBeUndefined() // Only on SUCCEEDED
    })

    it('returns credits when payment SUCCEEDED', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'SUCCEEDED',
        creditsGranted: 10,
        metadata: null
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('SUCCEEDED')
      expect(data.credits).toBe(10)
    })

    it('returns short info when payment linked to short', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'SUCCEEDED',
        creditsGranted: 1,
        metadata: {
          shortId: 'short-1',
          shortStatus: 'PROCESSING'
        }
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shortId).toBe('short-1')
      expect(data.shortStatus).toBe('PROCESSING')
    })

    it('returns error message when payment FAILED', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'FAILED',
        creditsGranted: 5,
        metadata: { error: 'Payment was cancelled' }
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('FAILED')
      expect(data.error).toBe('Payment was cancelled')
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )

      expect(response.status).toBe(401)
    })

    it('returns 401 when user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' } // No id
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )

      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe('Authorization Failures', () => {
    it('returns 403 when payment belongs to different user', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-2', // Different user!
        status: 'SUCCEEDED',
        creditsGranted: 5,
        metadata: null
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe('Database Errors', () => {
    it('returns 404 when payment not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null)

      const response = await GET(
        createRequest('nonexistent-payment'),
        { params: Promise.resolve({ id: 'nonexistent-payment' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Payment not found')
    })

    it('returns 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      )

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('returns default error message when FAILED without metadata', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'FAILED',
        creditsGranted: 5,
        metadata: null // No metadata
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(data.error).toBe('Payment failed')
    })

    it('handles payment with short but null short relation', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'SUCCEEDED',
        creditsGranted: 1,
        metadata: {
          shortId: 'short-1'
          // No shortStatus in metadata
        }
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shortId).toBe('short-1')
      expect(data.shortStatus).toBeUndefined()
    })

    it('handles metadata with empty error field', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        status: 'FAILED',
        creditsGranted: 5,
        metadata: { error: '' } // Empty error
      } as never)

      const response = await GET(
        createRequest('payment-123'),
        { params: Promise.resolve({ id: 'payment-123' }) }
      )
      const data = await response.json()

      // Empty string is falsy, should fallback
      expect(data.error).toBe('Payment failed')
    })

    it('handles all payment statuses', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      const statuses = ['PENDING', 'SUCCEEDED', 'FAILED']

      for (const status of statuses) {
        vi.mocked(prisma.payment.findUnique).mockResolvedValue({
          id: 'payment-123',
          userId: 'user-1',
          status,
          creditsGranted: 5,
          metadata: status === 'FAILED' ? { error: 'Test error' } : null
        } as never)

        const response = await GET(
          createRequest('payment-123'),
          { params: Promise.resolve({ id: 'payment-123' }) }
        )
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe(status)
      }
    })
  })
})
