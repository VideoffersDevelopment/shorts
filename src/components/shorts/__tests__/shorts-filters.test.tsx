import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ShortsFilters } from '../shorts-filters'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

describe('ShortsFilters', () => {
  const defaultProps = {
    status: 'all' as const,
    search: '',
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Use shouldAdvanceTime: true so user-event async actions still work
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders all status filter buttons', () => {
      render(<ShortsFilters {...defaultProps} />)

      expect(screen.getByText('filters.all')).toBeInTheDocument()
      expect(screen.getByText('filters.drafts')).toBeInTheDocument()
      expect(screen.getByText('filters.published')).toBeInTheDocument()
      expect(screen.getByText('filters.archived')).toBeInTheDocument()
    })

    it('renders search input', () => {
      render(<ShortsFilters {...defaultProps} />)

      expect(screen.getByPlaceholderText('filters.search')).toBeInTheDocument()
    })

    it('highlights active status filter', () => {
      render(<ShortsFilters {...defaultProps} status="DRAFT" />)

      const draftButton = screen.getByText('filters.drafts')
      expect(draftButton).toHaveClass('bg-background')
    })

    it('displays current search value in input', () => {
      render(<ShortsFilters {...defaultProps} search="test query" />)

      const input = screen.getByPlaceholderText('filters.search')
      expect(input).toHaveValue('test query')
    })

    it('shows clear button when filters are active', () => {
      render(<ShortsFilters {...defaultProps} status="DRAFT" />)

      expect(screen.getByRole('button', { name: /sortBy/i })).toBeInTheDocument()
    })

    it('hides clear button when no filters active', () => {
      render(<ShortsFilters {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      // Only status filter buttons, no clear button
      expect(buttons.length).toBe(4)
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls onStatusChange when status button clicked', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      await user.click(screen.getByText('filters.drafts'))

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('DRAFT')
    })

    it('calls onStatusChange with PUBLISHED', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      await user.click(screen.getByText('filters.published'))

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('PUBLISHED')
    })

    it('calls onStatusChange with ARCHIVED', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      await user.click(screen.getByText('filters.archived'))

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('ARCHIVED')
    })

    it('calls onStatusChange with all', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} status="DRAFT" />)

      await user.click(screen.getByText('filters.all'))

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('all')
    })

    it('debounces search input (300ms)', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.search')
      await user.type(input, 'test')

      // Should not call immediately
      expect(defaultProps.onSearchChange).not.toHaveBeenCalled()

      // Advance timer
      vi.advanceTimersByTime(300)

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test')
    })

    it('clears filters when clear button clicked', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} status="DRAFT" search="query" />)

      const clearButton = screen.getByRole('button', { name: /sortBy/i })
      await user.click(clearButton)

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('')
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('all')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles rapid status changes', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      await user.click(screen.getByText('filters.drafts'))
      await user.click(screen.getByText('filters.published'))
      await user.click(screen.getByText('filters.archived'))

      expect(defaultProps.onStatusChange).toHaveBeenCalledTimes(3)
      expect(defaultProps.onStatusChange).toHaveBeenLastCalledWith('ARCHIVED')
    })

    it('cancels previous debounce on new input', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.search')
      await user.type(input, 'abc')

      vi.advanceTimersByTime(100)

      await user.clear(input)
      await user.type(input, 'xyz')

      vi.advanceTimersByTime(300)

      // Should only call with final value
      expect(defaultProps.onSearchChange).toHaveBeenLastCalledWith('xyz')
    })

    it('handles empty search after clearing', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} search="existing" />)

      const input = screen.getByPlaceholderText('filters.search')
      await user.clear(input)

      vi.advanceTimersByTime(300)

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('search input is focusable', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.search')
      await user.click(input)

      expect(input).toHaveFocus()
    })

    it('status buttons are keyboard accessible', async () => {
      const { user } = render(<ShortsFilters {...defaultProps} />)

      const draftButton = screen.getByText('filters.drafts')
      draftButton.focus()

      await user.keyboard('{Enter}')

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('DRAFT')
    })

    it('clear button has descriptive title', () => {
      render(<ShortsFilters {...defaultProps} status="DRAFT" />)

      const clearButton = screen.getByRole('button', { name: /sortBy/i })
      expect(clearButton).toHaveAttribute('title', 'filters.sortBy')
    })
  })
})
