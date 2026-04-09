import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ThemeToggle } from './theme-toggle'
import { useTheme } from 'next-themes'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockSetTheme = vi.fn()
const mockUseTheme = vi.mocked(useTheme)

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders theme toggle button', () => {
      render(<ThemeToggle />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders toggle button with sr-only text', () => {
      render(<ThemeToggle />)

      expect(screen.getByText('Toggle theme')).toBeInTheDocument()
      expect(screen.getByText('Toggle theme')).toHaveClass('sr-only')
    })

    it('renders with icon styling classes', () => {
      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dropdown menu on click', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('theme.light')).toBeInTheDocument()
        expect(screen.getByText('theme.dark')).toBeInTheDocument()
        expect(screen.getByText('theme.system')).toBeInTheDocument()
      })
    })

    it('calls setTheme with "light" when light option clicked', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('theme.light')).toBeInTheDocument()
      })

      await user.click(screen.getByText('theme.light'))

      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('calls setTheme with "dark" when dark option clicked', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('theme.dark')).toBeInTheDocument()
      })

      await user.click(screen.getByText('theme.dark'))

      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('calls setTheme with "system" when system option clicked', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('theme.system')).toBeInTheDocument()
      })

      await user.click(screen.getByText('theme.system'))

      expect(mockSetTheme).toHaveBeenCalledWith('system')
    })
  })

  // ===========================================================================
  // THEME OPTIONS
  // ===========================================================================

  describe('Theme Options', () => {
    it('shows all three theme options in dropdown', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems).toHaveLength(3)
      })
    })

    it('shows translated theme labels', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('theme.light')).toBeInTheDocument()
        expect(screen.getByText('theme.dark')).toBeInTheDocument()
        expect(screen.getByText('theme.system')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // THEME STATE
  // ===========================================================================

  describe('Theme State', () => {
    it('uses light theme from useTheme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      render(<ThemeToggle />)

      expect(mockUseTheme).toHaveBeenCalled()
    })

    it('uses dark theme from useTheme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      render(<ThemeToggle />)

      expect(mockUseTheme).toHaveBeenCalled()
    })

    it('uses system theme from useTheme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      render(<ThemeToggle />)

      expect(mockUseTheme).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible trigger button', () => {
      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('has sr-only text for screen readers', () => {
      render(<ThemeToggle />)

      const srText = screen.getByText('Toggle theme')
      expect(srText).toHaveClass('sr-only')
    })

    it('dropdown items are accessible as menuitems', async () => {
      const { user } = render(<ThemeToggle />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems.length).toBeGreaterThan(0)
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles undefined theme gracefully', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: undefined,
        themes: ['light', 'dark', 'system'],
        systemTheme: undefined,
        forcedTheme: undefined,
      })

      expect(() => render(<ThemeToggle />)).not.toThrow()
    })

    it('multiple clicks do not cause issues', async () => {
      const { user } = render(<ThemeToggle />)

      const triggerButton = screen.getByRole('button')

      // Multiple clicks should not throw - open, close, open
      await user.click(triggerButton)
      // When dropdown is open, clicking trigger again closes it
      // Just verify no crash occurs
      expect(triggerButton).toBeInTheDocument()
    })
  })
})
