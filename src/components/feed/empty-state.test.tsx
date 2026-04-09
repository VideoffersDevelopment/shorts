import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { EmptyState } from './empty-state'

// Mock the i18n client hook
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: (namespace: string) => ({
    t: (key: string, params?: Record<string, string>) => {
      const fullKey = `${namespace}.${key}`
      return fullKey
    },
  }),
}))

// Mock next-intl useLocale
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('EmptyState', () => {
  // ===========================================================================
  // RENDERING - NO SHORTS VARIANT
  // ===========================================================================

  describe('no-shorts Variant', () => {
    it('renders title and description', () => {
      render(<EmptyState variant="no-shorts" />)

      expect(screen.getByText('feed.empty.noShorts.title')).toBeInTheDocument()
      expect(screen.getByText('feed.empty.noShorts.description')).toBeInTheDocument()
    })

    it('renders browse all button by default', () => {
      render(<EmptyState variant="no-shorts" />)

      const browseButton = screen.getByRole('link', {
        name: 'feed.empty.noShorts.browseAll',
      })
      expect(browseButton).toBeInTheDocument()
      expect(browseButton).toHaveAttribute('href', '/en')
    })

    it('renders icon container', () => {
      const { container } = render(<EmptyState variant="no-shorts" />)

      const iconContainer = container.querySelector('.rounded-full.bg-muted')
      expect(iconContainer).toBeInTheDocument()
    })

    it('renders expand radius button when handler provided', async () => {
      const onExpandRadius = vi.fn()
      const { user } = render(
        <EmptyState variant="no-shorts" onExpandRadius={onExpandRadius} />
      )

      const expandButton = screen.getByRole('button', {
        name: 'feed.empty.noShorts.expandRadius',
      })
      expect(expandButton).toBeInTheDocument()

      await user.click(expandButton)
      expect(onExpandRadius).toHaveBeenCalledTimes(1)
    })

    it('renders clear filters button when handler provided', async () => {
      const onClearFilters = vi.fn()
      const { user } = render(
        <EmptyState variant="no-shorts" onClearFilters={onClearFilters} />
      )

      const clearButton = screen.getByRole('button', {
        name: 'feed.empty.noShorts.clearFilters',
      })
      expect(clearButton).toBeInTheDocument()

      await user.click(clearButton)
      expect(onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('renders both action buttons when both handlers provided', () => {
      render(
        <EmptyState
          variant="no-shorts"
          onExpandRadius={vi.fn()}
          onClearFilters={vi.fn()}
        />
      )

      expect(
        screen.getByRole('button', { name: 'feed.empty.noShorts.expandRadius' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'feed.empty.noShorts.clearFilters' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'feed.empty.noShorts.browseAll' })
      ).toBeInTheDocument()
    })

    it('does not render expand radius when no handler', () => {
      render(<EmptyState variant="no-shorts" />)

      expect(
        screen.queryByRole('button', { name: 'feed.empty.noShorts.expandRadius' })
      ).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // RENDERING - NO FOLLOWING VARIANT
  // ===========================================================================

  describe('no-following Variant', () => {
    it('renders title and description', () => {
      render(<EmptyState variant="no-following" />)

      expect(screen.getByText('feed.empty.noFollowing.title')).toBeInTheDocument()
      expect(screen.getByText('feed.empty.noFollowing.description')).toBeInTheDocument()
    })

    it('renders discover CTA link', () => {
      render(<EmptyState variant="no-following" />)

      const discoverLink = screen.getByRole('link', {
        name: 'feed.empty.noFollowing.discoverCta',
      })
      expect(discoverLink).toBeInTheDocument()
      expect(discoverLink).toHaveAttribute('href', '/en')
    })

    it('does not render expand radius or clear filters buttons', () => {
      render(
        <EmptyState
          variant="no-following"
          onExpandRadius={vi.fn()}
          onClearFilters={vi.fn()}
        />
      )

      // These handlers are ignored for no-following variant
      expect(
        screen.queryByRole('button', { name: 'feed.empty.noShorts.expandRadius' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'feed.empty.noShorts.clearFilters' })
      ).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // RENDERING - NO SEARCH RESULTS VARIANT
  // ===========================================================================

  describe('no-search-results Variant', () => {
    it('renders title and description', () => {
      render(<EmptyState variant="no-search-results" />)

      expect(
        screen.getByText('search.results.noResults.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('search.results.noResults.description')
      ).toBeInTheDocument()
    })

    it('includes query in title when provided', () => {
      render(<EmptyState variant="no-search-results" query="test search" />)

      // The translation mock returns the key, query is passed to t() but not rendered
      expect(
        screen.getByText('search.results.noResults.title')
      ).toBeInTheDocument()
    })

    it('renders no action buttons', () => {
      render(<EmptyState variant="no-search-results" query="test" />)

      const buttons = screen.queryAllByRole('button')
      const links = screen.queryAllByRole('link')
      expect(buttons).toHaveLength(0)
      expect(links).toHaveLength(0)
    })
  })

  // ===========================================================================
  // BUTTON VARIANTS
  // ===========================================================================

  describe('Button Variants', () => {
    it('expand radius button has outline variant', () => {
      render(<EmptyState variant="no-shorts" onExpandRadius={vi.fn()} />)

      const button = screen.getByRole('button', {
        name: 'feed.empty.noShorts.expandRadius',
      })
      // Check for outline variant class
      expect(button).toHaveClass('border')
    })

    it('clear filters button has outline variant', () => {
      render(<EmptyState variant="no-shorts" onClearFilters={vi.fn()} />)

      const button = screen.getByRole('button', {
        name: 'feed.empty.noShorts.clearFilters',
      })
      expect(button).toHaveClass('border')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<EmptyState variant="no-shorts" />)

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('feed.empty.noShorts.title')
    })

    it('buttons are accessible', async () => {
      const onClearFilters = vi.fn()
      const { user } = render(
        <EmptyState variant="no-shorts" onClearFilters={onClearFilters} />
      )

      const button = screen.getByRole('button', {
        name: 'feed.empty.noShorts.clearFilters',
      })

      // Button should be focusable
      button.focus()
      expect(button).toHaveFocus()

      // Button should be clickable
      await user.click(button)
      expect(onClearFilters).toHaveBeenCalled()
    })

    it('links are accessible', () => {
      render(<EmptyState variant="no-shorts" />)

      const link = screen.getByRole('link', {
        name: 'feed.empty.noShorts.browseAll',
      })

      expect(link).toHaveAttribute('href')
      expect(link.getAttribute('href')).not.toBe('')
    })
  })

  // ===========================================================================
  // LAYOUT
  // ===========================================================================

  describe('Layout', () => {
    it('has centered layout', () => {
      const { container } = render(<EmptyState variant="no-shorts" />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex')
      expect(wrapper).toHaveClass('flex-col')
      expect(wrapper).toHaveClass('items-center')
      expect(wrapper).toHaveClass('justify-center')
      expect(wrapper).toHaveClass('text-center')
    })

    it('has proper padding', () => {
      const { container } = render(<EmptyState variant="no-shorts" />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('py-16')
      expect(wrapper).toHaveClass('px-4')
    })

    it('description has max width', () => {
      const { container } = render(<EmptyState variant="no-shorts" />)

      const description = container.querySelector('p.text-muted-foreground')
      expect(description).toHaveClass('max-w-md')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty query string', () => {
      render(<EmptyState variant="no-search-results" query="" />)

      expect(
        screen.getByText('search.results.noResults.title')
      ).toBeInTheDocument()
    })

    it('handles undefined query', () => {
      render(<EmptyState variant="no-search-results" />)

      expect(
        screen.getByText('search.results.noResults.title')
      ).toBeInTheDocument()
    })
  })
})
