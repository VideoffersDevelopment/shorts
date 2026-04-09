import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    short: { findFirst: vi.fn(), update: vi.fn() }
  }
}))

vi.mock('@/lib/wallet/wallet-service', () => ({
  spendCredits: vi.fn()
}))

vi.mock('@/lib/wallet/pricing-service', () => ({
  getPrice: vi.fn()
}))

vi.mock('@/lib/wallet/wallet-types', async () => {
  const actual = await vi.importActual('@/lib/wallet/wallet-types')
  return { ...actual }
})

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { spendCredits } from '@/lib/wallet/wallet-service'
import { getPrice } from '@/lib/wallet/pricing-service'
import { InsufficientCreditsError } from '@/lib/wallet/wallet-types'
import { POST } from '../route'

describe('POST /api/shorts/[id]/extend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create request
  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/shorts/short-1/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  function setupAuthenticatedUser(userId = 'user-1') {
    vi.mocked(auth).mockResolvedValue({
      user: { id: userId }
    } as never)
  }

  function setupShortFound(overrides: Record<string, unknown> = {}) {
    const defaultShort = {
      id: 'short-1',
      status: 'PUBLISHED',
      expiresAt: new Date('2025-06-01T00:00:00.000Z'),
      companyId: 'company-1'
    }
    vi.mocked(prisma.short.findFirst).mockResolvedValue({
      ...defaultShort,
      ...overrides
    } as never)
  }

  function setupDefaultSpend(cost = 500) {
    vi.mocked(getPrice).mockResolvedValue(cost)
    vi.mocked(spendCredits).mockResolvedValue({
      success: true,
      totalSpent: cost,
      transactionIds: ['tx-1'],
      batchesAffected: []
    } as never)
    vi.mocked(prisma.short.update).mockResolvedValue({} as never)
  }

  function callPOST(body: unknown, shortId = 'short-1') {
    const request = createRequest(body)
    return POST(request, { params: Promise.resolve({ id: shortId }) })
  }

  // ===========================================================================
  // AUTH
  // ===========================================================================

  describe('Auth', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as never)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('processes request when authenticated', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('Validation', () => {
    it('returns 400 for missing period', async () => {
      setupAuthenticatedUser()

      const response = await callPOST({})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for invalid period value', async () => {
      setupAuthenticatedUser()

      const response = await callPOST({ period: '7D' })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for completely invalid input', async () => {
      setupAuthenticatedUser()

      const response = await callPOST({ period: 12345 })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  // ===========================================================================
  // OWNERSHIP
  // ===========================================================================

  describe('Ownership', () => {
    it('returns 404 when short not found', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Short not found')
    })

    it('returns 404 when short belongs to different user (ownership check via company.userId)', async () => {
      setupAuthenticatedUser('user-1')
      // findFirst with company.userId filter returns null for non-owner
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Short not found')
      expect(vi.mocked(prisma.short.findFirst)).toHaveBeenCalledWith({
        where: {
          id: 'short-1',
          company: { userId: 'user-1' }
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          companyId: true
        }
      })
    })
  })

  // ===========================================================================
  // STATUS VALIDATION
  // ===========================================================================

  describe('Status Validation', () => {
    it('returns 400 for DRAFT shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'DRAFT' })

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only PUBLISHED or EXPIRED shorts can be extended')
    })

    it('returns 400 for ARCHIVED shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'ARCHIVED' })

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only PUBLISHED or EXPIRED shorts can be extended')
    })

    it('allows PUBLISHED shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'PUBLISHED' })
      setupDefaultSpend(500)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('allows EXPIRED shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'EXPIRED', expiresAt: new Date('2024-01-01T00:00:00.000Z') })
      setupDefaultSpend(500)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // ===========================================================================
  // HAPPY PATH - PUBLISHED
  // ===========================================================================

  describe('Happy Path - PUBLISHED', () => {
    it('extends from current expiresAt for PUBLISHED short', async () => {
      const currentExpiry = new Date('2025-06-01T00:00:00.000Z')
      setupAuthenticatedUser()
      setupShortFound({ status: 'PUBLISHED', expiresAt: currentExpiry })
      setupDefaultSpend(500)

      await callPOST({ period: '30D' })

      const expectedExpiry = new Date(currentExpiry)
      expectedExpiry.setDate(expectedExpiry.getDate() + 30)

      expect(vi.mocked(prisma.short.update)).toHaveBeenCalledWith({
        where: { id: 'short-1' },
        data: {
          expiresAt: expectedExpiry,
          status: 'PUBLISHED'
        }
      })
    })

    it('uses correct pricing key for 30D period', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      await callPOST({ period: '30D' })

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_30D')
    })

    it('returns new expiresAt and period in response', async () => {
      const currentExpiry = new Date('2025-06-01T00:00:00.000Z')
      setupAuthenticatedUser()
      setupShortFound({ status: 'PUBLISHED', expiresAt: currentExpiry })
      setupDefaultSpend(500)

      const response = await callPOST({ period: '3M' })
      const data = await response.json()

      const expectedExpiry = new Date(currentExpiry)
      expectedExpiry.setDate(expectedExpiry.getDate() + 90)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.expiresAt).toBe(expectedExpiry.toISOString())
      expect(data.period).toBe('3M')
    })
  })

  // ===========================================================================
  // HAPPY PATH - EXPIRED
  // ===========================================================================

  describe('Happy Path - EXPIRED', () => {
    it('extends from NOW for EXPIRED short', async () => {
      const now = new Date('2025-03-18T12:00:00.000Z')
      vi.useFakeTimers({ now })

      setupAuthenticatedUser()
      setupShortFound({ status: 'EXPIRED', expiresAt: new Date('2024-12-01T00:00:00.000Z') })
      setupDefaultSpend(500)

      await callPOST({ period: '30D' })

      const expectedExpiry = new Date(now)
      expectedExpiry.setDate(expectedExpiry.getDate() + 30)

      expect(vi.mocked(prisma.short.update)).toHaveBeenCalledWith({
        where: { id: 'short-1' },
        data: {
          expiresAt: expectedExpiry,
          status: 'PUBLISHED'
        }
      })

      vi.useRealTimers()
    })

    it('sets status back to PUBLISHED', async () => {
      vi.useFakeTimers({ now: new Date('2025-03-18T12:00:00.000Z') })

      setupAuthenticatedUser()
      setupShortFound({ status: 'EXPIRED', expiresAt: new Date('2024-12-01T00:00:00.000Z') })
      setupDefaultSpend(500)

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(vi.mocked(prisma.short.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED'
          })
        })
      )

      vi.useRealTimers()
    })

    it('correctly calculates new expiry for each period (3M = +90 days)', async () => {
      const now = new Date('2025-03-18T12:00:00.000Z')
      vi.useFakeTimers({ now })

      setupAuthenticatedUser()
      setupShortFound({ status: 'EXPIRED', expiresAt: new Date('2024-12-01T00:00:00.000Z') })
      setupDefaultSpend(500)

      const response = await callPOST({ period: '3M' })
      const data = await response.json()

      const expectedExpiry = new Date(now)
      expectedExpiry.setDate(expectedExpiry.getDate() + 90)

      expect(data.expiresAt).toBe(expectedExpiry.toISOString())

      vi.useRealTimers()
    })
  })

  // ===========================================================================
  // PRICING
  // ===========================================================================

  describe('Pricing', () => {
    it('calls getPrice with EXTENSION_30D for 30D period', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      await callPOST({ period: '30D' })

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_30D')
    })

    it('calls getPrice with EXTENSION_3M for 3M period', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      await callPOST({ period: '3M' })

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_3M')
    })

    it('calls getPrice with EXTENSION_6M for 6M period', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      await callPOST({ period: '6M' })

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_6M')
    })

    it('calls getPrice with EXTENSION_12M for 12M period', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupDefaultSpend(500)

      await callPOST({ period: '12M' })

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_12M')
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('returns 402 with details when InsufficientCreditsError thrown', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(getPrice).mockResolvedValue(500)
      vi.mocked(spendCredits).mockRejectedValue(
        new InsufficientCreditsError(500, 100)
      )

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits')
      expect(data.required).toBe(500)
      expect(data.available).toBe(100)
    })

    it('returns 500 on unexpected errors', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(getPrice).mockResolvedValue(500)
      vi.mocked(spendCredits).mockRejectedValue(new Error('Database connection failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callPOST({ period: '30D' })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
