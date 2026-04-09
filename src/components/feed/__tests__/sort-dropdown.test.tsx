import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { SortDropdown } from '../sort-dropdown'
import type { FeedSortOption } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

describe('SortDropdown', () => {
  const defaultProps = {
    value: 'algorithmic' as FeedSortOption,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(<SortDropdown {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays current sort option text', () => {
      render(<SortDropdown {...defaultProps} value="newest" />)

      expect(screen.getByText('sort.newest')).toBeInTheDocument()
    })

    it('renders with algorithmic as default', () => {
      render(<SortDropdown {...defaultProps} />)

      expect(screen.getByText('sort.algorithmic')).toBeInTheDocument()
    })

    it('renders all sort option values correctly', () => {
      const sortOptions: FeedSortOption[] = [
        'algorithmic',
        'newest',
        'popular',
        'trending',
        'following',
      ]

      sortOptions.forEach((sortOption) => {
        const { unmount } = render(
          <SortDropdown {...defaultProps} value={sortOption} />
        )
        expect(screen.getByText(`sort.${sortOption}`)).toBeInTheDocument()
        unmount()
      })
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('opens dropdown menu on click', async () => {
      const { user } = render(<SortDropdown {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      // All sort options should be visible in dropdown
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    it('shows all 5 sort options when opened', async () => {
      const { user } = render(<SortDropdown {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menuitemradio', { name: /sort\.algorithmic/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitemradio', { name: /sort\.newest/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitemradio', { name: /sort\.popular/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitemradio', { name: /sort\.trending/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitemradio', { name: /sort\.following/i })).toBeInTheDocument()
      })
    })

    it('calls onChange with selected sort option', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <SortDropdown {...defaultProps} onChange={onChange} />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitemradio', { name: /sort\.newest/i }))

      expect(onChange).toHaveBeenCalledWith('newest')
    })

    it('marks current option as checked', async () => {
      const { user } = render(<SortDropdown {...defaultProps} value="popular" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const popularOption = screen.getByRole('menuitemradio', { name: /sort\.popular/i })
        expect(popularOption).toHaveAttribute('aria-checked', 'true')
      })
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe('Props', () => {
    it('updates displayed value when value prop changes', () => {
      const { rerender } = render(<SortDropdown {...defaultProps} value="algorithmic" />)

      expect(screen.getByText('sort.algorithmic')).toBeInTheDocument()

      rerender(<SortDropdown {...defaultProps} value="trending" />)

      expect(screen.getByText('sort.trending')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('trigger button has proper role', () => {
      render(<SortDropdown {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('dropdown menu has proper role', async () => {
      const { user } = render(<SortDropdown {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    it('options have menuitemradio role', async () => {
      const { user } = render(<SortDropdown {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const options = screen.getAllByRole('menuitemradio')
        expect(options).toHaveLength(5)
      })
    })
  })
})
