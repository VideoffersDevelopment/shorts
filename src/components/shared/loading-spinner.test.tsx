import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { LoadingSpinner } from './loading-spinner'

describe('LoadingSpinner', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders spinner element', () => {
      render(<LoadingSpinner />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has accessible label', () => {
      render(<LoadingSpinner />)

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<LoadingSpinner />)

      expect(screen.getByText('Loading...')).toHaveClass('sr-only')
    })

    it('has animation class', () => {
      render(<LoadingSpinner />)

      expect(screen.getByRole('status')).toHaveClass('animate-spin')
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<LoadingSpinner size="sm" />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders medium size by default', () => {
      render(<LoadingSpinner />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders large size', () => {
      render(<LoadingSpinner size="lg" />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  // ===========================================================================
  // CUSTOM CLASS
  // ===========================================================================

  describe('Custom className', () => {
    it('accepts custom className', () => {
      render(<LoadingSpinner className="my-custom-class" />)

      expect(screen.getByRole('status')).toHaveClass('my-custom-class')
    })

    it('merges custom className with default classes', () => {
      render(<LoadingSpinner className="text-red-500" />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
      expect(spinner).toHaveClass('text-red-500')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has role status', () => {
      render(<LoadingSpinner />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has aria-label Loading', () => {
      render(<LoadingSpinner />)

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
    })

    it('includes visually hidden loading text', () => {
      render(<LoadingSpinner />)

      const srOnly = screen.getByText('Loading...')
      expect(srOnly).toBeInTheDocument()
      expect(srOnly).toHaveClass('sr-only')
    })
  })
})
