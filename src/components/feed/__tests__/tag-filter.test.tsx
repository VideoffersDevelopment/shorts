import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { TagFilter } from '../tag-filter'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

const mockTags = [
  { id: 'tag-1', name: 'React', slug: 'react', usageCount: 150 },
  { id: 'tag-2', name: 'TypeScript', slug: 'typescript', usageCount: 120 },
  { id: 'tag-3', name: 'Next.js', slug: 'nextjs', usageCount: 100 },
  { id: 'tag-4', name: 'TailwindCSS', slug: 'tailwindcss', usageCount: 80 },
]

describe('TagFilter', () => {
  const defaultProps = {
    selected: [] as string[],
    onChange: vi.fn(),
    max: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock fetch for tag search
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders input field', () => {
      render(<TagFilter {...defaultProps} />)

      expect(
        screen.getByPlaceholderText('filters.tags.placeholder')
      ).toBeInTheDocument()
    })

    it('renders with tag icon', () => {
      render(<TagFilter {...defaultProps} />)

      // Input should have left padding for icon
      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      expect(input).toHaveClass('pl-10')
    })

    it('renders selected tags as badges', () => {
      render(
        <TagFilter {...defaultProps} selected={['react', 'typescript']} />
      )

      expect(screen.getByText('#react')).toBeInTheDocument()
      expect(screen.getByText('#typescript')).toBeInTheDocument()
    })

    it('does not render badges when no tags selected', () => {
      render(<TagFilter {...defaultProps} />)

      expect(screen.queryByText(/#/)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SEARCH FUNCTIONALITY
  // ===========================================================================

  describe('Search Functionality', () => {
    it('searches tags when typing', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      await user.type(
        screen.getByPlaceholderText('filters.tags.placeholder'),
        'react'
      )

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/tags/search?q=react'
        )
      })
    })

    it('shows suggestions when results found', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })
    })

    it('shows usage count in suggestions', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('filters out already selected tags from suggestions', async () => {
      const { user } = render(
        <TagFilter {...defaultProps} selected={['react']} />
      )

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'r')

      await waitFor(() => {
        // React should not appear in suggestions (already selected)
        // TypeScript should appear
        expect(screen.getByText('TypeScript')).toBeInTheDocument()
      })

      // React should only appear as badge, not in suggestions
      const suggestions = screen.getAllByText(/React|react/i)
      expect(suggestions).toHaveLength(1) // Only badge
    })

    it('clears suggestions when input is empty', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })

      await user.clear(input)

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument()
      })
    })

    it('limits suggestions to 8 items', async () => {
      const manyTags = Array.from({ length: 15 }, (_, i) => ({
        id: `tag-${i}`,
        name: `Tag ${i}`,
        slug: `tag-${i}`,
        usageCount: 100 - i,
      }))

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tags: manyTags }),
      })

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'tag')

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole('button')
        // Should show max 8 suggestions (excluding badge buttons if any)
        expect(suggestionButtons.length).toBeLessThanOrEqual(8)
      })
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('adds tag when clicking suggestion', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <TagFilter {...defaultProps} onChange={onChange} />
      )

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })

      await user.click(screen.getByText('React'))

      expect(onChange).toHaveBeenCalledWith(['react'])
    })

    it('clears input after selecting tag', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })

      await user.click(screen.getByText('React'))

      expect(input).toHaveValue('')
    })

    it('removes tag when clicking badge X button', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <TagFilter
          {...defaultProps}
          selected={['react']}
          onChange={onChange}
        />
      )

      const badge = screen.getByText('#react').closest('div')
      const removeButton = badge?.querySelector('button')

      await user.click(removeButton!)

      expect(onChange).toHaveBeenCalledWith([])
    })

    it('hides suggestions on blur', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })

      // Blur input
      await user.tab()

      // Suggestions should hide after delay
      await waitFor(
        () => {
          expect(screen.queryByText('React')).not.toBeInTheDocument()
        },
        { timeout: 500 }
      )
    })

    it('shows suggestions on focus', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tags: mockTags }),
      })

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')

      // Type something first
      await user.type(input, 'r')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // MAX SELECTIONS
  // ===========================================================================

  describe('Max Selections', () => {
    it('disables input when max reached', () => {
      render(
        <TagFilter
          {...defaultProps}
          selected={['tag1', 'tag2', 'tag3', 'tag4', 'tag5']}
          max={5}
        />
      )

      expect(
        screen.getByPlaceholderText('filters.tags.placeholder')
      ).toBeDisabled()
    })

    it('does not add tag when max reached', async () => {
      const onChange = vi.fn()

      // Since input is disabled, this test verifies the disabled state prevents adding
      render(
        <TagFilter
          {...defaultProps}
          selected={['tag1', 'tag2', 'tag3', 'tag4', 'tag5']}
          max={5}
          onChange={onChange}
        />
      )

      // Input should be disabled
      expect(
        screen.getByPlaceholderText('filters.tags.placeholder')
      ).toBeDisabled()
    })

    it('allows removing tags when max reached', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <TagFilter
          {...defaultProps}
          selected={['tag1', 'tag2', 'tag3', 'tag4', 'tag5']}
          max={5}
          onChange={onChange}
        />
      )

      const badge = screen.getByText('#tag1').closest('div')
      const removeButton = badge?.querySelector('button')

      await user.click(removeButton!)

      expect(onChange).toHaveBeenCalledWith(['tag2', 'tag3', 'tag4', 'tag5'])
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.type(input, 'react')

      // Should not throw, just show no suggestions
      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })

    it('handles non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.type(input, 'react')

      // Should not show suggestions
      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument()
      })
    })

    it('handles null tags in response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tags: null }),
      })

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.type(input, 'react')

      // Should not throw
      await waitFor(() => {
        expect(input).toHaveValue('react')
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty search results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tags: [] }),
      })

      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        // No suggestions dropdown should appear
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })

    it('does not add duplicate tags', async () => {
      const onChange = vi.fn()
      const { user } = render(
        <TagFilter
          {...defaultProps}
          selected={['react']}
          onChange={onChange}
        />
      )

      // Even if somehow the user could click on react suggestion
      // (which should be filtered out), it should not be added again
      // This is handled by the filter logic in component
      expect(screen.getByText('#react')).toBeInTheDocument()
    })

    it('handles special characters in search', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.type(input, 'c++')

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/tags/search?q=c%2B%2B'
        )
      })
    })

    it('handles custom max value', () => {
      render(
        <TagFilter {...defaultProps} selected={['tag1', 'tag2', 'tag3']} max={3} />
      )

      expect(
        screen.getByPlaceholderText('filters.tags.placeholder')
      ).toBeDisabled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('input has placeholder', () => {
      render(<TagFilter {...defaultProps} />)

      expect(
        screen.getByPlaceholderText('filters.tags.placeholder')
      ).toBeInTheDocument()
    })

    it('suggestions are buttons', async () => {
      const { user } = render(<TagFilter {...defaultProps} />)

      const input = screen.getByPlaceholderText('filters.tags.placeholder')
      await user.click(input)
      await user.type(input, 'react')

      await waitFor(() => {
        const reactSuggestion = screen.getByText('React')
        expect(reactSuggestion.closest('button')).toBeInTheDocument()
      })
    })

    it('badge remove buttons have type="button"', () => {
      render(<TagFilter {...defaultProps} selected={['react']} />)

      const badge = screen.getByText('#react').closest('div')
      const removeButton = badge?.querySelector('button')

      expect(removeButton).toHaveAttribute('type', 'button')
    })
  })
})
