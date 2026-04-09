import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { Footer } from './footer'

// =============================================================================
// MOCKS
// =============================================================================

// Mock Date to ensure consistent year in tests
const mockDate = new Date('2025-11-29T12:00:00Z')
vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders footer element', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('renders copyright text', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByText(/© 2025 VideoShorts/)).toBeInTheDocument()
    })

    it('renders all rights reserved text', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
    })

    it('renders About link', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
    })

    it('renders Privacy link', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
    })

    it('renders Terms link', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LINKS
  // ===========================================================================

  describe('Links', () => {
    it('About link has correct href', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/pl/about')
    })

    it('Privacy link has correct href', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/pl/privacy')
    })

    it('Terms link has correct href', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/pl/terms')
    })
  })

  // ===========================================================================
  // LOCALE HANDLING
  // ===========================================================================

  describe('Locale Handling', () => {
    it('uses correct locale for links (pl)', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/pl/about')
    })

    it('uses correct locale for links (en)', () => {
      render(<Footer locale="en" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/en/about')
      expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/en/privacy')
      expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/en/terms')
    })

    it('uses correct locale for links (de)', () => {
      render(<Footer locale="de" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/de/about')
    })

    it('uses correct locale for links (es)', () => {
      render(<Footer locale="es" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/es/about')
    })

    it('uses correct locale for links (ru)', () => {
      render(<Footer locale="ru" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/ru/about')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('footer has contentinfo role', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('all links are accessible', () => {
      render(<Footer locale="pl" />)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('links have descriptive text', () => {
      render(<Footer locale="pl" />)

      expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty locale gracefully', () => {
      render(<Footer locale="" />)

      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '//about')
    })

    it('renders consistently across multiple renders', () => {
      const { rerender } = render(<Footer locale="pl" />)

      expect(screen.getByText(/© 2025 VideoShorts/)).toBeInTheDocument()

      rerender(<Footer locale="en" />)

      expect(screen.getByText(/© 2025 VideoShorts/)).toBeInTheDocument()
    })
  })
})
