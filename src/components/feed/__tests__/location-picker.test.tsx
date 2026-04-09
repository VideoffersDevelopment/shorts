import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { LocationPicker } from '../location-picker'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockDetect = vi.fn()
const mockClear = vi.fn()

vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: () => ({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
    detect: mockDetect,
    clear: mockClear,
  }),
}))

describe('LocationPicker', () => {
  const defaultProps = {
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    radius: undefined as number | undefined,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDetect.mockResolvedValue({ lat: 52.2297, lng: 21.0122 })
  })

  // ===========================================================================
  // RENDERING - NO LOCATION
  // ===========================================================================

  describe('Rendering - No Location', () => {
    it('renders detect location button', () => {
      render(<LocationPicker {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      ).toBeInTheDocument()
    })

    it('renders radius selector', () => {
      render(<LocationPicker {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('radius selector is disabled without location', () => {
      render(<LocationPicker {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  // ===========================================================================
  // RENDERING - WITH LOCATION
  // ===========================================================================

  describe('Rendering - With Location', () => {
    it('renders near me button with radius', () => {
      render(
        <LocationPicker
          {...defaultProps}
          lat={52.2297}
          lng={21.0122}
          radius={25}
        />
      )

      expect(
        screen.getByRole('button', { name: /filters\.location\.nearMe.*25 km/i })
      ).toBeInTheDocument()
    })

    it('shows default radius of 25km when not specified', () => {
      render(
        <LocationPicker {...defaultProps} lat={52.2297} lng={21.0122} />
      )

      expect(
        screen.getByRole('button', { name: /filters\.location\.nearMe.*25 km/i })
      ).toBeInTheDocument()
    })

    it('radius selector is enabled with location', () => {
      render(
        <LocationPicker
          {...defaultProps}
          lat={52.2297}
          lng={21.0122}
          radius={25}
        />
      )

      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls detect when clicking detect location button', async () => {
      const { user } = render(<LocationPicker {...defaultProps} />)

      await user.click(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      )

      expect(mockDetect).toHaveBeenCalledTimes(1)
    })

    it('calls onChange with detected location and default radius', async () => {
      const onChange = vi.fn()
      mockDetect.mockResolvedValue({ lat: 52.2297, lng: 21.0122 })

      const { user } = render(
        <LocationPicker {...defaultProps} onChange={onChange} />
      )

      await user.click(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      )

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(52.2297, 21.0122, 25)
      })
    })

    it('preserves existing radius when detecting location', async () => {
      const onChange = vi.fn()
      mockDetect.mockResolvedValue({ lat: 52.2297, lng: 21.0122 })

      const { user } = render(
        <LocationPicker {...defaultProps} radius={10} onChange={onChange} />
      )

      await user.click(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      )

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(52.2297, 21.0122, 10)
      })
    })

    it('calls clear and onChange when clicking location button with location set', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <LocationPicker
          {...defaultProps}
          lat={52.2297}
          lng={21.0122}
          radius={25}
          onChange={onChange}
        />
      )

      await user.click(
        screen.getByRole('button', { name: /filters\.location\.nearMe/i })
      )

      expect(mockClear).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(undefined, undefined, undefined)
    })

    it('does not call onChange when detection fails', async () => {
      const onChange = vi.fn()
      mockDetect.mockResolvedValue(null)

      const { user } = render(
        <LocationPicker {...defaultProps} onChange={onChange} />
      )

      await user.click(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      )

      await waitFor(() => {
        expect(mockDetect).toHaveBeenCalled()
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles lat without lng', () => {
      render(
        <LocationPicker {...defaultProps} lat={52.2297} lng={undefined} />
      )

      // Should show detect button (location incomplete)
      expect(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      ).toBeInTheDocument()
    })

    it('handles lng without lat', () => {
      render(
        <LocationPicker {...defaultProps} lat={undefined} lng={21.0122} />
      )

      // Should show detect button (location incomplete)
      expect(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      ).toBeInTheDocument()
    })

    it('handles radius without location', () => {
      render(<LocationPicker {...defaultProps} radius={25} />)

      // Should show detect button (no location)
      expect(
        screen.getByRole('button', { name: /filters\.location\.detectLocation/i })
      ).toBeInTheDocument()

      // Radius selector should be disabled
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('handles zero coordinates', () => {
      render(<LocationPicker {...defaultProps} lat={0} lng={0} radius={25} />)

      // Zero is a valid coordinate (equator/prime meridian)
      expect(
        screen.getByRole('button', { name: /filters\.location\.nearMe/i })
      ).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('main button has button role', () => {
      render(<LocationPicker {...defaultProps} />)

      expect(screen.getByRole('button', { name: /filters\.location/i })).toBeInTheDocument()
    })

    it('radius selector has combobox role', () => {
      render(<LocationPicker {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('button has type="button" to prevent form submission', () => {
      render(<LocationPicker {...defaultProps} />)

      const button = screen.getByRole('button', { name: /filters\.location/i })
      expect(button).toHaveAttribute('type', 'button')
    })
  })
})
