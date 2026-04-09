import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    short: { findFirst: vi.fn() }
  }
}))

vi.mock('@/lib/wallet/wallet-service', () => ({
  transferTip: vi.fn()
}))

vi.mock('@/lib/wallet/wallet-types', async () => {
  const actual = await vi.importActual('@/lib/wallet/wallet-types')
  return { ...actual }
})

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transferTip } from '@/lib/wallet/wallet-service'
import { InsufficientCreditsError } from '@/lib/wallet/wallet-types'
import { POST } from '../route'

// ===========================================================================
// HELPERS
// ===========================================================================

function createRequest(): Request {
  return new Request('http://localhost:3000/api/shorts/short-1/super-like', {
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
    company: {
      userId: 'owner-user-1'
    }
  }
  vi.mocked(prisma.short.findFirst).mockResolvedValue({
    ...defaultShort,
    ...overrides
  } as never)
}

function setupTransferTip(cost = 100) {
  vi.mocked(transferTip).mockResolvedValue({
    success: true,
    cost,
    senderTransactionIds: ['tx-sender-1'],
    receiverTransactionId: 'tx-receiver-1',
    receiverBatchId: 'batch-receiver-1'
  } as never)
}

function setupFullHappyPath(options: { tipperUserId?: string; ownerUserId?: string; cost?: number } = {}) {
  const tipperUserId = options.tipperUserId ?? 'user-1'
  const ownerUserId = options.ownerUserId ?? 'owner-user-1'
  const cost = options.cost ?? 100

  setupAuthenticatedUser(tipperUserId)
  setupShortFound({ company: { userId: ownerUserId } })
  setupTransferTip(cost)
}

function callPOST(shortId = 'short-1') {
  const request = createRequest()
  return POST(request, { params: Promise.resolve({ id: shortId }) })
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('POST /api/shorts/[id]/super-like', () => {
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

    it('returns 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as never)

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
  // VALIDATION - Short Not Found / Not Published
  // =========================================================================

  describe('Validation - Short Not Found', () => {
    it('returns 404 when short not found', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Short not found or not published')
    })

    it('returns 404 when short is not PUBLISHED (query filters by PUBLISHED status)', async () => {
      setupAuthenticatedUser()
      // When short is DRAFT, the query with status: "PUBLISHED" filter returns null
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Short not found or not published')
      expect(vi.mocked(transferTip)).not.toHaveBeenCalled()
    })

    it('queries for short with PUBLISHED status filter', async () => {
      setupAuthenticatedUser('user-1')
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      await callPOST('test-short-id')

      expect(vi.mocked(prisma.short.findFirst)).toHaveBeenCalledWith({
        where: {
          id: 'test-short-id',
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          status: true,
          company: {
            select: {
              userId: true
            }
          }
        }
      })
    })
  })

  // =========================================================================
  // VALIDATION - Self-Tip Prevention
  // =========================================================================

  describe('Validation - Self-Tip Prevention', () => {
    it('returns 400 when user tries to tip their own video', async () => {
      setupAuthenticatedUser('user-1')
      setupShortFound({ company: { userId: 'user-1' } })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot tip your own video')
      expect(vi.mocked(transferTip)).not.toHaveBeenCalled()
    })

    it('allows tipping when user is different from video owner', async () => {
      setupFullHappyPath({ tipperUserId: 'user-1', ownerUserId: 'user-2' })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // =========================================================================
  // TRANSFER - Happy Path
  // =========================================================================

  describe('Transfer - Happy Path', () => {
    it('calls transferTip with correct parameters (fromUserId, toUserId, shortId)', async () => {
      setupFullHappyPath({ tipperUserId: 'tipper-123', ownerUserId: 'owner-456' })

      await callPOST('short-abc')

      expect(vi.mocked(transferTip)).toHaveBeenCalledWith(
        'tipper-123',
        'owner-456',
        'short-abc'
      )
    })

    it('returns 200 with success and cost on successful tip', async () => {
      setupFullHappyPath({ cost: 100 })

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cost).toBe(100)
    })

    it('returns correct cost from transferTip result', async () => {
      setupFullHappyPath({ cost: 250 })

      const response = await callPOST()
      const data = await response.json()

      expect(data.cost).toBe(250)
    })
  })

  // =========================================================================
  // INSUFFICIENT CREDITS
  // =========================================================================

  describe('Insufficient Credits', () => {
    it('returns 402 with details when InsufficientCreditsError thrown', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(transferTip).mockRejectedValue(
        new InsufficientCreditsError(100, 50)
      )

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits')
      expect(data.required).toBe(100)
      expect(data.available).toBe(50)
    })

    it('returns 402 with zero available credits', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(transferTip).mockRejectedValue(
        new InsufficientCreditsError(100, 0)
      )

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits')
      expect(data.required).toBe(100)
      expect(data.available).toBe(0)
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('returns 500 on unexpected errors from transferTip', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      vi.mocked(transferTip).mockRejectedValue(new Error('Database connection failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })

    it('returns 500 on unexpected errors from prisma', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockRejectedValue(new Error('Prisma error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callPOST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })

    it('logs error to console on 500', async () => {
      setupAuthenticatedUser()
      setupShortFound()
      const error = new Error('Unexpected error')
      vi.mocked(transferTip).mockRejectedValue(error)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await callPOST()

      expect(consoleSpy).toHaveBeenCalledWith(
        'POST /api/shorts/[id]/super-like error:',
        error
      )

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

    it('passes correct shortId to transferTip', async () => {
      setupFullHappyPath()

      await POST(createRequest(), { params: Promise.resolve({ id: 'video-xyz' }) })

      expect(vi.mocked(transferTip)).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'video-xyz'
      )
    })
  })

  // =========================================================================
  // FLOW VALIDATION
  // =========================================================================

  describe('Flow Validation', () => {
    it('does not call transferTip if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      await callPOST()

      expect(vi.mocked(transferTip)).not.toHaveBeenCalled()
    })

    it('does not call transferTip if short not found', async () => {
      setupAuthenticatedUser()
      vi.mocked(prisma.short.findFirst).mockResolvedValue(null)

      await callPOST()

      expect(vi.mocked(transferTip)).not.toHaveBeenCalled()
    })

    it('does not call transferTip if self-tip detected', async () => {
      setupAuthenticatedUser('user-1')
      setupShortFound({ company: { userId: 'user-1' } })

      await callPOST()

      expect(vi.mocked(transferTip)).not.toHaveBeenCalled()
    })

    it('calls transferTip only when all validations pass', async () => {
      setupFullHappyPath()

      await callPOST()

      expect(vi.mocked(transferTip)).toHaveBeenCalledTimes(1)
    })
  })
})
