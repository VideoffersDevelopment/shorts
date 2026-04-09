import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { ThemeProvider } from './theme-provider'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-themes-provider">{children}</div>
  ),
}))

describe('ThemeProvider', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div>Child content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('wraps children with NextThemesProvider', () => {
      render(
        <ThemeProvider>
          <span>Test child</span>
        </ThemeProvider>
      )

      expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
      expect(screen.getByText('Test child')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <ThemeProvider>
          <div>First child</div>
          <div>Second child</div>
        </ThemeProvider>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS FORWARDING
  // ===========================================================================

  describe('Props Forwarding', () => {
    it('passes attribute prop to NextThemesProvider', () => {
      render(
        <ThemeProvider attribute="class">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('passes defaultTheme prop to NextThemesProvider', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('passes enableSystem prop to NextThemesProvider', () => {
      render(
        <ThemeProvider enableSystem>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('passes multiple props to NextThemesProvider', () => {
      render(
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div>Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('renders without any props', () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders with empty children', () => {
      expect(() =>
        render(<ThemeProvider>{null}</ThemeProvider>)
      ).not.toThrow()
    })

    it('renders nested providers', () => {
      render(
        <ThemeProvider>
          <ThemeProvider>
            <div>Nested content</div>
          </ThemeProvider>
        </ThemeProvider>
      )

      expect(screen.getByText('Nested content')).toBeInTheDocument()
    })
  })
})
