import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { AdminSidebar } from '../admin-sidebar'
import * as navigation from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof navigation>('next/navigation')
  return {
    ...actual,
    usePathname: vi.fn(() => '/pl/admin'),
  }
})

const mockUsePathname = vi.mocked(navigation.usePathname)

describe('AdminSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to dashboard path
    mockUsePathname.mockReturnValue('/pl/admin')
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders the admin sidebar with title', () => {
      render(<AdminSidebar locale="pl" />)

      expect(screen.getByText('admin.title')).toBeInTheDocument()
    })

    it('renders all 5 navigation menu items', () => {
      render(<AdminSidebar locale="pl" />)

      // Check all menu items are present
      expect(screen.getByRole('link', { name: /admin\.nav\.dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /admin\.nav\.companies/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /admin\.nav\.categories/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /admin\.nav\.users/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /admin\.nav\.audit/i })).toBeInTheDocument()
    })

    it('renders with correct semantic HTML structure', () => {
      render(<AdminSidebar locale="pl" />)

      const aside = screen.getByRole('complementary')
      expect(aside).toBeInTheDocument()
      expect(aside.tagName).toBe('ASIDE')
    })

    it('renders icons for each menu item', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      // Each link should have an icon (lucide-react icons have h-5 w-5 class)
      const icons = container.querySelectorAll('.lucide')
      expect(icons).toHaveLength(5)
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe('Props', () => {
    it('constructs correct hrefs with provided locale (pl)', () => {
      render(<AdminSidebar locale="pl" />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/pl/admin')
      expect(screen.getByRole('link', { name: /companies/i })).toHaveAttribute('href', '/pl/admin/companies')
      expect(screen.getByRole('link', { name: /categories/i })).toHaveAttribute('href', '/pl/admin/categories')
    })

    it('constructs correct hrefs with provided locale (en)', () => {
      render(<AdminSidebar locale="en" />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/en/admin')
      expect(screen.getByRole('link', { name: /companies/i })).toHaveAttribute('href', '/en/admin/companies')
    })

    it('constructs correct hrefs with provided locale (de)', () => {
      render(<AdminSidebar locale="de" />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/de/admin')
      expect(screen.getByRole('link', { name: /users/i })).toHaveAttribute('href', '/de/admin/users')
    })

    it('constructs correct hrefs with provided locale (es)', () => {
      render(<AdminSidebar locale="es" />)

      expect(screen.getByRole('link', { name: /audit/i })).toHaveAttribute('href', '/es/admin/audit')
    })

    it('constructs correct hrefs with provided locale (ru)', () => {
      render(<AdminSidebar locale="ru" />)

      expect(screen.getByRole('link', { name: /categories/i })).toHaveAttribute('href', '/ru/admin/categories')
    })
  })

  // ===========================================================================
  // VARIANTS/STATES - Active Link Highlighting
  // ===========================================================================

  describe('Active Link Highlighting', () => {
    it('highlights dashboard link when on dashboard page', () => {
      mockUsePathname.mockReturnValue('/pl/admin')
      render(<AdminSidebar locale="pl" />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('highlights companies link when on companies page', () => {
      mockUsePathname.mockReturnValue('/pl/admin/companies')
      render(<AdminSidebar locale="pl" />)

      const companiesLink = screen.getByRole('link', { name: /companies/i })
      expect(companiesLink).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('highlights categories link when on categories page', () => {
      mockUsePathname.mockReturnValue('/pl/admin/categories')
      render(<AdminSidebar locale="pl" />)

      const categoriesLink = screen.getByRole('link', { name: /categories/i })
      expect(categoriesLink).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('highlights users link when on users page', () => {
      mockUsePathname.mockReturnValue('/pl/admin/users')
      render(<AdminSidebar locale="pl" />)

      const usersLink = screen.getByRole('link', { name: /users/i })
      expect(usersLink).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('highlights audit link when on audit page', () => {
      mockUsePathname.mockReturnValue('/pl/admin/audit')
      render(<AdminSidebar locale="pl" />)

      const auditLink = screen.getByRole('link', { name: /audit/i })
      expect(auditLink).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('does not highlight inactive links', () => {
      mockUsePathname.mockReturnValue('/pl/admin/companies')
      render(<AdminSidebar locale="pl" />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).not.toHaveClass('bg-primary', 'text-primary-foreground')
      expect(dashboardLink).toHaveClass('text-muted-foreground', 'hover:bg-accent')
    })

    it('only highlights exact path matches', () => {
      mockUsePathname.mockReturnValue('/pl/admin/companies/123')
      render(<AdminSidebar locale="pl" />)

      // No link should be highlighted since path doesn't exactly match
      const companiesLink = screen.getByRole('link', { name: /companies/i })
      expect(companiesLink).not.toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('navigation links are clickable', async () => {
      const { user } = render(<AdminSidebar locale="pl" />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })

      // Should be focusable and clickable
      await user.click(dashboardLink)

      // Link should have correct href
      expect(dashboardLink).toHaveAttribute('href', '/pl/admin')
    })

    it('all menu items are clickable', async () => {
      const { user } = render(<AdminSidebar locale="pl" />)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)

      // All links should be clickable
      for (const link of links) {
        await user.click(link)
        expect(link).toHaveAttribute('href')
      }
    })

    it('applies hover styles on hover-capable devices', () => {
      render(<AdminSidebar locale="pl" />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveClass('transition-colors')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('sidebar has proper landmark role', () => {
      render(<AdminSidebar locale="pl" />)

      const aside = screen.getByRole('complementary')
      expect(aside).toBeInTheDocument()
    })

    it('all navigation links are accessible', () => {
      render(<AdminSidebar locale="pl" />)

      const links = screen.getAllByRole('link')

      // All links should be keyboard accessible
      links.forEach(link => {
        expect(link).toBeVisible()
        expect(link).toHaveAttribute('href')
      })
    })

    it('links have meaningful text content', () => {
      render(<AdminSidebar locale="pl" />)

      // All links should have text content
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveTextContent('admin.nav.dashboard')
    })

    it('navigation structure is semantic', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      // Component uses <aside> element for sidebar navigation
      const aside = container.querySelector('aside')
      expect(aside).toBeInTheDocument()

      // Aside should contain all links
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('icons do not interfere with link accessibility', () => {
      render(<AdminSidebar locale="pl" />)

      // Links should still be accessible despite icons
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty locale gracefully', () => {
      render(<AdminSidebar locale="" />)

      // Should still render links with empty locale prefix
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '//admin')
    })

    it('handles missing pathname from usePathname', () => {
      mockUsePathname.mockReturnValue('')
      render(<AdminSidebar locale="pl" />)

      // Should render without errors, no link highlighted
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('handles null pathname from usePathname', () => {
      mockUsePathname.mockReturnValue(null as unknown as string)
      render(<AdminSidebar locale="pl" />)

      // Should render without errors
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('handles pathname with trailing slash', () => {
      mockUsePathname.mockReturnValue('/pl/admin/')
      render(<AdminSidebar locale="pl" />)

      // Dashboard link should not be highlighted (exact match required)
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).not.toHaveClass('bg-primary')
    })

    it('handles pathname with query parameters', () => {
      mockUsePathname.mockReturnValue('/pl/admin?tab=overview')
      render(<AdminSidebar locale="pl" />)

      // Should not match (usePathname returns path without query)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('renders correctly with long locale codes', () => {
      render(<AdminSidebar locale="en-US" />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/en-US/admin')
    })

    it('renders correctly with special characters in locale', () => {
      render(<AdminSidebar locale="zh-CN" />)

      expect(screen.getByRole('link', { name: /companies/i })).toHaveAttribute('href', '/zh-CN/admin/companies')
    })
  })

  // ===========================================================================
  // RESPONSIVE BEHAVIOR
  // ===========================================================================

  describe('Responsive Behavior', () => {
    it('has responsive visibility classes', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      const aside = container.querySelector('aside')
      expect(aside).toHaveClass('hidden', 'md:flex')
    })

    it('hides on mobile screens', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      const aside = container.querySelector('aside')
      expect(aside).toHaveClass('hidden')
    })

    it('shows on tablet and desktop screens', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      const aside = container.querySelector('aside')
      expect(aside).toHaveClass('md:flex')
    })

    it('has fixed width on desktop', () => {
      const { container } = render(<AdminSidebar locale="pl" />)

      const aside = container.querySelector('aside')
      expect(aside).toHaveClass('md:w-64')
    })
  })
})
