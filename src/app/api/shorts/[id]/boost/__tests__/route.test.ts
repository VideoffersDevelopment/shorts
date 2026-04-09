import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    short: { findFirst: vi.fn() },
    shortBoost: { findFirst: vi.fn(), create: vi.fn() }
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

// ===========================================================================
// HELPERS
// ===========================================================================

function createRequest(): Request {
  return new Request('http://localhost:3000/api/shorts/short-1/boost', {
    method: 'POST'
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
    companyId: 'company-1'
  }
  vi.mocked(prisma.short.findFirst).mockResolvedValue({
    ...defaultShort,
    ...overrides
  } as never)
}

function setupNoActiveBoost() {
  vi.mocked(prisma.shortBoost.findFirst).mockResolvedValue(null)
}

function setupDefaultBoostCreate(boostId = 'boost-1') {
  vi.mocked(prisma.shortBoost.create).mockResolvedValue({
    id: boostId
  } as never)
}

function setupDefaultPricing(cost = 1000) {
  vi.mocked(getPrice).mockResolvedValue(cost)
  vi.mocked(spendCredits).mockResolvedValue({
    success: true,
    totalSpent: cost,
    transactionIds: ['tx-1'],
    batchesAffected: []
  } as never)
}

function setupFullHappyPath(options: { cost?: number; boostId?: string } = {}) {
  const cost = options.cost ?? 1000
  const boostId = options.boostId ?? 'boost-1'
  setupAuthenticatedUser()
  setupShortFound()
  setupNoActiveBoost()
  setupDefaultPricing(cost)
  setupDefaultBoostCreate(boostId)
}

function callPOST(shortId = 'short-1') {
  const request = createRequest()
  return POST(request, { params: Promise.resolve({ id: shortId }) })
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('POST /api/shorts/[id]/boost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // AUTH
  // =========================================================================

  describe('Auth', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as never)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  // =========================================================================
  // OWNERSHIP
  // =========================================================================

  describe('Ownership', () => {
    it('returns 404 when short not found', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Short not found')
    })

    it('returns 404 when short belongs to different user (ownership via company.userId)', async () => {
      setupAuthenticatedUser('user-1')
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST()
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
          companyId: true
        }
      })
    })
  })

  // =========================================================================
  // STATUS VALIDATION
  // =========================================================================

  describe('Status Validation', () => {
    it('returns 400 for DRAFT shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'DRAFT' })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only PUBLISHED shorts can be boosted')
    })

    it('returns 400 for EXPIRED shorts', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'EXPIRED' })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only PUBLISHED shorts can be boosted')
    })

    it('allows PUBLISHED shorts to be boosted', async () => {
      setupFullHappyPath()

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // =========================================================================
  // DUPLICATE BOOST
  // =========================================================================

  describe('Duplicate Boost', () => {
    it('returns 409 when short already has an active boost', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(prisma.shortBoost.findFirst).mockResolvedValue({
        id: 'existing-boost',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      } as never)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Short already has an active boost')
    })

    it('allows boosting when no active boost exists', async () => {
      setupFullHappyPath()

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe('Happy Path', () => {
    it('creates ShortBoost with correct data (type STANDARD, status ACTIVE)', async () => {
      setupFullHappyPath({ cost: 1500 })

      await callPOST()

      expect(vi.mocked(prisma.shortBoost.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shortId: 'short-1',
          userId: 'user-1',
          type: 'STANDARD',
          cost: 1500,
          status: 'ACTIVE',
          startedAt: expect.any(Date),
          expiresAt: expect.any(Date)
        })
      })
    })

    it('calls spendCredits with BOOST_STD action type', async () => {
      setupFullHappyPath({ cost: 1000 })

      await callPOST()

      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        1000,
        'BOOST_STD',
        'short-1'
      )
    })

    it('returns boostId, expiresAt, and cost in response', async () => {
      setupFullHappyPath({ cost: 1000, boostId: 'boost-abc' })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.boostId).toBe('boost-abc')
      expect(data.expiresAt).toBeDefined()
      expect(data.cost).toBe(1000)
    })

    it('sets expiresAt to approximately 24 hours from now', async () => {
      setupFullHappyPath()

      const before = Date.now()
      const response = await callPOST()
      const after = Date.now()
      const data = await response.json()

      const expiresAt = new Date(data.expiresAt).getTime()
      const twentyFourHoursMs = 24 * 60 * 60 * 1000

      // expiresAt should be ~24 hours from now (within 5 second tolerance)
      expect(expiresAt).toBeGreaterThanOrEqual(before + twentyFourHoursMs - 5000)
      expect(expiresAt).toBeLessThanOrEqual(after + twentyFourHoursMs + 5000)
    })
  })

  // =========================================================================
  // PRICING
  // =========================================================================

  describe('Pricing', () => {
    it('calls getPrice with BOOST_STD', async () => {
      setupFullHappyPath()

      await callPOST()

      expect(vi.mocked(getPrice)).toHaveBeenCalledWith('BOOST_STD')
    })

    it('uses cost from getPrice in response and shortBoost.create', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupNoActiveBoost()
      vi.mocked(getPrice).mockResolvedValue(2500)
      vi.mocked(spendCredits).mockResolvedValue({
        success: true,
        totalSpent: 2500,
        transactionIds: ['tx-1'],
        batchesAffected: []
      } as never)
      setupDefaultBoostCreate()

      const response = await callPOST()
      const data = await response.json()

      expect(data.cost).toBe(2500)
      expect(vi.mocked(prisma.shortBoost.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cost: 2500
        })
      })
      expect(vi.mocked(spendCredits)).toHaveBeenCalledWith(
        'user-1',
        2500,
        'BOOST_STD',
        'short-1'
      )
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('returns 402 with details when InsufficientCreditsError thrown', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupNoActiveBoost()
      vi.mocked(getPrice).mockResolvedValue(1000)
      vi.mocked(spendCredits).mockRejectedValue(
        new InsufficientCreditsError(1000, 200)
      )

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits')
      expect(data.required).toBe(1000)
      expect(data.available).toBe(200)
    })

    it('returns 500 on unexpected errors', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      setupNoActiveBoost()
      vi.mocked(getPrice).mockResolvedValue(1000)
      vi.mocked(spendCredits).mockRejectedValue(new Error('Database connection failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })
  })

  // =========================================================================
  // PARAMS HANDLING
  // =========================================================================

  describe('Params Handling', () => {
    it('extracts shortId from route params correctly', async () => {
      setupFullHappyPath()

      await POST(createRequest(), { params: Promise.resolve({ id: 'custom-short-id' }) })

      expect(vi.mocked(prisma.short.findFirst)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'custom-short-id'
          })
        })
      )
    })
  })

  // =========================================================================
  // BOOST QUERY
  // =========================================================================

  describe('Boost Query', () => {
    it('checks for existing boost with ACTIVE status and future expiresAt', async () => {
      setupFullHappyPath()

      await callPOST()

      expect(vi.mocked(prisma.shortBoost.findFirst)).toHaveBeenCalledWith({
        where: {
          shortId: 'short-1',
          status: 'ACTIVE',
          expiresAt: { gt: expect.any(Date) }
        }
      })
    })

    it('does not check for boost if short not found', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      await callPOST()

      expect(vi.mocked(prisma.shortBoost.findFirst)).not.toHaveBeenCalled()
    })

    it('does not check for boost if short is not PUBLISHED', async () => {
      setupAuthenticatedUser()
      setupShortFound({ status: 'DRAFT' })

      await callPOST()

      expect(vi.mocked(prisma.shortBoost.findFirst)).not.toHaveBeenCalled()
    })
  })
})
