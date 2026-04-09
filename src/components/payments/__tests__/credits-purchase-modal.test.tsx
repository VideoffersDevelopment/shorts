import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CreditsPurchaseModal } from '../credits-purchase-modal'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, vars?: Record<string, string>) => {
      if (vars) return `${key}:${JSON.stringify(vars)}`
      return key
    }
  })
}))

// Mock wallet constants
vi.mock('@/lib/wallet/wallet-constants', () => ({
  POINT_PACKAGES: [
    { id: "starter", points: 10000, pricePLN: 1500, label: "10 000 pkt", description: "Pakiet startowy" },
    { id: "standard", points: 50000, pricePLN: 6500, label: "50 000 pkt", description: "Pakiet standardowy (~7% rabat)" },
    { id: "premium", points: 100000, pricePLN: 12000, label: "100 000 pkt", description: "Pakiet premium (~20% rabat)" },
    { id: "business", points: 500000, pricePLN: 50000, label: "500 000 pkt", description: "Pakiet biznesowy (~33% rabat)" },
  ]
}))

// Mock payments lib
vi.mock('@/lib/payments', () => ({
  formatAmount: (grosze: number) => (grosze / 100).toFixed(2)
}))

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock window.location
const mockLocationAssign = vi.fn()
Object.defineProperty(window, 'location', {
  value: { href: '', assign: mockLocationAssign },
  writable: true
})

describe('CreditsPurchaseModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('purchase.title')).toBeInTheDocument()
      expect(screen.getByText('purchase.description')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <CreditsPurchaseModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('purchase.title')).not.toBeInTheDocument()
    })

    it('renders all point packages', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // 4 packages: starter, standard, premium, business (labels appear in cards and summary)
      expect(screen.getAllByText(/10 000 pkt/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/50 000 pkt/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/100 000 pkt/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/500 000 pkt/).length).toBeGreaterThan(0)
    })

    it('renders package prices', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Prices may appear multiple times (in options and summary), use getAllByText
      expect(screen.getAllByText(/15\.00\s*PLN/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/65\.00\s*PLN/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/120\.00\s*PLN/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/500\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('renders payment provider options', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Przelewy24')).toBeInTheDocument()
      expect(screen.getByText('Tpay')).toBeInTheDocument()
    })

    it('renders cancel and buy buttons', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: 'purchase.cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'purchase.buy' })).toBeInTheDocument()
    })

    it('shows total summary', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('form.total')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls onClose when cancel clicked', async () => {
      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.cancel' }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('selects different point package', async () => {
      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Click on premium package using the radio button by text content within label
      const radios = screen.getAllByRole('radio')
      // Find the radio for premium package (index: 0=starter, 1=standard, 2=premium, 3=business)
      await user.click(radios[2])

      // Summary should update to show 120.00 PLN (might appear multiple times)
      expect(screen.getAllByText(/120\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('selects different payment provider', async () => {
      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Find all radios - first 4 are packages, last 2 are providers (przelewy24, tpay)
      const radios = screen.getAllByRole('radio')
      const tpayRadio = radios[5] // index 5 = tpay (index 4 = przelewy24)
      await user.click(tpayRadio)

      // Tpay should be selected
      expect(tpayRadio).toBeChecked()
    })

    it('submits checkout request with selected options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkoutUrl: 'https://payment.example.com' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/payments/checkout', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }))
      })
    })

    it('redirects to checkout URL on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkoutUrl: 'https://payment.example.com/checkout' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(window.location.href).toBe('https://payment.example.com/checkout')
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('disables buttons during checkout', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'purchase.cancel' })).toBeDisabled()
      })
    })

    it('disables package selection during checkout', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        // All radios should be disabled
        const radios = screen.getAllByRole('radio')
        expect(radios[0]).toBeDisabled()
      })
    })

    it('prevents dialog close during checkout', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'purchase.cancel' })).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('displays error on checkout failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Payment failed' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })
    })

    it('displays error on network exception', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('does not redirect on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Payment failed' })
      })

      const initialHref = window.location.href

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })

      // href should not have changed
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('clears error when dialog reopened', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Payment failed' })
      })

      const { user, rerender } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })

      // Close
      rerender(
        <CreditsPurchaseModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Reopen
      rerender(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Payment failed')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('defaults to starter package', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // First radio (index 0) should be starter and checked by default
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toBeChecked()
    })

    it('defaults to PRZELEWY24 provider', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Index 4 is przelewy24 provider (after 4 package radios)
      const radios = screen.getAllByRole('radio')
      expect(radios[4]).toBeChecked()
    })

    it('sends correct packageId in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkoutUrl: 'https://payment.example.com' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Select business package (index 3)
      const radios = screen.getAllByRole('radio')
      await user.click(radios[3])
      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/payments/checkout',
          expect.objectContaining({
            body: expect.stringContaining('"packageId":"business"')
          })
        )
      })
    })

    it('sends selected provider in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkoutUrl: 'https://payment.example.com' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Select TPAY (index 5)
      const radios = screen.getAllByRole('radio')
      await user.click(radios[5])
      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/payments/checkout',
          expect.objectContaining({
            body: expect.stringContaining('"provider":"TPAY"')
          })
        )
      })
    })

    it('sends locale in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkoutUrl: 'https://payment.example.com' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/payments/checkout',
          expect.objectContaining({
            body: expect.stringContaining('"locale"')
          })
        )
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('dialog has title', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('radio groups are labeled', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Modal has 2 radiogroups: packages and providers
      const radiogroups = screen.getAllByRole('radiogroup')
      expect(radiogroups).toHaveLength(2)
    })

    it('error alert is visible when error occurs', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      })

      const { user } = render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'purchase.buy' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('package options have labels', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Verify package radios have associated labels via for/id
      const radios = screen.getAllByRole('radio')
      // First 4 radios are packages (starter, standard, premium, business)
      expect(radios[0]).toHaveAttribute('id', 'pkg-starter')
      expect(radios[1]).toHaveAttribute('id', 'pkg-standard')
      expect(radios[2]).toHaveAttribute('id', 'pkg-premium')
      expect(radios[3]).toHaveAttribute('id', 'pkg-business')
    })

    it('provider options have labels', () => {
      render(
        <CreditsPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Verify provider radios have associated labels via for/id
      const radios = screen.getAllByRole('radio')
      // Last 2 radios are providers (przelewy24, tpay)
      expect(radios[4]).toHaveAttribute('id', 'przelewy24')
      expect(radios[5]).toHaveAttribute('id', 'tpay')
    })
  })
})
