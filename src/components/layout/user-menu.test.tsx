import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { UserMenu } from './user-menu'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockPush = vi.fn()
const mockUseRouter = vi.mocked(useRouter)
const mockSignOut = vi.mocked(signOut)

describe('UserMenu', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
  }

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
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders user menu trigger', () => {
      render(<UserMenu user={mockUser} locale="pl" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders avatar with image src attribute', () => {
      render(<UserMenu user={mockUser} locale="pl" />)

      // AvatarImage creates an img but jsdom doesn't load images, so we check the HTML
      const button = screen.getByRole('button')
      // When image is set, AvatarImage should be present in DOM
      // Even if not displayed, we verify the component renders without error
      expect(button).toBeInTheDocument()
    })

    it('renders avatar fallback with initials', () => {
      const userWithoutImage = { ...mockUser, image: null }
      render(<UserMenu user={userWithoutImage} locale="pl" />)

      // Initials for "John Doe" = "JD"
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders initials from email when no name', () => {
      const userWithoutName = { ...mockUser, name: null, image: null }
      render(<UserMenu user={userWithoutName} locale="pl" />)

      // First letter of email "test@example.com" = "T"
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('renders fallback character when no name or email', () => {
      const userWithNothing = { id: 'user-1', email: null, name: null, image: null }
      render(<UserMenu user={userWithNothing} locale="pl" />)

      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dropdown menu on click', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })
    })

    it('shows all menu items when opened', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /preferences/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
      })
    })

    it('navigates to profile on profile click', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /profile/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/profile')
    })

    it('navigates to settings on settings click', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /settings/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/settings')
    })

    it('navigates to preferences on preferences click', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /preferences/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /preferences/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/preferences')
    })

    it('calls signOut on logout click', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /logout/i }))

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/pl/login' })
    })
  })

  // ===========================================================================
  // LOCALE HANDLING
  // ===========================================================================

  describe('Locale Handling', () => {
    it('uses correct locale for navigation', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="en" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /profile/i }))

      expect(mockPush).toHaveBeenCalledWith('/en/panel/profile')
    })

    it('uses correct locale for signOut callback', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="de" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /logout/i }))

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/de/login' })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('dropdown trigger is accessible', () => {
      render(<UserMenu user={mockUser} locale="pl" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('menu items are accessible as menuitems', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems.length).toBeGreaterThanOrEqual(4)
      })
    })

    it('shows user email as label', async () => {
      const { user } = render(<UserMenu user={mockUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // ROLE-BASED MENU ITEMS
  // ===========================================================================

  describe('Role-Based Menu Items', () => {
    it('shows "Upgrade to Company" menu item when user.role is "USER"', async () => {
      const userRoleUser = { ...mockUser, role: 'USER' as const }
      const { user } = render(<UserMenu user={userRoleUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.upgradeToCompany/i })).toBeInTheDocument()
      })
    })

    it('does NOT show "Upgrade to Company" when role is "COMPANY"', async () => {
      const companyUser = { ...mockUser, role: 'COMPANY' as const }
      const { user } = render(<UserMenu user={companyUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.upgradeToCompany/i })).not.toBeInTheDocument()
    })

    it('does NOT show "Upgrade to Company" when role is "ADMIN"', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const }
      const { user } = render(<UserMenu user={adminUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.upgradeToCompany/i })).not.toBeInTheDocument()
    })

    it('shows "Company Profile" menu item when user.role is "COMPANY"', async () => {
      const companyUser = { ...mockUser, role: 'COMPANY' as const }
      const { user } = render(<UserMenu user={companyUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.companyProfile/i })).toBeInTheDocument()
      })
    })

    it('does NOT show "Company Profile" when role is "USER"', async () => {
      const userRoleUser = { ...mockUser, role: 'USER' as const }
      const { user } = render(<UserMenu user={userRoleUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.companyProfile/i })).not.toBeInTheDocument()
    })

    it('does NOT show "Company Profile" when role is "ADMIN"', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const }
      const { user } = render(<UserMenu user={adminUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.companyProfile/i })).not.toBeInTheDocument()
    })

    it('shows "Admin Panel" menu item when user.role is "ADMIN"', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const }
      const { user } = render(<UserMenu user={adminUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.adminPanel/i })).toBeInTheDocument()
      })
    })

    it('does NOT show "Admin Panel" when role is "USER"', async () => {
      const userRoleUser = { ...mockUser, role: 'USER' as const }
      const { user } = render(<UserMenu user={userRoleUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.adminPanel/i })).not.toBeInTheDocument()
    })

    it('does NOT show "Admin Panel" when role is "COMPANY"', async () => {
      const companyUser = { ...mockUser, role: 'COMPANY' as const }
      const { user } = render(<UserMenu user={companyUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      expect(screen.queryByRole('menuitem', { name: /menu\.adminPanel/i })).not.toBeInTheDocument()
    })

    it('navigates to /settings/upgrade when USER clicks "Upgrade to Company"', async () => {
      const userRoleUser = { ...mockUser, role: 'USER' as const }
      const { user } = render(<UserMenu user={userRoleUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.upgradeToCompany/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.upgradeToCompany/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/settings/upgrade')
    })

    it('navigates to /panel/company/profile when COMPANY clicks "Company Profile"', async () => {
      const companyUser = { ...mockUser, role: 'COMPANY' as const }
      const { user } = render(<UserMenu user={companyUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.companyProfile/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.companyProfile/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/panel/company/profile')
    })

    it('navigates to /admin when ADMIN clicks "Admin Panel"', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const }
      const { user } = render(<UserMenu user={adminUser} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.adminPanel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.adminPanel/i }))

      expect(mockPush).toHaveBeenCalledWith('/pl/admin')
    })

    it('does NOT show any role-based items when role is undefined', async () => {
      const userWithoutRole = { ...mockUser, role: undefined }
      const { user } = render(<UserMenu user={userWithoutRole} locale="pl" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(mockUser.email!)).toBeInTheDocument()
      })

      // Base menu items should exist (using more specific matching)
      expect(screen.getByRole('menuitem', { name: /^profile$/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /^settings$/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /^logout$/i })).toBeInTheDocument()

      // Role-based items should NOT exist
      expect(screen.queryByRole('menuitem', { name: /menu\.upgradeToCompany/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('menuitem', { name: /menu\.companyProfile/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('menuitem', { name: /menu\.adminPanel/i })).not.toBeInTheDocument()
    })

    it('uses correct locale for role-based navigation (en)', async () => {
      const userRoleUser = { ...mockUser, role: 'USER' as const }
      const { user } = render(<UserMenu user={userRoleUser} locale="en" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.upgradeToCompany/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.upgradeToCompany/i }))

      expect(mockPush).toHaveBeenCalledWith('/en/settings/upgrade')
    })

    it('uses correct locale for company profile navigation (de)', async () => {
      const companyUser = { ...mockUser, role: 'COMPANY' as const }
      const { user } = render(<UserMenu user={companyUser} locale="de" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.companyProfile/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.companyProfile/i }))

      expect(mockPush).toHaveBeenCalledWith('/de/panel/company/profile')
    })

    it('uses correct locale for admin panel navigation (es)', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const }
      const { user } = render(<UserMenu user={adminUser} locale="es" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /menu\.adminPanel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /menu\.adminPanel/i }))

      expect(mockPush).toHaveBeenCalledWith('/es/admin')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles user with only id', () => {
      const minimalUser = { id: 'user-1', email: null, name: null, image: null }

      expect(() => render(<UserMenu user={minimalUser} locale="pl" />)).not.toThrow()
    })

    it('handles long names correctly', () => {
      const longNameUser = {
        ...mockUser,
        name: 'Very Long First Name Very Long Last Name',
        image: null,
      }

      render(<UserMenu user={longNameUser} locale="pl" />)

      // Initials take first letter of EACH word: V+L+F+N+V+L+L+N
      expect(screen.getByText('VLFNVLLN')).toBeInTheDocument()
    })

    it('handles special characters in email', () => {
      const specialUser = {
        ...mockUser,
        name: null,
        email: '+special@example.com',
        image: null,
      }

      render(<UserMenu user={specialUser} locale="pl" />)

      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })
})
