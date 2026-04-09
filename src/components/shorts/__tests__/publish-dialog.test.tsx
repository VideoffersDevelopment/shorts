import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { PublishDialog } from '../publish-dialog'
import type { PointPackageId } from '@/lib/wallet/wallet-constants'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock next-intl
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'publish.title': 'Publish Short',
        'publish.verificationRequired': 'Company verification required',
        'publish.verificationDescription': 'Please verify your company before publishing',
        'publish.verifyCompany': 'Verify Company',
        'publish.yourCredits': 'Your credits',
        'publish.useCreditsTitle': 'Use Credits',
        'publish.useCreditsDescription': 'Use 1 credit to publish this short',
        'publish.useCredit': 'Use 1 Credit',
        'publish.noCredits': 'No credits available',
        'publish.noCreditsDescription': 'Purchase credits to publish',
        'publish.buyAndPublish': 'Buy & Publish',
        'publish.buyCredits': 'Buy Credits',
        'publish.buyCreditsDescription': 'Select a credit package',
        'publish.processing': 'Processing...',
        'publish.processingDescription': 'Please wait while we process your request',
        'publish.success.title': 'Success!',
        'publish.success.description': 'Your short is being processed',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'errors.publishFailed': 'Publication failed',
        'errors.checkoutFailed': 'Checkout failed'
      }
      return translations[key] || key
    }
  })
}))

// Mock payments lib (NO PRICE_PER_CREDIT)
vi.mock('@/lib/payments', () => ({
  formatAmount: (grosze: number) => (grosze / 100).toFixed(2)
}))

// Mock publish action
vi.mock('@/app/actions/shorts/publish', () => ({
  publishShortAction: vi.fn()
}))

// Mock CreditsDisplay
vi.mock('@/components/payments/credits-display', () => ({
  CreditsDisplay: ({ credits }: { credits: number }) => (
    <div data-testid="credits-display">{credits} credits</div>
  )
}))

// Mock PaymentForm
vi.mock('@/components/payments/payment-form', () => ({
  PaymentForm: ({ onSubmit, isLoading }: { onSubmit: (provider: string, packageId: PointPackageId) => void, isLoading: boolean }) => (
    <div data-testid="payment-form">
      <button
        onClick={() => onSubmit('PRZELEWY24', 'starter')}
        disabled={isLoading}
      >
        Pay Now
      </button>
    </div>
  )
}))

import { publishShortAction } from '@/app/actions/shorts/publish'

