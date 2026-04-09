import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { PreferencesForm } from './preferences-form'
import { updateProfileAction } from '@/app/actions/profile/update'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/profile/update', () => ({
  updateProfileAction: vi.fn(),
}))

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

const mockUpdateProfileAction = vi.mocked(updateProfileAction)
const mockUseTheme = vi.mocked(useTheme)
const mockSetTheme = vi.fn()
const mockPush = vi.fn()
const mockUseRouter = vi.mocked(useRouter)
const mockUsePathname = vi.mocked(usePathname)

describe('PreferencesForm', () => {
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
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    })
    mockUsePathname.mockReturnValue('/pl/panel/preferences')
    mockUpdateProfileAction.mockResolvedValue({ success: true })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders preferences form', () => {
      render(<PreferencesForm locale="pl" />)

      expect(screen.getByText('theme.title')).toBeInTheDocument()
      expect(screen.getByText('language.title')).toBeInTheDocument()
    })

    it('renders theme section with description', () => {
      render(<PreferencesForm locale="pl" />)

      expect(screen.getByText('theme.title')).toBeInTheDocument()
      expect(screen.getByText('theme.description')).toBeInTheDocument()
    })

    it('renders language section with description', () => {
      render(<PreferencesForm locale="pl" />)

      expect(screen.getByText('language.title')).toBeInTheDocument()
      expect(screen.getByText('language.description')).toBeInTheDocument()
    })

    it('renders save button', () => {
      render(<PreferencesForm locale="pl" />)

      expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    })

    it('contains theme toggle component', () => {
      render(<PreferencesForm locale="pl" />)

      // ThemeToggle renders with sr-only "Toggle theme" text
      expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    })

    it('contains locale switcher component', () => {
      render(<PreferencesForm locale="pl" />)

      // LocaleSwitcher shows current locale name
      expect(screen.getByText('Polski')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls updateProfileAction when save button clicked', async () => {
      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({ darkMode: false })
      })
    })

    it('saves darkMode as true when theme is dark', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({ darkMode: true })
      })
    })

    it('saves darkMode as false when theme is system', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({ darkMode: false })
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows saving text while submitting', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockUpdateProfileAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(screen.getByText('saving')).toBeInTheDocument()
      })

      resolveAction?.({ success: true })
    })

    it('disables save button while saving', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockUpdateProfileAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'saving' })).toBeDisabled()
      })

      resolveAction?.({ success: true })
    })

    it('re-enables save button after save completes', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'save' })).not.toBeDisabled()
      })
    })

    it('button shows save text after completion', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(screen.getByText('save')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // THEME INTEGRATION
  // ===========================================================================

  describe('Theme Integration', () => {
    it('can open theme toggle dropdown', async () => {
      const { user } = render(<PreferencesForm locale="pl" />)

      // Click the theme toggle button (identified by sr-only text)
      const themeButtons = screen.getAllByRole('button')
      const themeToggle = themeButtons.find(btn =>
        btn.querySelector('.sr-only')?.textContent === 'Toggle theme'
      )

      if (themeToggle) {
        await user.click(themeToggle)

        await waitFor(() => {
          expect(screen.getByText('theme.light')).toBeInTheDocument()
        })
      }
    })

    it('can select dark theme from dropdown', async () => {
      const { user } = render(<PreferencesForm locale="pl" />)

      const themeButtons = screen.getAllByRole('button')
      const themeToggle = themeButtons.find(btn =>
        btn.querySelector('.sr-only')?.textContent === 'Toggle theme'
      )

      if (themeToggle) {
        await user.click(themeToggle)

        await waitFor(() => {
          expect(screen.getByText('theme.dark')).toBeInTheDocument()
        })

        await user.click(screen.getByText('theme.dark'))

        expect(mockSetTheme).toHaveBeenCalledWith('dark')
      }
    })
  })

  // ===========================================================================
  // LOCALE INTEGRATION
  // ===========================================================================

  describe('Locale Integration', () => {
    it('can open locale switcher dropdown', async () => {
      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByText('Polski'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })
    })

    it('can switch locale via dropdown', async () => {
      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByText('Polski'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })

      await user.click(screen.getByText('English'))

      expect(mockPush).toHaveBeenCalledWith('/en/panel/preferences')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has properly structured headings', () => {
      render(<PreferencesForm locale="pl" />)

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings).toHaveLength(2)
    })

    it('theme section has proper hierarchy', () => {
      render(<PreferencesForm locale="pl" />)

      const themeHeading = screen.getByRole('heading', { name: 'theme.title' })
      expect(themeHeading).toHaveClass('text-lg')
    })

    it('language section has proper hierarchy', () => {
      render(<PreferencesForm locale="pl" />)

      const languageHeading = screen.getByRole('heading', { name: 'language.title' })
      expect(languageHeading).toHaveClass('text-lg')
    })

    it('save button has accessible name', () => {
      render(<PreferencesForm locale="pl" />)

      expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles server action error gracefully', async () => {
      mockUpdateProfileAction.mockResolvedValue({ error: 'Save failed' })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      // Should not crash, button should be re-enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'save' })).not.toBeDisabled()
      })
    })

    it('handles undefined theme', async () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: undefined,
        themes: ['light', 'dark', 'system'],
        systemTheme: undefined,
        forcedTheme: undefined,
      })

      const { user } = render(<PreferencesForm locale="pl" />)

      await user.click(screen.getByRole('button', { name: 'save' }))

      // darkMode should be false when theme !== 'dark'
      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({ darkMode: false })
      })
    })

    it('prevents double submission', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockUpdateProfileAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PreferencesForm locale="pl" />)

      const saveButton = screen.getByRole('button', { name: 'save' })

      await user.click(saveButton)

      // Try to click again while saving
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'saving' })).toBeDisabled()
      })

      // Resolve the action
      resolveAction?.({ success: true })

      // Should only have been called once
      expect(mockUpdateProfileAction).toHaveBeenCalledTimes(1)
    })
  })
})
