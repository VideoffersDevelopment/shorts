import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { ErrorBoundary } from './error-boundary'

// =============================================================================
// TEST COMPONENTS
// =============================================================================

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Component that works normally
const WorkingComponent = () => <div>Working content</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Working content')).toBeInTheDocument()
    })

    it('renders multiple children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('renders default fallback when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Please try again later')).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('catches errors from nested components', () => {
      const NestedError = () => (
        <div>
          <span>Outer</span>
          <ThrowError />
        </div>
      )

      render(
        <ErrorBoundary>
          <NestedError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('logs error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  describe('State Management', () => {
    it('maintains error state after error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Rerender should still show error
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // FALLBACK COMPONENT
  // ===========================================================================

  describe('Fallback Component', () => {
    it('default fallback has heading', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    })

    it('default fallback has centered layout', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const container = screen.getByText('Something went wrong').closest('div')?.parentElement
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('min-h-screen')
    })

    it('custom fallback can include interactive elements', () => {
      const handleRetry = vi.fn()
      const customFallback = (
        <div>
          <p>Error occurred</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>)

      // Should not throw, nothing to render
      expect(document.body).toBeInTheDocument()
    })

    it('handles undefined children', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>)

      // Should not throw
      expect(document.body).toBeInTheDocument()
    })

    it('works with non-throwing components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('handles deeply nested errors', () => {
      const DeeplyNested = () => (
        <div>
          <div>
            <div>
              <ThrowError />
            </div>
          </div>
        </div>
      )

      render(
        <ErrorBoundary>
          <DeeplyNested />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('handles empty fallback', () => {
      render(
        <ErrorBoundary fallback={<></>}>
          <ThrowError />
        </ErrorBoundary>
      )

      // Should render empty fragment, no crash
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('default fallback has heading for screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('error message is readable', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Please try again later')).toBeInTheDocument()
    })
  })
})
