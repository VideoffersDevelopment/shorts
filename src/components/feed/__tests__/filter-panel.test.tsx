import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { FilterPanel } from '../filter-panel'
import type { FeedFilters } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => false, // Desktop by default
}))

vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: () => ({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
    detect: vi.fn().mockResolvedValue({ lat: 52.2297, lng: 21.0122 }),
    clear: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

// Mock child components to simplify testing
vi.mock('../location-picker', () => ({
  LocationPicker: ({ onChange }: { onChange: (lat: number | undefined, lng: number | undefined, radius: number | undefined) => void }) => (
    <button
      data-testid="location-picker"
      onClick={() => onChange(52.2297, 21.0122, 25)}
    >
      Location Picker Mock
    </button>
  ),
}))

vi.mock('../category-multi-select', () => ({
  CategoryMultiSelect: ({
    selected,
    onChange,
  }: {
    selected: string[]
    onChange: (ids: string[]) => void
  }) => (
    <button
      data-testid="category-select"
      onClick={() => onChange([...selected, 'cat-1'])}
    >
      Category Select Mock ({selected.length} selected)
    </button>
  ),
}))

vi.mock('../tag-filter', () => ({
  TagFilter: ({
    selected,
    onChange,
  }: {
    selected: string[]
    onChange: (tags: string[]) => void
  }) => (
    <button
      data-testid="tag-filter"
      onClick={() => onChange([...selected, 'tag-1'])}
    >
      Tag Filter Mock ({selected.length} selected)
    </button>
  ),
}))

vi.mock('../verified-toggle', () => ({
  VerifiedToggle: ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <button
      data-testid="verified-toggle"
      onClick={() => onChange(!checked)}
    >
      Verified Toggle Mock ({checked ? 'on' : 'off'})
    </button>
  ),
}))

describe('FilterPanel', () => {
  const defaultFilters: FeedFilters = {
    sort: 'algorithmic',
    categoryIds: undefined,
    tags: undefined,
    lat: undefined,
    lng: undefined,
    radius: undefined,
    verifiedOnly: false,
  }

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    activeFilterCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /filters\.title/i })
      ).toBeInTheDocument()
    })

    it('shows filter count badge when filters active', () => {
      render(<FilterPanel {...defaultProps} activeFilterCount={3} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('does not show badge when no active filters', () => {
      render(<FilterPanel {...defaultProps} activeFilterCount={0} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('renders filter icon', () => {
      render(<FilterPanel {...defaultProps} />)

      // Button should contain the filter icon
      const button = screen.getByRole('button', { name: /filters\.title/i })
      expect(button).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // DESKTOP BEHAVIOR (POPOVER)
  // ===========================================================================

  describe('Desktop Behavior (Popover)', () => {
    it('opens popover on click', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('shows filter content in popover', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByTestId('location-picker')).toBeInTheDocument()
        expect(screen.getByTestId('category-select')).toBeInTheDocument()
        expect(screen.getByTestId('tag-filter')).toBeInTheDocument()
        expect(screen.getByTestId('verified-toggle')).toBeInTheDocument()
      })
    })

    it('shows Apply and Clear buttons', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'filters.apply' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'filters.clear' })
        ).toBeInTheDocument()
      })
    })

    it('closes popover after Apply', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'filters.apply' }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes popover after Clear', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'filters.clear' }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // FILTER OPERATIONS
  // ===========================================================================

  describe('Filter Operations', () => {
    it('calls onFiltersChange when Apply clicked', async () => {
      const onFiltersChange = vi.fn()
      const { user } = render(
        <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
      )

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'filters.apply' }))

      expect(onFiltersChange).toHaveBeenCalled()
    })

    it('calls onFiltersChange with cleared values when Clear clicked', async () => {
      const onFiltersChange = vi.fn()
      const { user } = render(
        <FilterPanel
          {...defaultProps}
          filters={{
            ...defaultFilters,
            categoryIds: ['cat-1'],
            verifiedOnly: true,
          }}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'filters.clear' }))

      expect(onFiltersChange).toHaveBeenCalledWith({
        categoryIds: undefined,
        tags: undefined,
        lat: undefined,
        lng: undefined,
        radius: undefined,
        verifiedOnly: false,
      })
    })

    it('updates local state when changing categories', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('category-select'))

      // Should show updated count
      await waitFor(() => {
        expect(screen.getByText(/1 selected/)).toBeInTheDocument()
      })
    })

    it('updates local state when changing tags', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByTestId('tag-filter')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tag-filter'))

      // Should show updated count
      await waitFor(() => {
        expect(screen.getByText(/1 selected/)).toBeInTheDocument()
      })
    })

    it('updates local state when toggling verified', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByTestId('verified-toggle')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('verified-toggle'))

      // Should show toggled state
      await waitFor(() => {
        const verifiedToggle = screen.getByTestId('verified-toggle')
        expect(verifiedToggle).toHaveTextContent('on')
      })
    })
  })

  // ===========================================================================
  // SECTION LABELS
  // ===========================================================================

  describe('Section Labels', () => {
    it('shows location section label', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByText('filters.location.label')).toBeInTheDocument()
      })
    })

    it('shows categories section label', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByText('filters.categories.label')).toBeInTheDocument()
      })
    })

    it('shows tags section label', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByText('filters.tags.label')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles undefined categoryIds in filters', async () => {
      const { user } = render(
        <FilterPanel
          {...defaultProps}
          filters={{ ...defaultFilters, categoryIds: undefined }}
        />
      )

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        // The mock shows "(0 selected)"
        const categorySelect = screen.getByTestId('category-select')
        expect(categorySelect).toHaveTextContent('0 selected')
      })
    })

    it('handles undefined tags in filters', async () => {
      const { user } = render(
        <FilterPanel
          {...defaultProps}
          filters={{ ...defaultFilters, tags: undefined }}
        />
      )

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        // Should show 0 selected for tags
        const tagFilter = screen.getByTestId('tag-filter')
        expect(tagFilter).toHaveTextContent('0 selected')
      })
    })

    it('handles undefined verifiedOnly in filters', async () => {
      const { user } = render(
        <FilterPanel
          {...defaultProps}
          filters={{ ...defaultFilters, verifiedOnly: undefined }}
        />
      )

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        // Should show off (false by default)
        const verifiedToggle = screen.getByTestId('verified-toggle')
        expect(verifiedToggle).toHaveTextContent('off')
      })
    })

    it('handles high activeFilterCount', () => {
      render(<FilterPanel {...defaultProps} activeFilterCount={99} />)

      expect(screen.getByText('99')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('trigger button has proper role', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('popover content has dialog role', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('can close with Escape key', async () => {
      const { user } = render(<FilterPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /filters\.title/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })
})
