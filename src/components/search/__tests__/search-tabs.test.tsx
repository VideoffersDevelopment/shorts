import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { SearchTabs } from '../search-tabs'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockPush = vi.fn()

vi.mock('next/navigation', async () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams('q=test')),
  usePathname: vi.fn(() => '/en/search'),
}))

describe('SearchTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('q=test'))
    vi.mocked(usePathname).mockReturnValue('/en/search')
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders all three tab triggers', () => {
      render(<SearchTabs activeTab="all" />)

      expect(screen.getByRole('tab', { name: 'tabs.all' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'tabs.shorts' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'tabs.companies' })).toBeInTheDocument()
    })

    it('renders with "all" tab active by default', () => {
      render(<SearchTabs activeTab="all" />)

      const allTab = screen.getByRole('tab', { name: 'tabs.all' })
      expect(allTab).toHaveAttribute('data-state', 'active')
    })

    it('renders with "shorts" tab active when specified', () => {
      render(<SearchTabs activeTab="shorts" />)

      const shortsTab = screen.getByRole('tab', { name: 'tabs.shorts' })
      expect(shortsTab).toHaveAttribute('data-state', 'active')
    })

    it('renders with "companies" tab active when specified', () => {
      render(<SearchTabs activeTab="companies" />)

      const companiesTab = screen.getByRole('tab', { name: 'tabs.companies' })
      expect(companiesTab).toHaveAttribute('data-state', 'active')
    })

    it('renders tablist with correct role', () => {
      render(<SearchTabs activeTab="all" />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls router.push with type=shorts when shorts tab clicked', async () => {
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.shorts' }))

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test&type=shorts')
    })

    it('calls router.push with type=companies when companies tab clicked', async () => {
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.companies' }))

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test&type=companies')
    })

    it('removes type param when all tab clicked', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('q=test&type=shorts'))
      const { user } = render(<SearchTabs activeTab="shorts" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.all' }))

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test')
    })

    it('preserves existing query params when changing tabs', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('q=test&page=2'))
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.shorts' }))

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test&page=2&type=shorts')
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('tabs remain interactive during navigation', async () => {
      const { user } = render(<SearchTabs activeTab="all" />)

      const shortsTab = screen.getByRole('tab', { name: 'tabs.shorts' })

      // Should be clickable
      await user.click(shortsTab)

      expect(mockPush).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('handles empty search params gracefully', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams())
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.shorts' }))

      expect(mockPush).toHaveBeenCalledWith('/en/search?type=shorts')
    })

    it('handles pathname with different locale', async () => {
      vi.mocked(usePathname).mockReturnValue('/pl/search')
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('q=szukaj'))
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.companies' }))

      expect(mockPush).toHaveBeenCalledWith('/pl/search?q=szukaj&type=companies')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('clicking different tab triggers navigation', async () => {
      const { user } = render(<SearchTabs activeTab="shorts" />)

      // Click a different tab (all) to trigger navigation
      await user.click(screen.getByRole('tab', { name: 'tabs.all' }))

      // Radix Tabs doesn't re-trigger onValueChange for already active tab
      // but clicking different tab should work
      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test')
    })

    it('handles special characters in query param', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('q=test%20search'))
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.click(screen.getByRole('tab', { name: 'tabs.shorts' }))

      // URLSearchParams will decode the value
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('type=shorts'))
    })

    it('renders correctly with each activeTab value', () => {
      const tabs: Array<'all' | 'shorts' | 'companies'> = ['all', 'shorts', 'companies']

      tabs.forEach((tab) => {
        const { unmount } = render(<SearchTabs activeTab={tab} />)

        const activeTab = screen.getByRole('tab', { name: `tabs.${tab}` })
        expect(activeTab).toHaveAttribute('data-state', 'active')

        unmount()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper tab roles', () => {
      render(<SearchTabs activeTab="all" />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
    })

    it('active tab has aria-selected=true', () => {
      render(<SearchTabs activeTab="shorts" />)

      const shortsTab = screen.getByRole('tab', { name: 'tabs.shorts' })
      expect(shortsTab).toHaveAttribute('aria-selected', 'true')
    })

    it('inactive tabs have aria-selected=false', () => {
      render(<SearchTabs activeTab="shorts" />)

      const allTab = screen.getByRole('tab', { name: 'tabs.all' })
      const companiesTab = screen.getByRole('tab', { name: 'tabs.companies' })

      expect(allTab).toHaveAttribute('aria-selected', 'false')
      expect(companiesTab).toHaveAttribute('aria-selected', 'false')
    })

    it('tabs are keyboard focusable', async () => {
      const { user } = render(<SearchTabs activeTab="all" />)

      await user.tab()

      // First tab should receive focus
      expect(screen.getByRole('tab', { name: 'tabs.all' })).toHaveFocus()
    })

    it('arrow keys navigate between tabs', async () => {
      const { user } = render(<SearchTabs activeTab="all" />)

      const allTab = screen.getByRole('tab', { name: 'tabs.all' })
      allTab.focus()

      await user.keyboard('{ArrowRight}')

      // Focus should move to next tab
      expect(screen.getByRole('tab', { name: 'tabs.shorts' })).toHaveFocus()
    })
  })
})
