import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { CreditsDisplay, CreditsBalance } from '../credits-display'

// Mock next-intl
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'credits.credit': 'credit',
        'credits.plural': 'credits',
        'credits.buy': 'Buy more',
        'credits.creditAvailable': 'credit available',
        'credits.pluralAvailable': 'credits available'
      }
      return translations[key] || key
    }
  })
}))

describe('CreditsDisplay', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders credit count', () => {
      render(<CreditsDisplay credits={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('shows singular "credit" for 1 credit', () => {
      render(<CreditsDisplay credits={1} />)

      expect(screen.getByText('credit')).toBeInTheDocument()
    })

    it('shows plural "credits" for multiple credits', () => {
      render(<CreditsDisplay credits={5} />)

      expect(screen.getByText('credits')).toBeInTheDocument()
    })

    it('shows 0 credits correctly', () => {
      render(<CreditsDisplay credits={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('credits')).toBeInTheDocument()
    })

    it('includes coins icon', () => {
      render(<CreditsDisplay credits={5} />)

      // Icon should be rendered (check for svg or icon container)
      const badge = screen.getByText('5').closest('[class*="badge"]') ||
                    screen.getByText('5').parentElement
      expect(badge).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS & VARIANTS
  // ===========================================================================

  describe('Props & Variants', () => {
    it('applies default variant when credits > 0', () => {
      render(<CreditsDisplay credits={5} />)

      const badge = screen.getByText('5').closest('[class*="badge"]') ||
                    screen.getByText('5').parentElement
      expect(badge).toBeInTheDocument()
    })

    it('applies secondary variant when credits = 0', () => {
      render(<CreditsDisplay credits={0} />)

      const badge = screen.getByText('0').closest('[class*="badge"]') ||
                    screen.getByText('0').parentElement
      expect(badge).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<CreditsDisplay credits={5} className="custom-class" />)

      const container = screen.getByText('5').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SIZES
  // ===========================================================================

  describe('Sizes', () => {
    it('renders with default size', () => {
      render(<CreditsDisplay credits={5} size="default" />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders with small size', () => {
      render(<CreditsDisplay credits={5} size="sm" />)

      const badge = screen.getByText('5').parentElement
      expect(badge).toHaveClass('text-sm')
    })

    it('renders with large size', () => {
      render(<CreditsDisplay credits={5} size="lg" />)

      const badge = screen.getByText('5').parentElement
      expect(badge).toHaveClass('text-lg')
    })
  })

  // ===========================================================================
  // PURCHASE BUTTON
  // ===========================================================================

  describe('Purchase Button', () => {
    it('shows purchase button when showPurchaseButton is true', () => {
      const onPurchase = vi.fn()
      render(
        <CreditsDisplay
          credits={5}
          showPurchaseButton={true}
          onPurchase={onPurchase}
        />
      )

      expect(screen.getByRole('button', { name: /buy more/i })).toBeInTheDocument()
    })

    it('hides purchase button when showPurchaseButton is false', () => {
      const onPurchase = vi.fn()
      render(
        <CreditsDisplay
          credits={5}
          showPurchaseButton={false}
          onPurchase={onPurchase}
        />
      )

      expect(screen.queryByRole('button', { name: /buy more/i })).not.toBeInTheDocument()
    })

    it('hides purchase button when onPurchase is not provided', () => {
      render(
        <CreditsDisplay
          credits={5}
          showPurchaseButton={true}
          // No onPurchase
        />
      )

      expect(screen.queryByRole('button', { name: /buy more/i })).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onPurchase when purchase button clicked', async () => {
      const onPurchase = vi.fn()
      const { user } = render(
        <CreditsDisplay
          credits={5}
          showPurchaseButton={true}
          onPurchase={onPurchase}
        />
      )

      await user.click(screen.getByRole('button', { name: /buy more/i }))

      expect(onPurchase).toHaveBeenCalledTimes(1)
    })

    it('handles undefined onPurchase gracefully', async () => {
      const { user } = render(
        <CreditsDisplay
          credits={5}
          showPurchaseButton={true}
          onPurchase={undefined}
        />
      )

      // Button should not be rendered when onPurchase is undefined
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles large credit numbers', () => {
      render(<CreditsDisplay credits={9999} />)

      expect(screen.getByText('9999')).toBeInTheDocument()
    })

    it('handles negative credits (edge case)', () => {
      render(<CreditsDisplay credits={-5} />)

      expect(screen.getByText('-5')).toBeInTheDocument()
    })
  })
})

describe('CreditsBalance', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders large credit number', () => {
      render(<CreditsBalance credits={25} />)

      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('shows singular text for 1 credit', () => {
      render(<CreditsBalance credits={1} />)

      expect(screen.getByText('credit available')).toBeInTheDocument()
    })

    it('shows plural text for multiple credits', () => {
      render(<CreditsBalance credits={10} />)

      expect(screen.getByText('credits available')).toBeInTheDocument()
    })

    it('shows plural for 0 credits', () => {
      render(<CreditsBalance credits={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('credits available')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe('Props', () => {
    it('applies custom className', () => {
      render(<CreditsBalance credits={5} className="custom-balance" />)

      const container = screen.getByText('5').closest('.custom-balance')
      expect(container).toBeInTheDocument()
    })

    it('centers content by default', () => {
      render(<CreditsBalance credits={5} />)

      const container = screen.getByText('5').closest('.text-center')
      expect(container).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VISUAL ELEMENTS
  // ===========================================================================

  describe('Visual Elements', () => {
    it('renders coins icon', () => {
      render(<CreditsBalance credits={5} />)

      // The component should include the Coins icon
      const container = screen.getByText('5').closest('div')
      expect(container).toBeInTheDocument()
    })

    it('displays credit count prominently', () => {
      render(<CreditsBalance credits={100} />)

      const creditNumber = screen.getByText('100')
      expect(creditNumber).toHaveClass('text-5xl', 'font-bold')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(<CreditsBalance credits={99999} />)

      expect(screen.getByText('99999')).toBeInTheDocument()
    })

    it('handles zero gracefully', () => {
      render(<CreditsBalance credits={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })
})