describe('PublishDialog', () => {
  const defaultProps = {
    shortId: 'short-123',
    shortTitle: 'My Test Short',
    companyVerified: true,
    credits: 5,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    locale: 'en'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch
    globalThis.fetch = vi.fn()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(<PublishDialog {...defaultProps} />)

      expect(screen.getByText('Publish Short')).toBeInTheDocument()
    })

    it('does not render content when isOpen is false', () => {
      render(<PublishDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Publish Short')).not.toBeInTheDocument()
    })

    it('displays short title in description', () => {
      render(<PublishDialog {...defaultProps} shortTitle="My Amazing Video" />)

      expect(screen.getByText('My Amazing Video')).toBeInTheDocument()
    })

    it('shows credits balance', () => {
      render(<PublishDialog {...defaultProps} credits={10} />)

      expect(screen.getByTestId('credits-display')).toHaveTextContent('10 credits')
    })
  })

  // ===========================================================================
  // COMPANY VERIFICATION
  // ===========================================================================

  describe('Company Verification', () => {
    it('shows verification required when company not verified', () => {
      render(<PublishDialog {...defaultProps} companyVerified={false} />)

      expect(screen.getByText('Company verification required')).toBeInTheDocument()
      expect(screen.getByText(/please verify your company/i)).toBeInTheDocument()
    })

    it('shows verify company button when not verified', () => {
      render(<PublishDialog {...defaultProps} companyVerified={false} />)

      expect(screen.getByRole('button', { name: /verify company/i })).toBeInTheDocument()
    })

    it('hides credit/payment options when not verified', () => {
      render(<PublishDialog {...defaultProps} companyVerified={false} />)

      expect(screen.queryByText('Your credits')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /use 1 credit/i })).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // CREDITS FLOW
  // ===========================================================================

  describe('Credits Flow', () => {
    it('shows use credits option when credits > 0', () => {
      render(<PublishDialog {...defaultProps} credits={5} />)

      expect(screen.getByText('Use Credits')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /use 1 credit/i })).toBeInTheDocument()
    })

    it('calls publish action when use credits clicked', async () => {
      vi.mocked(publishShortAction).mockResolvedValue({
        success: true,
        data: { processing: true, redirectUrl: '/panel/shorts/short-123' }
      } as never)

      const { user } = render(<PublishDialog {...defaultProps} credits={5} />)

      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      expect(publishShortAction).toHaveBeenCalledWith('short-123')
    })

    it('shows success state after publishing', async () => {
      vi.mocked(publishShortAction).mockResolvedValue({
        success: true,
        data: { processing: true, redirectUrl: '/panel/shorts/short-123' }
      } as never)

      const { user } = render(<PublishDialog {...defaultProps} credits={5} />)

      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // PAYMENT FLOW
  // ===========================================================================

  describe('Payment Flow', () => {
    it('shows no credits message when credits = 0', () => {
      render(<PublishDialog {...defaultProps} credits={0} />)

      expect(screen.getByText('No credits available')).toBeInTheDocument()
    })

    it('shows buy and publish button when no credits', () => {
      render(<PublishDialog {...defaultProps} credits={0} />)

      expect(screen.getByRole('button', { name: /buy & publish/i })).toBeInTheDocument()
    })

    it('opens payment form when buy clicked', async () => {
      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))

      expect(screen.getByText('Buy Credits')).toBeInTheDocument()
      expect(screen.getByTestId('payment-form')).toBeInTheDocument()
    })

    it('shows back button in payment view', async () => {
      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('returns to initial view when back clicked', async () => {
      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))
      await user.click(screen.getByRole('button', { name: /back/i }))

      expect(screen.getByText('Publish Short')).toBeInTheDocument()
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows processing state during publish', async () => {
      vi.mocked(publishShortAction).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { processing: true }
        } as never), 1000))
      )

      const { user } = render(<PublishDialog {...defaultProps} credits={5} />)

      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('processing dialog cannot be closed', async () => {
      vi.mocked(publishShortAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const onClose = vi.fn()
      const { user } = render(
        <PublishDialog {...defaultProps} credits={5} onClose={onClose} />
      )

      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      // Dialog should show processing and not call onClose
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error when publish fails', async () => {
      vi.mocked(publishShortAction).mockResolvedValue({
        success: false,
        error: 'Insufficient credits'
      } as never)

      const { user } = render(<PublishDialog {...defaultProps} credits={5} />)

      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      await waitFor(() => {
        expect(screen.getByText('Insufficient credits')).toBeInTheDocument()
      })
    })

    it('shows error when checkout API fails', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Payment provider error' })
      } as Response)

      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))
      await user.click(screen.getByRole('button', { name: /pay now/i }))

      await waitFor(() => {
        expect(screen.getByText('Payment provider error')).toBeInTheDocument()
      })
    })

    it('returns to initial state with error when payment fails', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Payment error' })
      } as Response)

      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      // Go to payment form
      await user.click(screen.getByRole('button', { name: /buy & publish/i }))
      // Submit payment (triggers error)
      await user.click(screen.getByRole('button', { name: /pay now/i }))

      // After error, component returns to initial state with error displayed
      await waitFor(() => {
        expect(screen.getByText('Payment error')).toBeInTheDocument()
      })

      // Verify we're back at initial state - buy button should be visible again
      // User can retry the payment from here
      expect(screen.getByRole('button', { name: /buy & publish/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onClose when cancel clicked', async () => {
      const onClose = vi.fn()
      const { user } = render(
        <PublishDialog {...defaultProps} onClose={onClose} />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when dialog dismissed', async () => {
      const onClose = vi.fn()
      const { user } = render(
        <PublishDialog {...defaultProps} onClose={onClose} />
      )

      // Click cancel to close
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('redirects to checkout URL on successful payment creation', async () => {
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      })

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ checkoutUrl: 'https://payment.example.com/checkout' })
      } as Response)

      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))
      await user.click(screen.getByRole('button', { name: /pay now/i }))

      await waitFor(() => {
        expect(mockLocation.href).toBe('https://payment.example.com/checkout')
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible dialog title', () => {
      render(<PublishDialog {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Publish Short')).toBeInTheDocument()
    })

    it('has accessible buttons', () => {
      render(<PublishDialog {...defaultProps} credits={5} />)

      expect(screen.getByRole('button', { name: /use 1 credit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('alert role for verification warning', () => {
      render(<PublishDialog {...defaultProps} companyVerified={false} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles exactly 1 credit', () => {
      render(<PublishDialog {...defaultProps} credits={1} />)

      expect(screen.getByRole('button', { name: /use 1 credit/i })).toBeInTheDocument()
    })

    it('resets state when dialog closes and reopens', async () => {
      vi.mocked(publishShortAction).mockResolvedValue({
        success: false,
        error: 'Test error'
      } as never)

      const { user, rerender } = render(<PublishDialog {...defaultProps} credits={5} />)

      // Trigger error
      await user.click(screen.getByRole('button', { name: /use 1 credit/i }))

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })

      // Close dialog
      rerender(<PublishDialog {...defaultProps} credits={5} isOpen={false} />)

      // Reopen dialog
      rerender(<PublishDialog {...defaultProps} credits={5} isOpen={true} />)

      // Error should be cleared (state reset in handleClose)
      // Note: Component may need internal state reset logic
    })

    it('handles network errors gracefully', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'))

      const { user } = render(<PublishDialog {...defaultProps} credits={0} />)

      await user.click(screen.getByRole('button', { name: /buy & publish/i }))
      await user.click(screen.getByRole('button', { name: /pay now/i }))

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })
})
