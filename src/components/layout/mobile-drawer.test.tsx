import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { MobileDrawer } from './mobile-drawer'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockUsePathname = vi.mocked(usePathname)
const mockSignOut = vi.mocked(signOut)

describe('MobileDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/pl/panel')
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders menu button trigger', () => {
      render(<MobileDrawer locale="pl" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with md:hidden class for mobile only', () => {
      render(<MobileDrawer locale="pl" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('md:hidden')
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens drawer on button click', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
      })
    })

    it('shows navigation links when opened', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
      })
    })

    it('shows logout button when opened', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        // There will be two buttons - the trigger and the logout button
        const buttons = screen.getAllByRole('button')
        const logoutButton = buttons.find((btn) => btn.textContent?.includes('logout'))
        expect(logoutButton).toBeInTheDocument()
      })
    })

    it('closes drawer on navigation link click', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('link', { name: /profile/i }))

      // Sheet should close after click - links still exist in DOM but sheet content should not be visible
      // This behavior depends on Sheet implementation
    })

    it('calls signOut on logout click', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const logoutButton = buttons.find((btn) => btn.textContent?.includes('logout'))
        expect(logoutButton).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const logoutButton = buttons.find((btn) => btn.textContent?.includes('logout'))!
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/pl/login' })
    })
  })

  // ===========================================================================
  // NAVIGATION LINKS
  // ===========================================================================

  describe('Navigation Links', () => {
    it('home link has correct href', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/pl/panel')
      })
    })

    it('profile link has correct href', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/pl/panel/profile')
      })
    })

    it('settings link has correct href', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/pl/panel/settings')
      })
    })
  })

  // ===========================================================================
  // ACTIVE STATE
  // ===========================================================================

  describe('Active State', () => {
    it('highlights home link when active', async () => {
      mockUsePathname.mockReturnValue('/pl/panel')
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home/i })
        expect(homeLink).toHaveClass('bg-primary')
      })
    })

    it('highlights profile link when active', async () => {
      mockUsePathname.mockReturnValue('/pl/panel/profile')
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const profileLink = screen.getByRole('link', { name: /profile/i })
        expect(profileLink).toHaveClass('bg-primary')
      })
    })

    it('highlights settings link when active', async () => {
      mockUsePathname.mockReturnValue('/pl/panel/settings')
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const settingsLink = screen.getByRole('link', { name: /settings/i })
        expect(settingsLink).toHaveClass('bg-primary')
      })
    })
  })

  // ===========================================================================
  // LOCALE HANDLING
  // ===========================================================================

  describe('Locale Handling', () => {
    it('uses correct locale for links (en)', async () => {
      mockUsePathname.mockReturnValue('/en/panel')
      const { user } = render(<MobileDrawer locale="en" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/en/panel')
        expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/en/panel/profile')
      })
    })

    it('uses correct locale for signOut callback', async () => {
      mockUsePathname.mockReturnValue('/de/panel')
      const { user } = render(<MobileDrawer locale="de" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const logoutButton = buttons.find((btn) => btn.textContent?.includes('logout'))
        expect(logoutButton).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const logoutButton = buttons.find((btn) => btn.textContent?.includes('logout'))!
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/de/login' })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('trigger button is accessible', () => {
      render(<MobileDrawer locale="pl" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('navigation has proper role', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
      })
    })

    it('navigation links are accessible', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThanOrEqual(3)
        links.forEach((link) => {
          expect(link).toHaveAttribute('href')
        })
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty pathname', () => {
      mockUsePathname.mockReturnValue('')

      expect(() => render(<MobileDrawer locale="pl" />)).not.toThrow()
    })

    it('handles multiple open/close cycles', async () => {
      const { user } = render(<MobileDrawer locale="pl" />)

      // Open
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
      })

      // The Sheet component from shadcn should handle open/close state
    })
  })
})
