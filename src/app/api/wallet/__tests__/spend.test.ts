import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
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
import { spendCredits } from '@/lib/wallet/wallet-service'
import { getPrice } from '@/lib/wallet/pricing-service'
import { InsufficientCreditsError } from '@/lib/wallet/wallet-types'
import { POST } from '../spend/route'

describe('POST /api/wallet/spend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create request
  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/wallet/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  // Default mock for authenticated + successful spend
  function setupAuthenticatedUser(userId = 'user-1') {
    vi.mocked(auth).mockResolvedValue({
      user: { id: userId }
    } as never)
  }

  function setupDefaultSpend(cost = 100) {
    vi.mocked(getPrice).mockResolvedValue(cost)
    vi.mocked(spendCredits).mockResolvedValue({
      success: true,
      totalSpent: cost,
      transactionIds: ['tx-1'],
      batchesAffected: []
    } as never)
  }

  // ===========================================================================
  // AUTH
  // ===========================================================================

  describe('Auth', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as never)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' }
      } as never)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('processes request when authenticated', async () => {
      setupAuthenticatedUser()
      setupDefaultSpend(100)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('Validation', () => {
    it('returns 400 for missing action', async () => {
      setupAuthenticatedUser()

      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for invalid action (PUBLICATION is not spendable)', async () => {
      setupAuthenticatedUser()

      const request = createRequest({ action: 'PUBLICATION' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for completely invalid input', async () => {
      setupAuthenticatedUser()

      const request = createRequest({ action: 12345, shortId: true })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for unknown action string', async () => {
      setupAuthenticatedUser()

      const request = createRequest({ action: 'NONEXISTENT_ACTION' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('successfully spends credits for BOOST_STD', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(200)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 200,
        transactionIds: ['tx-boost-1'],
        batchesAffected: []
      } as never)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalSpent).toBe(200)
      expect(data.transactionIds).toEqual(['tx-boost-1'])
    })

    it('successfully spends credits for EXTENSION_30D', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(50)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 50,
        transactionIds: ['tx-ext-1'],
        batchesAffected: []
      } as never)

      const request = createRequest({ action: 'EXTENSION_30D' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalSpent).toBe(50)
      expect(data.transactionIds).toEqual(['tx-ext-1'])
    })

    it('successfully spends credits for SUPER_LIKE', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(10)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 10,
        transactionIds: ['tx-like-1'],
        batchesAffected: []
      } as never)

      const request = createRequest({ action: 'SUPER_LIKE' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalSpent).toBe(10)
      expect(data.transactionIds).toEqual(['tx-like-1'])
    })

    it('passes shortId to spendCredits when provided', async () => {
      setupAuthenticatedUser('user-42')
      setupDefaultSpend(100)

      const request = createRequest({
        action: 'BOOST_STD',
        shortId: 'short-abc-123'
      })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-42',
        100,
        'BOOST_STD',
        'short-abc-123'
      )
    })

    it('passes undefined shortId to spendCredits when not provided', async () => {
      setupAuthenticatedUser('user-42')
      setupDefaultSpend(100)

      const request = createRequest({ action: 'BOOST_STD' })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-42',
        100,
        'BOOST_STD',
        undefined
      )
    })

    it('maps EXTENSION_30D to EXTENSION action type', async () => {
      setupAuthenticatedUser('user-1')
      setupDefaultSpend(50)

      const request = createRequest({ action: 'EXTENSION_30D' })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        50,
        'EXTENSION',
        undefined
      )
    })

    it('maps EXTENSION_3M to EXTENSION action type', async () => {
      setupAuthenticatedUser('user-1')
      setupDefaultSpend(120)

      const request = createRequest({ action: 'EXTENSION_3M' })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        120,
        'EXTENSION',
        undefined
      )
    })

    it('maps BOOST_STD to BOOST_STD action type', async () => {
      setupAuthenticatedUser('user-1')
      setupDefaultSpend(200)

      const request = createRequest({ action: 'BOOST_STD' })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        200,
        'BOOST_STD',
        undefined
      )
    })

    it('maps SUPER_LIKE to SUPER_LIKE action type', async () => {
      setupAuthenticatedUser('user-1')
      setupDefaultSpend(10)

      const request = createRequest({ action: 'SUPER_LIKE' })

      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        10,
        'SUPER_LIKE',
        undefined
      )
    })

    it('returns multiple transactionIds when multiple batches affected', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(500)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 500,
        transactionIds: ['tx-1', 'tx-2', 'tx-3'],
        batchesAffected: []
      } as never)

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(data.transactionIds).toEqual(['tx-1', 'tx-2', 'tx-3'])
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('returns 402 when InsufficientCreditsError thrown', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(500)
      vi.mocked(spendCredits).mockRejectedValue(
        new InsufficientCreditsError(500, 100)
      )

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits')
      expect(data.required).toBe(500)
      expect(data.available).toBe(100)
    })

    it('returns 402 with zero available credits', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(200)
      vi.mocked(spendCredits).mockRejectedValue(
        new InsufficientCreditsError(200, 0)
      )

      const request = createRequest({ action: 'SUPER_LIKE' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.required).toBe(200)
      expect(data.available).toBe(0)
    })

    it('returns 500 on unexpected errors', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockResolvedValue(100)
      vi.mocked(spendCredits).mockRejectedValue(new Error('Database connection failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns 500 when getPrice throws', async () => {
      setupAuthenticatedUser()
      vi.mocked(getPrice).mockRejectedValue(new Error('Pricing service down'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = createRequest({ action: 'BOOST_STD' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })
  })

  // ===========================================================================
  // PRICING INTEGRATION
  // ===========================================================================

  describe('Pricing Integration', () => {
    it('calls getPrice with correct action key for BOOST_STD', async () => {
      setupAuthenticatedUser()
      setupDefaultSpend(200)

      const request = createRequest({ action: 'BOOST_STD' })
      await POST(request)

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('BOOST_STD')
    })

    it('calls getPrice with correct action key for EXTENSION_30D', async () => {
      setupAuthenticatedUser()
      setupDefaultSpend(50)

      const request = createRequest({ action: 'EXTENSION_30D' })
      await POST(request)

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_30D')
    })

    it('calls getPrice with correct action key for SUPER_LIKE', async () => {
      setupAuthenticatedUser()
      setupDefaultSpend(10)

      const request = createRequest({ action: 'SUPER_LIKE' })
      await POST(request)

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('SUPER_LIKE')
    })

    it('calls getPrice with correct action key for EXTENSION_6M', async () => {
      setupAuthenticatedUser()
      setupDefaultSpend(300)

      const request = createRequest({ action: 'EXTENSION_6M' })
      await POST(request)

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('EXTENSION_6M')
    })

    it('uses pricing cost in spendCredits call', async () => {
      setupAuthenticatedUser('user-pricing')
      vi.mocked(getPrice).mockResolvedValue(777)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 777,
        transactionIds: ['tx-pricing'],
        batchesAffected: []
      } as never)

      const request = createRequest({ action: 'EXTENSION_12M' })
      await POST(request)

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-pricing',
        777,
        'EXTENSION',
        undefined
      )
    })

    it('does not call spendCredits if validation fails', async () => {
      setupAuthenticatedUser()

      const request = createRequest({ action: 'INVALID_ACTION' })
      await POST(request)

      expect(vi.mocked(getPrice)).not.toHaveBeenCalled()
      expect(vi.mocked(spendCredits)).not.toHaveBeenCalled()
    })

    it('does not call getPrice if auth fails', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest({ action: 'BOOST_STD' })
      await POST(request)

      expect(vi.mocked(getPrice)).not.toHaveBeenCalled()
      expect(vi.mocked(spendCredits)).not.toHaveBeenCalled()
    })
  })
})
