import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { RadiusSelector } from '../radius-selector'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

describe('RadiusSelector', () => {
  const defaultProps = {
    value: undefined as number | undefined,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders select trigger', () => {
      render(<RadiusSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('displays current radius value', () => {
      render(<RadiusSelector {...defaultProps} value={25} />)

      expect(screen.getByText('25 km')).toBeInTheDocument()
    })

    it('renders with correct width class', () => {
      render(<RadiusSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).toHaveClass('w-32')
    })

    it('displays all translation for undefined value', () => {
      render(<RadiusSelector {...defaultProps} value={undefined} />)

      // When no value, it shows the "all" option
      expect(
        screen.getByText('filters.location.radiusOptions.all')
      ).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STATES
  // ===========================================================================

  describe('States', () => {
    it('is disabled when disabled prop is true', () => {
      render(<RadiusSelector {...defaultProps} disabled={true} />)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('is enabled when disabled prop is false', () => {
      render(<RadiusSelector {...defaultProps} disabled={false} />)

      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('is enabled by default', () => {
      render(<RadiusSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe('Props', () => {
    it('updates displayed value when value prop changes', () => {
      const { rerender } = render(
        <RadiusSelector {...defaultProps} value={10} />
      )

      expect(screen.getByText('10 km')).toBeInTheDocument()

      rerender(<RadiusSelector {...defaultProps} value={50} />)

      expect(screen.getByText('50 km')).toBeInTheDocument()
    })

    it('displays each radius option correctly', () => {
      const radiusOptions = [1, 5, 10, 25, 50]

      radiusOptions.forEach((radius) => {
        const { unmount } = render(
          <RadiusSelector {...defaultProps} value={radius} />
        )
        expect(screen.getByText(`${radius} km`)).toBeInTheDocument()
        unmount()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has combobox role', () => {
      render(<RadiusSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('trigger is focusable', () => {
      render(<RadiusSelector {...defaultProps} />)

      const combobox = screen.getByRole('combobox')
      combobox.focus()
      expect(document.activeElement).toBe(combobox)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles switching between values', () => {
      const { rerender } = render(
        <RadiusSelector {...defaultProps} value={1} />
      )

      expect(screen.getByText('1 km')).toBeInTheDocument()

      rerender(<RadiusSelector {...defaultProps} value={undefined} />)

      expect(
        screen.getByText('filters.location.radiusOptions.all')
      ).toBeInTheDocument()
    })
  })
})
