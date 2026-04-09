import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen } from '@/test/utils'
import { PaymentForm } from '../payment-form'
import type { PointPackageId } from '@/lib/wallet/wallet-constants'

// Mock next-intl
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'form.package': 'Package',
        'form.selectPackage': 'Select package',
        'form.provider': 'Payment provider',
        'form.total': 'Total',
        'form.processing': 'Processing...',
        'form.pay': `Pay ${params?.amount} PLN`,
        'form.securityNote': 'Secure payment processed by provider',
        'providers.p24Description': 'Bank transfer, cards',
        'providers.tpayDescription': 'Fast transfers'
      }
      return translations[key] || key
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

describe('PaymentForm', () => {
  const defaultOnSubmit = vi.fn()

  // Mock pointer capture methods for Radix UI Select
  beforeAll(() => {
    // These are needed for Radix UI components that use pointer events
    if (typeof HTMLElement.prototype.hasPointerCapture === 'undefined') {
      Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
        value: () => false,
        writable: true,
        configurable: true
      })
    }
    if (typeof HTMLElement.prototype.setPointerCapture === 'undefined') {
      Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
        value: () => {},
        writable: true,
        configurable: true
      })
    }
    if (typeof HTMLElement.prototype.releasePointerCapture === 'undefined') {
      Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
        value: () => {},
        writable: true,
        configurable: true
      })
    }
    // Mock scrollIntoView for Radix scroll behavior
    if (typeof Element.prototype.scrollIntoView === 'undefined') {
      Element.prototype.scrollIntoView = vi.fn()
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders provider selection', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      expect(screen.getByText('Payment provider')).toBeInTheDocument()
      expect(screen.getByText('Przelewy24')).toBeInTheDocument()
      expect(screen.getByText('Tpay')).toBeInTheDocument()
    })

    it('displays total price for default starter package', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      // Price appears in package card and total, use getAllByText
      expect(screen.getAllByText(/15\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('displays submit button with price', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      expect(screen.getByRole('button', { name: /pay 15.00 pln/i })).toBeInTheDocument()
    })

    it('displays security note', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      expect(screen.getByText(/secure payment/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS & VARIANTS
  // ===========================================================================

  describe('Props & Variants', () => {
    it('uses defaultPackageId value', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} defaultPackageId="standard" />)

      // standard: 6500 grosze = 65.00 PLN (appears in package card and total)
      expect(screen.getAllByText(/65\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('selects Przelewy24 by default', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      const p24Radio = screen.getByRole('radio', { name: /przelewy24/i })
      expect(p24Radio).toBeChecked()
    })

    it('calculates correct total for starter package', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} defaultPackageId="starter" />)
      // starter: 1500 grosze = 15.00 PLN (appears in package card and total)
      expect(screen.getAllByText(/15\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('calculates correct total for premium package', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} defaultPackageId="premium" />)
      // premium: 12000 grosze = 120.00 PLN (appears in package card and total)
      expect(screen.getAllByText(/120\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('calculates correct total for business package', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} defaultPackageId="business" />)
      // business: 50000 grosze = 500.00 PLN (appears in package card and total)
      expect(screen.getAllByText(/500\.00\s*PLN/).length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('selects Tpay provider when clicked', async () => {
      const { user } = render(<PaymentForm onSubmit={defaultOnSubmit} />)

      const tpayLabel = screen.getByText('Tpay').closest('label')
      await user.click(tpayLabel!)

      const tpayRadio = screen.getByRole('radio', { name: /tpay/i })
      expect(tpayRadio).toBeChecked()
    })

    it('calls onSubmit with selected provider and packageId', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const { user } = render(
        <PaymentForm onSubmit={onSubmit} defaultPackageId="standard" />
      )

      await user.click(screen.getByRole('button', { name: /pay/i }))

      expect(onSubmit).toHaveBeenCalledWith('PRZELEWY24', 'standard')
    })

    it('calls onSubmit with Tpay when Tpay selected', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const { user } = render(
        <PaymentForm onSubmit={onSubmit} defaultPackageId="starter" />
      )

      const tpayLabel = screen.getByText('Tpay').closest('label')
      await user.click(tpayLabel!)
      await user.click(screen.getByRole('button', { name: /pay/i }))

      expect(onSubmit).toHaveBeenCalledWith('TPAY', 'starter')
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('disables submit button when loading', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('shows processing text when loading', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} isLoading={true} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('disables provider selection when loading', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} isLoading={true} />)

      // Check that all radio buttons are disabled
      const radios = screen.getAllByRole('radio')
      radios.forEach(radio => {
        expect(radio).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible labels for provider selection', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      // Form now has 2 radiogroups (packages + providers)
      const radioGroups = screen.getAllByRole('radiogroup')
      expect(radioGroups.length).toBe(2)
      expect(screen.getByRole('radio', { name: /przelewy24/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /tpay/i })).toBeInTheDocument()
    })

    it('submit button has accessible name', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      expect(screen.getByRole('button', { name: /pay 15.00 pln/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles undefined defaultPackageId (uses starter)', () => {
      render(<PaymentForm onSubmit={defaultOnSubmit} />)

      // Should show 15.00 PLN (starter package - appears in package card and total)
      expect(screen.getAllByText(/15\.00\s*PLN/).length).toBeGreaterThan(0)
    })

    it('handles async onSubmit correctly', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      const { user } = render(<PaymentForm onSubmit={onSubmit} />)

      await user.click(screen.getByRole('button', { name: /pay/i }))

      expect(onSubmit).toHaveBeenCalled()
    })

    it('maintains provider state after clicking submit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const { user } = render(
        <PaymentForm onSubmit={onSubmit} defaultPackageId="starter" />
      )

      // Select Tpay
      const tpayLabel = screen.getByText('Tpay').closest('label')
      await user.click(tpayLabel!)

      // Submit
      await user.click(screen.getByRole('button', { name: /pay/i }))

      // Verify Tpay was selected when submitting
      expect(onSubmit).toHaveBeenCalledWith('TPAY', 'starter')
    })
  })
})
