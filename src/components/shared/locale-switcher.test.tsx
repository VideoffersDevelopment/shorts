import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { LocaleSwitcher } from './locale-switcher'
import { useRouter, usePathname } from 'next/navigation'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

const mockPush = vi.fn()
const mockUseRouter = vi.mocked(useRouter)
const mockUsePathname = vi.mocked(usePathname)

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    })
    mockUsePathname.mockReturnValue('/pl/panel/preferences')
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders locale switcher button', () => {
      render(<LocaleSwitcher locale="pl" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays current locale name (Polski for pl)', () => {
      render(<LocaleSwitcher locale="pl" />)

      expect(screen.getByText('Polski')).toBeInTheDocument()
    })

    it('displays current locale name (English for en)', () => {
      mockUsePathname.mockReturnValue('/en/panel/preferences')
      render(<LocaleSwitcher locale="en" />)

      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('displays current locale name (Deutsch for de)', () => {
      mockUsePathname.mockReturnValue('/de/panel/preferences')
      render(<LocaleSwitcher locale="de" />)

      expect(screen.getByText('Deutsch')).toBeInTheDocument()
    })

    it('displays current locale name (Espanol for es)', () => {
      mockUsePathname.mockReturnValue('/es/panel/preferences')
      render(<LocaleSwitcher locale="es" />)

      expect(screen.getByText('Español')).toBeInTheDocument()
    })

    it('displays current locale name (Russian for ru)', () => {
      mockUsePathname.mockReturnValue('/ru/panel/preferences')
      render(<LocaleSwitcher locale="ru" />)

      expect(screen.getByText('Русский')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dropdown menu on click', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
        expect(screen.getByText('Deutsch')).toBeInTheDocument()
        expect(screen.getByText('Español')).toBeInTheDocument()
        expect(screen.getByText('Русский')).toBeInTheDocument()
      })
    })

    it('shows all 6 language options in dropdown', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems).toHaveLength(6)
      })
    })

    it('switches to English locale when clicked', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })

      await user.click(screen.getByText('English'))

      expect(mockPush).toHaveBeenCalledWith('/en/panel/preferences')
    })

    it('switches to German locale when clicked', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Deutsch'))

      expect(mockPush).toHaveBeenCalledWith('/de/panel/preferences')
    })

    it('switches to Spanish locale when clicked', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Español')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Español'))

      expect(mockPush).toHaveBeenCalledWith('/es/panel/preferences')
    })

    it('switches to Russian locale when clicked', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Русский')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Русский'))

      expect(mockPush).toHaveBeenCalledWith('/ru/panel/preferences')
    })

    it('switches from English to Polish', async () => {
      mockUsePathname.mockReturnValue('/en/panel/preferences')
      const { user } = render(<LocaleSwitcher locale="en" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        // Find Polski in menu items (first Polski is trigger button, second is menu)
        const menuItems = screen.getAllByRole('menuitem')
        const polskiItem = menuItems.find(item => item.textContent === 'Polski')
        expect(polskiItem).toBeInTheDocument()
      })

      const menuItems = screen.getAllByRole('menuitem')
      const polskiItem = menuItems.find(item => item.textContent === 'Polski')
      if (polskiItem) {
        await user.click(polskiItem)
      }

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/preferences')
    })
  })

  // ===========================================================================
  // PATHNAME HANDLING
  // ===========================================================================

  describe('Pathname Handling', () => {
    it('preserves path after locale when switching', async () => {
      mockUsePathname.mockReturnValue('/pl/panel/settings/account')
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })

      await user.click(screen.getByText('English'))

      expect(mockPush).toHaveBeenCalledWith('/en/panel/settings/account')
    })

    it('handles root locale paths', async () => {
      mockUsePathname.mockReturnValue('/pl')
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })

      await user.click(screen.getByText('English'))

      expect(mockPush).toHaveBeenCalledWith('/en')
    })

    it('handles deep nested paths', async () => {
      mockUsePathname.mockReturnValue('/pl/panel/profile/edit/avatar')
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Deutsch'))

      expect(mockPush).toHaveBeenCalledWith('/de/panel/profile/edit/avatar')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('trigger button has accessible name', () => {
      render(<LocaleSwitcher locale="pl" />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Polski')
    })

    it('dropdown items are accessible as menuitems', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems.length).toBe(6)
      })
    })

    it('each menu item has descriptive text', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Polski' })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: 'English' })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: 'Deutsch' })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: 'Español' })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: 'Русский' })).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles unknown locale gracefully', () => {
      render(<LocaleSwitcher locale="xx" />)

      // Should render without crashing, current language will be undefined
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('clicking same locale still calls router.push', async () => {
      const { user } = render(<LocaleSwitcher locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        const polskiItem = menuItems.find(item => item.textContent === 'Polski')
        expect(polskiItem).toBeInTheDocument()
      })

      const menuItems = screen.getAllByRole('menuitem')
      const polskiItem = menuItems.find(item => item.textContent === 'Polski')
      if (polskiItem) {
        await user.click(polskiItem)
      }

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/preferences')
    })

    it('renders without pathname', () => {
      mockUsePathname.mockReturnValue('')

      expect(() => render(<LocaleSwitcher locale="pl" />)).not.toThrow()
    })
  })
})
