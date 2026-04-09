import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CategoryMultiSelect } from '../category-multi-select'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key}:${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Technology',
    slug: 'technology',
    children: [
      { id: 'cat-1-1', name: 'Web Development', slug: 'web-development' },
      { id: 'cat-1-2', name: 'Mobile Apps', slug: 'mobile-apps' },
    ],
  },
  {
    id: 'cat-2',
    name: 'Design',
    slug: 'design',
    children: [
      { id: 'cat-2-1', name: 'UI/UX', slug: 'ui-ux' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Business',
    slug: 'business',
  },
]

describe('CategoryMultiSelect', () => {
  const defaultProps = {
    selected: [] as string[],
    onChange: vi.fn(),
    max: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock fetch for categories
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: mockCategories }),
    })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders combobox trigger button', async () => {
      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('shows placeholder when nothing selected', async () => {
      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(
          screen.getByText('filters.categories.placeholder')
        ).toBeInTheDocument()
      })
    })

    it('shows selected count when items selected', async () => {
      render(
        <CategoryMultiSelect {...defaultProps} selected={['cat-1', 'cat-2']} />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/filters\.categories\.selected.*count.*2/i)
        ).toBeInTheDocument()
      })
    })

    it('fetches categories on mount', async () => {
      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/categories')
      })
    })

    it('is disabled while loading', () => {
      // Before categories load
      render(<CategoryMultiSelect {...defaultProps} />)

      // Initially disabled while loading
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('is enabled after loading', async () => {
      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // SELECTED BADGES
  // ===========================================================================

  describe('Selected Badges', () => {
    it('renders badges for selected categories', async () => {
      render(
        <CategoryMultiSelect {...defaultProps} selected={['cat-1', 'cat-2']} />
      )

      await waitFor(() => {
        // Badges show category names
        expect(screen.getByText('Technology')).toBeInTheDocument()
        expect(screen.getByText('Design')).toBeInTheDocument()
      })
    })

    it('removes category when clicking badge X button', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <CategoryMultiSelect
          {...defaultProps}
          selected={['cat-1']}
          onChange={onChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument()
      })

      // Find and click the X button in the badge
      const badge = screen.getByText('Technology').closest('div')
      const removeButton = badge?.querySelector('button')

      await user.click(removeButton!)

      expect(onChange).toHaveBeenCalledWith([])
    })

    it('shows category ID when name not found', async () => {
      render(
        <CategoryMultiSelect {...defaultProps} selected={['unknown-cat']} />
      )

      await waitFor(() => {
        expect(screen.getByText('unknown-cat')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // MAX SELECTIONS
  // ===========================================================================

  describe('Max Selections', () => {
    it('shows max selected message when limit reached', async () => {
      render(
        <CategoryMultiSelect
          {...defaultProps}
          selected={['cat-1', 'cat-2', 'cat-3', 'cat-1-1', 'cat-1-2']}
          max={5}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/filters\.categories\.maxSelected.*max.*5/i)
        ).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      render(<CategoryMultiSelect {...defaultProps} />)

      // Should not throw, just show empty state
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled()
      })
    })

    it('handles non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })

      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled()
      })
    })

    it('handles null categories in response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ categories: null }),
      })

      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles custom max value', async () => {
      render(
        <CategoryMultiSelect
          {...defaultProps}
          selected={['cat-1', 'cat-2', 'cat-3']}
          max={3}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/filters\.categories\.maxSelected.*max.*3/i)
        ).toBeInTheDocument()
      })
    })

    it('handles empty selected array', async () => {
      render(<CategoryMultiSelect {...defaultProps} selected={[]} />)

      await waitFor(() => {
        expect(
          screen.getByText('filters.categories.placeholder')
        ).toBeInTheDocument()
      })

      // No badges should be visible
      expect(screen.queryByText('Technology')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('trigger has combobox role', async () => {
      render(<CategoryMultiSelect {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('badge remove buttons are accessible', async () => {
      render(
        <CategoryMultiSelect {...defaultProps} selected={['cat-1']} />
      )

      await waitFor(() => {
        const badge = screen.getByText('Technology').closest('div')
        const removeButton = badge?.querySelector('button')
        expect(removeButton).toHaveAttribute('type', 'button')
      })
    })
  })
})
