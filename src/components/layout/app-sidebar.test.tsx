import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { AppSidebar } from './app-sidebar'
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

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/pl/panel')
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders sidebar navigation', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('renders all navigation links', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
    })

    it('renders logout button', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })

    it('renders with correct locale in links', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/pl/panel')
      expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/pl/panel/profile')
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/pl/panel/settings')
    })

    it('renders with English locale', () => {
      mockUsePathname.mockReturnValue('/en/panel')
      render(<AppSidebar locale="en" />)

      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/en/panel')
      expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/en/panel/profile')
    })
  })

  // ===========================================================================
  // ACTIVE STATE
  // ===========================================================================

  describe('Active State', () => {
    it('highlights home link when on home route', () => {
      mockUsePathname.mockReturnValue('/pl/panel')
      render(<AppSidebar locale="pl" />)

      const homeLink = screen.getByRole('link', { name: /home/i })
      expect(homeLink).toHaveClass('bg-primary')
    })

    it('highlights profile link when on profile route', () => {
      mockUsePathname.mockReturnValue('/pl/panel/profile')
      render(<AppSidebar locale="pl" />)

      const profileLink = screen.getByRole('link', { name: /profile/i })
      expect(profileLink).toHaveClass('bg-primary')
    })

    it('highlights settings link when on settings route', () => {
      mockUsePathname.mockReturnValue('/pl/panel/settings')
      render(<AppSidebar locale="pl" />)

      const settingsLink = screen.getByRole('link', { name: /settings/i })
      expect(settingsLink).toHaveClass('bg-primary')
    })

    it('does not highlight inactive links', () => {
      mockUsePathname.mockReturnValue('/pl/panel')
      render(<AppSidebar locale="pl" />)

      const profileLink = screen.getByRole('link', { name: /profile/i })
      const settingsLink = screen.getByRole('link', { name: /settings/i })

      expect(profileLink).not.toHaveClass('bg-primary')
      expect(settingsLink).not.toHaveClass('bg-primary')
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls signOut when logout button clicked', async () => {
      const { user } = render(<AppSidebar locale="pl" />)

      await user.click(screen.getByRole('button', { name: /logout/i }))

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/pl/login' })
    })

    it('calls signOut with English locale callback', async () => {
      mockUsePathname.mockReturnValue('/en/panel')
      const { user } = render(<AppSidebar locale="en" />)

      await user.click(screen.getByRole('button', { name: /logout/i }))

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/en/login' })
    })
  })

  // ===========================================================================
  // TRANSLATIONS
  // ===========================================================================

  describe('Translations', () => {
    it('uses sidebar namespace for translations', () => {
      render(<AppSidebar locale="pl" />)

      // Translation keys are returned by mock
      expect(screen.getByText('home')).toBeInTheDocument()
      expect(screen.getByText('profile')).toBeInTheDocument()
      expect(screen.getByText('settings')).toBeInTheDocument()
      expect(screen.getByText('logout')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('sidebar has complementary role', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('navigation links are keyboard accessible', () => {
      render(<AppSidebar locale="pl" />)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('logout button is accessible', () => {
      render(<AppSidebar locale="pl" />)

      const button = screen.getByRole('button', { name: /logout/i })
      expect(button).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ROLE-BASED SIDEBAR ITEMS
  // ===========================================================================

  describe('Role-Based Sidebar Items', () => {
    it('shows company profile link when userRole is "COMPANY"', () => {
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      expect(screen.getByRole('link', { name: /company\.profile/i })).toBeInTheDocument()
    })

    it('does NOT show company profile link when userRole is "USER"', () => {
      render(<AppSidebar locale="pl" userRole="USER" />)

      expect(screen.queryByRole('link', { name: /company\.profile/i })).not.toBeInTheDocument()
    })

    it('does NOT show company profile link when userRole is undefined', () => {
      render(<AppSidebar locale="pl" />)

      expect(screen.queryByRole('link', { name: /company\.profile/i })).not.toBeInTheDocument()
    })

    it('shows admin link when userRole is "ADMIN"', () => {
      render(<AppSidebar locale="pl" userRole="ADMIN" />)

      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
    })

    it('does NOT show admin link when userRole is "USER"', () => {
      render(<AppSidebar locale="pl" userRole="USER" />)

      // Base items should exist
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()

      // Admin link should NOT exist
      expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument()
    })

    it('does NOT show admin link when userRole is "COMPANY"', () => {
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      // Company profile should exist
      expect(screen.getByRole('link', { name: /company\.profile/i })).toBeInTheDocument()

      // Admin link should NOT exist
      expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument()
    })

    it('company profile link navigates to correct URL', () => {
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      const companyLink = screen.getByRole('link', { name: /company\.profile/i })

      expect(companyLink).toHaveAttribute('href', '/pl/panel/company/profile')
    })

    it('admin link navigates to correct URL', () => {
      render(<AppSidebar locale="pl" userRole="ADMIN" />)

      const adminLink = screen.getByRole('link', { name: /admin/i })

      expect(adminLink).toHaveAttribute('href', '/pl/admin')
    })

    it('base items (home, profile, settings) are always shown regardless of role', () => {
      const roles: Array<'USER' | 'COMPANY' | 'ADMIN' | undefined> = ['USER', 'COMPANY', 'ADMIN', undefined]

      roles.forEach((role) => {
        const { unmount } = render(<AppSidebar locale="pl" userRole={role} />)

        // All base items should exist (using exact matching to avoid conflicts)
        expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /^profile$/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /^settings$/i })).toBeInTheDocument()

        unmount()
      })
    })

    it('ADMIN role shows admin but NOT company profile', () => {
      render(<AppSidebar locale="pl" userRole="ADMIN" />)

      // Admin link should exist
      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()

      // Company profile should NOT exist
      expect(screen.queryByRole('link', { name: /company\.profile/i })).not.toBeInTheDocument()
    })

    it('COMPANY role shows company profile but NOT admin', () => {
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      // Company profile should exist
      expect(screen.getByRole('link', { name: /company\.profile/i })).toBeInTheDocument()

      // Admin link should NOT exist
      expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument()
    })

    it('uses correct locale for company profile link (en)', () => {
      mockUsePathname.mockReturnValue('/en/panel')
      render(<AppSidebar locale="en" userRole="COMPANY" />)

      const companyLink = screen.getByRole('link', { name: /company\.profile/i })

      expect(companyLink).toHaveAttribute('href', '/en/panel/company/profile')
    })

    it('uses correct locale for admin link (de)', () => {
      mockUsePathname.mockReturnValue('/de/panel')
      render(<AppSidebar locale="de" userRole="ADMIN" />)

      const adminLink = screen.getByRole('link', { name: /admin/i })

      expect(adminLink).toHaveAttribute('href', '/de/admin')
    })

    it('highlights company profile link when active', () => {
      mockUsePathname.mockReturnValue('/pl/panel/company/profile')
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      const companyLink = screen.getByRole('link', { name: /company\.profile/i })

      expect(companyLink).toHaveClass('bg-primary')
    })

    it('highlights admin link when active', () => {
      mockUsePathname.mockReturnValue('/pl/admin')
      render(<AppSidebar locale="pl" userRole="ADMIN" />)

      const adminLink = screen.getByRole('link', { name: /admin/i })

      expect(adminLink).toHaveClass('bg-primary')
    })

    it('does NOT highlight company profile link when inactive', () => {
      mockUsePathname.mockReturnValue('/pl/panel')
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      const companyLink = screen.getByRole('link', { name: /company\.profile/i })

      expect(companyLink).not.toHaveClass('bg-primary')
    })

    it('correct number of links for USER role', () => {
      render(<AppSidebar locale="pl" userRole="USER" />)

      // Should have 3 base links only (home, profile, settings)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
    })

    it('correct number of links for COMPANY role', () => {
      render(<AppSidebar locale="pl" userRole="COMPANY" />)

      // Should have 4 links (base + company profile)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })

    it('correct number of links for ADMIN role', () => {
      render(<AppSidebar locale="pl" userRole="ADMIN" />)

      // Should have 4 links (base + admin)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })

    it('correct number of links when userRole is undefined', () => {
      render(<AppSidebar locale="pl" />)

      // Should have 3 base links only
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty pathname', () => {
      mockUsePathname.mockReturnValue('')

      expect(() => render(<AppSidebar locale="pl" />)).not.toThrow()
    })

    it('handles different locales', () => {
      const locales = ['pl', 'en', 'de', 'es', 'ru']

      locales.forEach((locale) => {
        mockUsePathname.mockReturnValue(`/${locale}/panel`)
        const { unmount } = render(<AppSidebar locale={locale} />)

        expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', `/${locale}/panel`)
        unmount()
      })
    })
  })
})
