import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    payment: {
      create: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-session-id-12345678901234567890')
}))

vi.mock('@/lib/payments', () => ({
  getPointPackage: vi.fn(),
  createPrzelewy24Checkout: vi.fn(),
  createTpayCheckout: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPointPackage,
  createPrzelewy24Checkout,
  createTpayCheckout
} from '@/lib/payments'
import { POST } from '../checkout/route'

describe('POST /api/payments/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create request
  function createRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost:3000/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe('Happy Path', () => {
    it('creates Przelewy24 checkout session for starter package', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-1',
        provider: 'PRZELEWY24',
        status: 'PENDING',
        creditsGranted: 10_000,
        amount: 15
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      vi.mocked(createPrzelewy24Checkout).mockResolvedValue(
        'https://sandbox.przelewy24.pl/trnRequest/token123'
      )

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://sandbox.przelewy24.pl/trnRequest/token123')
      expect(data.paymentId).toBe('payment-123')

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'PRZELEWY24',
          amount: 15,
          creditsGranted: 10_000,
          metadata: expect.objectContaining({
            packageId: 'starter',
            points: 10_000,
            pricePLN: 1_500
          })
        })
      })
    })

    it('creates Tpay checkout session for business package with correct amount', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'business',
        points: 500_000,
        pricePLN: 50_000,
        label: '500 000 pkt',
        description: 'Pakiet biznesowy (~17% rabat)'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-456',
        userId: 'user-1',
        provider: 'TPAY',
        status: 'PENDING',
        creditsGranted: 500_000,
        amount: 500
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      vi.mocked(createTpayCheckout).mockResolvedValue(
        'https://secure.sandbox.tpay.com/checkout/abc'
      )

      const request = createRequest({
        provider: 'TPAY',
        packageId: 'business'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://secure.sandbox.tpay.com/checkout/abc')
      expect(data.paymentId).toBe('payment-456')

      // Verify amount is 500 PLN (50000 grosze / 100)
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 500,
          creditsGranted: 500_000
        })
      })

      // Verify checkout was called with grosze
      expect(createTpayCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50_000
        })
      )
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe('Auth Failures', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as never)

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('returns 401 when user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' } // No id
      } as never)

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe('Validation Failures', () => {
    it('returns 400 for invalid provider', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      const request = createRequest({
        provider: 'STRIPE', // Invalid
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for invalid packageId', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'invalid-package'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 for missing provider', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      const request = createRequest({
        packageId: 'starter'
        // Missing provider
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('returns 400 when user email not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User email not found')
    })

    it('returns 400 when package not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(getPointPackage).mockReturnValue(null)

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid point package')
    })
  })

  // ===========================================================================
  // PROVIDER ERRORS
  // ===========================================================================

  describe('Provider Errors', () => {
    it('returns 500 and marks payment as FAILED when P24 checkout fails', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-123',
        status: 'PENDING'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      vi.mocked(createPrzelewy24Checkout).mockRejectedValue(
        new Error('P24 API error')
      )

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: { status: 'FAILED' }
      })
    })

    it('returns 500 and marks payment as FAILED when Tpay checkout fails', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'standard',
        points: 50_000,
        pricePLN: 6_500,
        label: '50 000 pkt',
        description: 'Pakiet standardowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-456',
        status: 'PENDING'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)

      vi.mocked(createTpayCheckout).mockRejectedValue(new Error('Tpay error'))

      const request = createRequest({
        provider: 'TPAY',
        packageId: 'standard'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-456' },
        data: { status: 'FAILED' }
      })
    })
  })

  // ===========================================================================
  // PACKAGE VERIFICATION
  // ===========================================================================

  describe('Package Verification', () => {
    it('returns correct points and amount for starter package', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      await POST(request)

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creditsGranted: 10_000,
          amount: 15
        })
      })
    })

    it('returns correct points and amount for standard package', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'standard',
        points: 50_000,
        pricePLN: 6_500,
        label: '50 000 pkt',
        description: 'Pakiet standardowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'standard'
      })

      await POST(request)

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creditsGranted: 50_000,
          amount: 65
        })
      })
    })

    it('returns correct points and amount for premium package', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'premium',
        points: 100_000,
        pricePLN: 12_000,
        label: '100 000 pkt',
        description: 'Pakiet premium'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'premium'
      })

      await POST(request)

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creditsGranted: 100_000,
          amount: 120
        })
      })
    })

    it('returns correct points and amount for business package', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'business',
        points: 500_000,
        pricePLN: 50_000,
        label: '500 000 pkt',
        description: 'Pakiet biznesowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'business'
      })

      await POST(request)

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creditsGranted: 500_000,
          amount: 500
        })
      })
    })
  })

  // ===========================================================================
  // URL CONSTRUCTION
  // ===========================================================================

  describe('URL Construction', () => {
    it('constructs correct return URL and notify URL', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-123'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter'
      })

      await POST(request)

      expect(createPrzelewy24Checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: expect.stringContaining('http://localhost:3000/pl/panel/credits?paymentId=payment-123'),
          notifyUrl: 'http://localhost:3000/api/webhooks/przelewy24'
        })
      )
    })

    it('uses custom return URL when provided', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-123'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter',
        returnUrl: 'https://example.com/custom-return'
      })

      await POST(request)

      expect(createPrzelewy24Checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: expect.stringContaining('https://example.com/custom-return?paymentId=payment-123')
        })
      )
    })

    it('uses correct locale in return URL', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'starter',
        points: 10_000,
        pricePLN: 1_500,
        label: '10 000 pkt',
        description: 'Pakiet startowy'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-123'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'starter',
        locale: 'en'
      })

      await POST(request)

      expect(createPrzelewy24Checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: expect.stringContaining('/en/panel/credits')
        })
      )
    })
  })

  // ===========================================================================
  // METADATA
  // ===========================================================================

  describe('Metadata', () => {
    it('stores packageId, points, and pricePLN in payment metadata', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1' }
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com'
      } as never)

      vi.mocked(getPointPackage).mockReturnValue({
        id: 'premium',
        points: 100_000,
        pricePLN: 12_000,
        label: '100 000 pkt',
        description: 'Pakiet premium'
      })

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1'
      } as never)

      vi.mocked(prisma.payment.update).mockResolvedValue({} as never)
      vi.mocked(createPrzelewy24Checkout).mockResolvedValue('https://p24.com')

      const request = createRequest({
        provider: 'PRZELEWY24',
        packageId: 'premium',
        locale: 'en'
      })

      await POST(request)

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            packageId: 'premium',
            points: 100_000,
            pricePLN: 12_000,
            locale: 'en',
            createdAt: expect.any(String)
          })
        })
      })
    })
  })
})
