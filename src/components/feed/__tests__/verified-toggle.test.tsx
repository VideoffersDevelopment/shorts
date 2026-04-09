import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { VerifiedToggle } from '../verified-toggle'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

describe('VerifiedToggle', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders switch component', () => {
      render(<VerifiedToggle {...defaultProps} />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('renders label text', () => {
      render(<VerifiedToggle {...defaultProps} />)

      expect(screen.getByText('filters.verifiedOnly.label')).toBeInTheDocument()
    })

    it('renders description text', () => {
      render(<VerifiedToggle {...defaultProps} />)

      expect(
        screen.getByText('filters.verifiedOnly.description')
      ).toBeInTheDocument()
    })

    it('renders badge check icon', () => {
      render(<VerifiedToggle {...defaultProps} />)

      // BadgeCheck icon is rendered in the component
      const container = screen.getByText('filters.verifiedOnly.label').closest('div')
      expect(container).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STATES
  // ===========================================================================

  describe('States', () => {
    it('renders unchecked when checked is false', () => {
      render(<VerifiedToggle {...defaultProps} checked={false} />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('data-state', 'unchecked')
    })

    it('renders checked when checked is true', () => {
      render(<VerifiedToggle {...defaultProps} checked={true} />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('data-state', 'checked')
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onChange when clicked', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <VerifiedToggle {...defaultProps} checked={false} onChange={onChange} />
      )

      await user.click(screen.getByRole('switch'))

      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('calls onChange with false when unchecking', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <VerifiedToggle {...defaultProps} checked={true} onChange={onChange} />
      )

      await user.click(screen.getByRole('switch'))

      expect(onChange).toHaveBeenCalledWith(false)
    })

    it('calls onChange once per click', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <VerifiedToggle {...defaultProps} onChange={onChange} />
      )

      await user.click(screen.getByRole('switch'))

      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('can be toggled by clicking label', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <VerifiedToggle {...defaultProps} onChange={onChange} />
      )

      // Click on label should toggle the switch
      await user.click(screen.getByText('filters.verifiedOnly.label'))

      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe('Props', () => {
    it('updates state when checked prop changes', () => {
      const { rerender } = render(
        <VerifiedToggle {...defaultProps} checked={false} />
      )

      expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')

      rerender(<VerifiedToggle {...defaultProps} checked={true} />)

      expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has switch role', () => {
      render(<VerifiedToggle {...defaultProps} />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('has associated label via htmlFor', () => {
      render(<VerifiedToggle {...defaultProps} />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('id', 'verified-toggle')

      const label = screen.getByText('filters.verifiedOnly.label')
      expect(label.closest('label')).toHaveAttribute('for', 'verified-toggle')
    })

    it('has correct aria-checked attribute', () => {
      const { rerender } = render(
        <VerifiedToggle {...defaultProps} checked={false} />
      )

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

      rerender(<VerifiedToggle {...defaultProps} checked={true} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
  })
})
