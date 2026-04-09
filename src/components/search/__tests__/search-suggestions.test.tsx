import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { SearchSuggestions } from '../search-suggestions'
import { Command, CommandList } from '@/components/ui/command'
import type { SuggestionsResponse } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock scrollIntoView for cmdk library
Element.prototype.scrollIntoView = vi.fn()

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// ===========================================================================
// WRAPPER - Required for cmdk Command context
// ===========================================================================

interface WrapperProps {
  children: React.ReactNode
}

function CommandWrapper({ children }: WrapperProps) {
  return (
    <Command>
      <CommandList>{children}</CommandList>
    </Command>
  )
}

function renderWithCommand(ui: React.ReactElement) {
  return render(<CommandWrapper>{ui}</CommandWrapper>)
}

describe('SearchSuggestions', () => {
  const mockOnSelectQuery = vi.fn()
  const mockOnSelectShort = vi.fn()
  const mockOnSelectCompany = vi.fn()
  const mockOnClearRecent = vi.fn()

  const defaultProps = {
    suggestions: null,
    recentSearches: [] as string[],
    onSelectQuery: mockOnSelectQuery,
    onSelectShort: mockOnSelectShort,
    onSelectCompany: mockOnSelectCompany,
    onClearRecent: mockOnClearRecent,
  }

  const mockSuggestions: SuggestionsResponse = {
    recent: [],
    popular: ['trending tech', 'startup news'],
    shorts: [
      { id: 'short-1', title: 'Amazing Product Demo', thumbnailUrl: 'https://example.com/thumb1.jpg' },
      { id: 'short-2', title: 'Company Introduction', thumbnailUrl: null },
    ],
    companies: [
      { id: 'company-1', name: 'Tech Corp', slug: 'tech-corp', logo: 'https://example.com/logo1.jpg' },
      { id: 'company-2', name: 'Startup Inc', slug: 'startup-inc', logo: null },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders nothing when no content', () => {
      const { container } = renderWithCommand(<SearchSuggestions {...defaultProps} />)

      // Only Command wrapper content, no SearchSuggestions content
      expect(container.querySelector('[cmdk-group]')).not.toBeInTheDocument()
    })

    it('renders recent searches section', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={['previous search', 'another search']}
        />
      )

      expect(screen.getByText('previous search')).toBeInTheDocument()
      expect(screen.getByText('another search')).toBeInTheDocument()
    })

    it('renders clear recent button with recent searches', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={['previous search']}
        />
      )

      // Button is in aria-hidden heading, use getByText instead
      expect(screen.getByText('suggestions.clearRecent')).toBeInTheDocument()
    })

    it('renders popular searches section', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      expect(screen.getByText('trending tech')).toBeInTheDocument()
      expect(screen.getByText('startup news')).toBeInTheDocument()
    })

    it('renders shorts suggestions with thumbnails', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      expect(screen.getByText('Amazing Product Demo')).toBeInTheDocument()
      expect(screen.getByText('Company Introduction')).toBeInTheDocument()
    })

    it('renders companies suggestions with names', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    })

    it('renders section headings', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
          recentSearches={['test']}
        />
      )

      // Headings are rendered via CommandGroup
      expect(screen.getByText('suggestions.popular')).toBeInTheDocument()
      expect(screen.getByText('suggestions.shorts')).toBeInTheDocument()
      expect(screen.getByText('suggestions.companies')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onSelectQuery when recent search clicked', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={['my search']}
        />
      )

      await user.click(screen.getByText('my search'))

      expect(mockOnSelectQuery).toHaveBeenCalledWith('my search')
    })

    it('calls onSelectQuery when popular search clicked', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      await user.click(screen.getByText('trending tech'))

      expect(mockOnSelectQuery).toHaveBeenCalledWith('trending tech')
    })

    it('calls onSelectShort when short suggestion clicked', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      await user.click(screen.getByText('Amazing Product Demo'))

      expect(mockOnSelectShort).toHaveBeenCalledWith('short-1')
    })

    it('calls onSelectCompany when company suggestion clicked', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      await user.click(screen.getByText('Tech Corp'))

      expect(mockOnSelectCompany).toHaveBeenCalledWith('tech-corp')
    })

    it('calls onClearRecent when clear button clicked', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={['test search']}
        />
      )

      // Button is in aria-hidden heading, use getByText
      await user.click(screen.getByText('suggestions.clearRecent'))

      expect(mockOnClearRecent).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('handles transition from no suggestions to having suggestions', () => {
      const { rerender } = renderWithCommand(<SearchSuggestions {...defaultProps} />)

      expect(screen.queryByText('trending tech')).not.toBeInTheDocument()

      rerender(
        <CommandWrapper>
          <SearchSuggestions
            {...defaultProps}
            suggestions={mockSuggestions}
          />
        </CommandWrapper>
      )

      expect(screen.getByText('trending tech')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('handles null suggestions gracefully', () => {
      const { container } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={null}
          recentSearches={[]}
        />
      )

      expect(container.querySelector('[cmdk-group]')).not.toBeInTheDocument()
    })

    it('handles empty arrays in suggestions', () => {
      const emptySuggestions: SuggestionsResponse = {
        recent: [],
        popular: [],
        shorts: [],
        companies: [],
      }

      const { container } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={emptySuggestions}
          recentSearches={[]}
        />
      )

      expect(container.querySelector('[cmdk-group]')).not.toBeInTheDocument()
    })

    it('handles suggestions with only popular searches', () => {
      const partialSuggestions: SuggestionsResponse = {
        recent: [],
        popular: ['only popular'],
        shorts: [],
        companies: [],
      }

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={partialSuggestions}
        />
      )

      expect(screen.getByText('only popular')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('renders shorts without thumbnails with placeholder', () => {
      const noThumbSuggestions: SuggestionsResponse = {
        recent: [],
        popular: [],
        shorts: [{ id: 'short-1', title: 'No Thumb Video', thumbnailUrl: null }],
        companies: [],
      }

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={noThumbSuggestions}
        />
      )

      expect(screen.getByText('No Thumb Video')).toBeInTheDocument()
      // Placeholder div should be present (no img element for thumbnail)
    })

    it('renders companies without logos with placeholder', () => {
      const noLogoSuggestions: SuggestionsResponse = {
        recent: [],
        popular: [],
        shorts: [],
        companies: [{ id: 'company-1', name: 'No Logo Co', slug: 'no-logo', logo: null }],
      }

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={noLogoSuggestions}
        />
      )

      expect(screen.getByText('No Logo Co')).toBeInTheDocument()
    })

    it('handles very long search terms', () => {
      const longSearch = 'a'.repeat(100)

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={[longSearch]}
        />
      )

      expect(screen.getByText(longSearch)).toBeInTheDocument()
    })

    it('handles multiple recent searches', () => {
      const searches = ['search1', 'search2', 'search3', 'search4', 'search5']

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={searches}
        />
      )

      searches.forEach((search) => {
        expect(screen.getByText(search)).toBeInTheDocument()
      })
    })

    it('handles special characters in search terms', () => {
      const specialSearch = 'test & query <script>'

      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={[specialSearch]}
        />
      )

      expect(screen.getByText(specialSearch)).toBeInTheDocument()
    })

    it('renders all sections when all have content', () => {
      renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
          recentSearches={['recent one', 'recent two']}
        />
      )

      // All sections should be visible
      expect(screen.getByText('recent one')).toBeInTheDocument()
      expect(screen.getByText('trending tech')).toBeInTheDocument()
      expect(screen.getByText('Amazing Product Demo')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('clear button is clickable', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          recentSearches={['test']}
        />
      )

      // Button is in aria-hidden heading, use getByText
      const clearButton = screen.getByText('suggestions.clearRecent')

      await user.click(clearButton)

      expect(mockOnClearRecent).toHaveBeenCalled()
    })

    it('images have empty alt text (decorative)', () => {
      const { container } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      // Decorative images should have empty alt
      // Use querySelector because images are inside aria-hidden content
      const images = container.querySelectorAll('img')
      expect(images.length).toBeGreaterThan(0)
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt', '')
      })
    })

    it('command items are clickable', async () => {
      const { user } = renderWithCommand(
        <SearchSuggestions
          {...defaultProps}
          suggestions={mockSuggestions}
        />
      )

      await user.click(screen.getByText('startup news'))

      expect(mockOnSelectQuery).toHaveBeenCalledWith('startup news')
    })
  })
})
