import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pricingConfig: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('@/lib/wallet/pricing-service', () => ({
  getAllPricing: vi.fn(),
  invalidatePricingCache: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllPricing, invalidatePricingCache } from '@/lib/wallet/pricing-service'
import { GET, PUT } from '../route'

// ===========================================================================
// HELPERS
// ===========================================================================

function setupAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: 'admin-1', role: 'ADMIN' }
  } as never)
}

function setupNonAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: 'user-1', role: 'USER' }
  } as never)
}

function setupExistingPricingConfig(key = 'PUBLICATION', cost = 100, enabled = true) {
  vi.mocked(prisma.pricingConfig.findUnique).mockResolvedValue({
    key,
    cost,
    enabled,
    createdAt: new Date(),
    updatedAt: new Date()
  } as never)
}

function setupPricingConfigUpdate(key = 'PUBLICATION', cost = 200, enabled = true) {
  vi.mocked(prisma.pricingConfig.update).mockResolvedValue({
    key,
    cost,
    enabled,
    createdAt: new Date(),
    updatedAt: new Date()
  } as never)
}

function setupAuditLogCreate() {
  vi.mocked(prisma.auditLog.create).mockResolvedValue({
    id: 'audit-1'
  } as never)
}

function setupTransactionMock() {
  const mockPrisma = vi.mocked(prisma)
  mockPrisma.$transaction.mockImplementation(async (args: unknown[]) => {
    const results = await Promise.all(args as Promise<unknown>[])
    return results
  })
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('GET /api/admin/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // AUTH
  // =========================================================================

  describe('Auth', () => {
    it('returns 403 for unauthenticated user', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('returns 403 for non-admin user', async () => {
      setupNonAdminSession()

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('returns 403 when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { role: 'ADMIN' } } as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe('Happy Path', () => {
    it('returns pricing list for admin', async () => {
      setupAdminSession()
      const mockPricing = [
        { key: 'PUBLICATION', cost: 100, enabled: true },
        { key: 'BOOST_STD', cost: 1000, enabled: true }
      ]
      vi.mocked(getAllPricing).mockResolvedValue(mockPricing as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pricing).toEqual(mockPricing)
    })

    it('calls getAllPricing', async () => {
      setupAdminSession()
      vi.mocked(getAllPricing).mockResolvedValue([] as never)

      await GET()

      expect(vi.mocked(getAllPricing)).toHaveBeenCalledOnce()
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('returns 500 on internal error', async () => {
      setupAdminSession()
      vi.mocked(getAllPricing).mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })
  })
})

describe('PUT /api/admin/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // AUTH
  // =========================================================================

  describe('Auth', () => {
    it('returns 403 for unauthenticated user', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('returns 403 for non-admin user', async () => {
      setupNonAdminSession()
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  // =========================================================================
  // VALIDATION
  // =========================================================================

  describe('Validation', () => {
    it('returns 400 for missing key', async () => {
      setupAdminSession()
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing or invalid key')
    })

    it('returns 400 for negative cost', async () => {
      setupAdminSession()
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: -100 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cost must be a non-negative number')
    })

    it('returns 400 for non-numeric cost', async () => {
      setupAdminSession()
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 'invalid' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cost must be a non-negative number')
    })

    it('returns 404 for unknown key', async () => {
      setupAdminSession()
      vi.mocked(prisma.pricingConfig.findUnique).mockResolvedValue(null)
      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'UNKNOWN_KEY', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Pricing config not found')
    })
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe('Happy Path', () => {
    it('updates pricing config successfully', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 200, true)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pricing).toBeDefined()
      expect(data.pricing.cost).toBe(200)
    })

    it('invalidates pricing cache after update', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 200, true)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      await PUT(request)

      expect(vi.mocked(invalidatePricingCache)).toHaveBeenCalledOnce()
    })

    it('creates AuditLog entry', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 200, true)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      await PUT(request)

      expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-1',
          action: 'PRICING_UPDATE',
          targetType: 'PricingConfig',
          targetId: 'PUBLICATION',
          metadata: {
            previousCost: 100,
            newCost: 200,
            previousEnabled: true,
            newEnabled: true
          }
        }
      })
    })

    it('returns updated pricing', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 200, true)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(data.pricing.key).toBe('PUBLICATION')
      expect(data.pricing.cost).toBe(200)
    })

    it('handles enabling/disabling', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 100, false)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 100, enabled: false }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(vi.mocked(prisma.pricingConfig.update)).toHaveBeenCalledWith({
        where: { key: 'PUBLICATION' },
        data: { cost: 100, enabled: false }
      })
    })

    it('handles partial update (only cost, no enabled)', async () => {
      setupAdminSession()
      setupExistingPricingConfig('PUBLICATION', 100, true)
      setupPricingConfigUpdate('PUBLICATION', 200, true)
      setupAuditLogCreate()
      setupTransactionMock()

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      await PUT(request)

      expect(vi.mocked(prisma.pricingConfig.update)).toHaveBeenCalledWith({
        where: { key: 'PUBLICATION' },
        data: { cost: 200 }
      })
    })
  })

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('returns 500 on internal error', async () => {
      setupAdminSession()
      vi.mocked(prisma.pricingConfig.findUnique).mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new Request('http://localhost/api/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({ key: 'PUBLICATION', cost: 200 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      consoleSpy.mockRestore()
    })
  })
})
