import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { ActiveFiltersBar } from '../active-filters-bar'
import type { FeedFilters } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

describe('ActiveFiltersBar', () => {
  const emptyFilters: FeedFilters = {
    sort: 'algorithmic',
    categoryIds: undefined,
    tags: undefined,
    lat: undefined,
    lng: undefined,
    radius: undefined,
    verifiedOnly: false,
  }

  const defaultProps = {
    filters: emptyFilters,
    onRemoveFilter: vi.fn(),
    onClearAll: vi.fn(),
    categoryNames: {} as Record<string, string>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING - NO FILTERS
  // ===========================================================================

  describe('Rendering - No Filters', () => {
    it('returns null when no active filters', () => {
      const { container } = render(<ActiveFiltersBar {...defaultProps} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when only sort is set', () => {
      const { container } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, sort: 'newest' }}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  // ===========================================================================
  // RENDERING - WITH FILTERS
  // ===========================================================================

  describe('Rendering - With Filters', () => {
    it('renders location filter badge', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, lat: 52.2297, lng: 21.0122, radius: 25 }}
        />
      )

      expect(screen.getByText('25 km')).toBeInTheDocument()
    })

    it('renders location filter without radius showing whole country', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, lat: 52.2297, lng: 21.0122 }}
        />
      )

      expect(
        screen.getByText('filters.location.wholeCountry')
      ).toBeInTheDocument()
    })

    it('renders category filter badges', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds: ['cat-1', 'cat-2'] }}
          categoryNames={{ 'cat-1': 'Technology', 'cat-2': 'Design' }}
        />
      )

      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('Design')).toBeInTheDocument()
    })

    it('renders category ID when name not provided', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds: ['cat-unknown'] }}
        />
      )

      expect(screen.getByText('cat-unknown')).toBeInTheDocument()
    })

    it('renders tag filter badges with hash prefix', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, tags: ['react', 'nextjs'] }}
        />
      )

      expect(screen.getByText('#react')).toBeInTheDocument()
      expect(screen.getByText('#nextjs')).toBeInTheDocument()
    })

    it('renders verified filter badge', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
        />
      )

      expect(
        screen.getByText('filters.verifiedOnly.label')
      ).toBeInTheDocument()
    })

    it('renders clear all button', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
        />
      )

      expect(
        screen.getByRole('button', { name: 'filters.clear' })
      ).toBeInTheDocument()
    })

    it('renders multiple filter types together', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{
            ...emptyFilters,
            lat: 52.2297,
            lng: 21.0122,
            radius: 10,
            categoryIds: ['cat-1'],
            tags: ['react'],
            verifiedOnly: true,
          }}
          categoryNames={{ 'cat-1': 'Tech' }}
        />
      )

      expect(screen.getByText('10 km')).toBeInTheDocument()
      expect(screen.getByText('Tech')).toBeInTheDocument()
      expect(screen.getByText('#react')).toBeInTheDocument()
      expect(screen.getByText('filters.verifiedOnly.label')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onRemoveFilter when clicking remove on location', async () => {
      const onRemoveFilter = vi.fn()
      const { user } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, lat: 52.2297, lng: 21.0122, radius: 25 }}
          onRemoveFilter={onRemoveFilter}
        />
      )

      const locationBadge = screen.getByText('25 km').closest('div')
      const removeButton = locationBadge?.querySelector('button')

      await user.click(removeButton!)

      expect(onRemoveFilter).toHaveBeenCalledWith('lat')
    })

    it('calls onRemoveFilter when clicking remove on category', async () => {
      const onRemoveFilter = vi.fn()
      const { user } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds: ['cat-1'] }}
          categoryNames={{ 'cat-1': 'Technology' }}
          onRemoveFilter={onRemoveFilter}
        />
      )

      const categoryBadge = screen.getByText('Technology').closest('div')
      const removeButton = categoryBadge?.querySelector('button')

      await user.click(removeButton!)

      expect(onRemoveFilter).toHaveBeenCalledWith('categoryIds', 'cat-1')
    })

    it('calls onRemoveFilter when clicking remove on tag', async () => {
      const onRemoveFilter = vi.fn()
      const { user } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, tags: ['react'] }}
          onRemoveFilter={onRemoveFilter}
        />
      )

      const tagBadge = screen.getByText('#react').closest('div')
      const removeButton = tagBadge?.querySelector('button')

      await user.click(removeButton!)

      expect(onRemoveFilter).toHaveBeenCalledWith('tags', 'react')
    })

    it('calls onRemoveFilter when clicking remove on verified', async () => {
      const onRemoveFilter = vi.fn()
      const { user } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
          onRemoveFilter={onRemoveFilter}
        />
      )

      const verifiedBadge = screen
        .getByText('filters.verifiedOnly.label')
        .closest('div')
      const removeButton = verifiedBadge?.querySelector('button')

      await user.click(removeButton!)

      expect(onRemoveFilter).toHaveBeenCalledWith('verifiedOnly')
    })

    it('calls onClearAll when clicking clear button', async () => {
      const onClearAll = vi.fn()
      const { user } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
          onClearAll={onClearAll}
        />
      )

      await user.click(screen.getByRole('button', { name: 'filters.clear' }))

      expect(onClearAll).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty categoryIds array', () => {
      const { container } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds: [] }}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('handles empty tags array', () => {
      const { container } = render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, tags: [] }}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('handles many categories', () => {
      const categoryIds = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5']
      const categoryNames = {
        'cat-1': 'One',
        'cat-2': 'Two',
        'cat-3': 'Three',
        'cat-4': 'Four',
        'cat-5': 'Five',
      }

      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds }}
          categoryNames={categoryNames}
        />
      )

      categoryIds.forEach((id) => {
        expect(screen.getByText(categoryNames[id as keyof typeof categoryNames])).toBeInTheDocument()
      })
    })

    it('handles many tags', () => {
      const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']

      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, tags }}
        />
      )

      tags.forEach((tag) => {
        expect(screen.getByText(`#${tag}`)).toBeInTheDocument()
      })
    })

    it('handles undefined categoryNames prop', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, categoryIds: ['cat-1'] }}
          categoryNames={undefined}
        />
      )

      // Should show category ID when no name provided
      expect(screen.getByText('cat-1')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('remove buttons are keyboard accessible', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
        />
      )

      const removeButtons = screen.getAllByRole('button')
      removeButtons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })

    it('clear all button has text content', () => {
      render(
        <ActiveFiltersBar
          {...defaultProps}
          filters={{ ...emptyFilters, verifiedOnly: true }}
        />
      )

      expect(
        screen.getByRole('button', { name: 'filters.clear' })
      ).toBeInTheDocument()
    })
  })
})
