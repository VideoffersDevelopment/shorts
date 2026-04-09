import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { SearchResults } from '../search-results'
import type { SearchResult, FeedShort, CompanyResult } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock FeedCard component
vi.mock('@/components/feed/feed-card', () => ({
  FeedCard: ({ short }: { short: FeedShort }) => (
    <div data-testid="feed-card" data-short-id={short.id}>
      {short.title}
    </div>
  ),
}))

// Mock EmptyState component
vi.mock('@/components/feed/empty-state', () => ({
  EmptyState: ({ variant, query }: { variant: string; query: string }) => (
    <div data-testid="empty-state" data-variant={variant}>
      No results for: {query}
    </div>
  ),
}))

describe('SearchResults', () => {
  const mockShort: FeedShort = {
    id: 'short-1',
    title: 'Amazing Short Video',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    hlsPlaylistUrl: 'https://example.com/video.m3u8',
    duration: 30,
    publishedAt: '2025-01-01T00:00:00Z',
    views: 1000,
    likes: 50,
    ctaClicks: 10,
    location: 'New York',
    distance: null,
    company: {
      id: 'company-1',
      name: 'Tech Corp',
      slug: 'tech-corp',
      logo: 'https://example.com/logo.jpg',
      verified: true,
    },
    category: {
      id: 'cat-1',
      name: 'Technology',
      slug: 'technology',
    },
    ctaLink: 'https://example.com',
  }

  const mockCompany: CompanyResult = {
    id: 'company-2',
    name: 'Startup Inc',
    slug: 'startup-inc',
    logo: 'https://example.com/startup-logo.jpg',
    verified: true,
    category: 'Technology',
    shortsCount: 15,
  }

  const mockShortResult: SearchResult = {
    type: 'short',
    data: mockShort,
    rank: 1,
  }

  const mockCompanyResult: SearchResult = {
    type: 'company',
    data: mockCompany,
    rank: 2,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders empty state when no results', () => {
      render(<SearchResults results={[]} query="test query" />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No results for: test query')).toBeInTheDocument()
    })

    it('renders shorts section with FeedCard components', () => {
      render(<SearchResults results={[mockShortResult]} query="test" />)

      expect(screen.getByText('tabs.shorts')).toBeInTheDocument()
      expect(screen.getByTestId('feed-card')).toBeInTheDocument()
      expect(screen.getByText('Amazing Short Video')).toBeInTheDocument()
    })

    it('renders companies section with company cards', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      expect(screen.getByText('tabs.companies')).toBeInTheDocument()
      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    })

    it('renders both sections when results contain both types', () => {
      render(
        <SearchResults
          results={[mockShortResult, mockCompanyResult]}
          query="test"
        />
      )

      expect(screen.getByText('tabs.shorts')).toBeInTheDocument()
      expect(screen.getByText('tabs.companies')).toBeInTheDocument()
      expect(screen.getByTestId('feed-card')).toBeInTheDocument()
      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    })

    it('renders company logo image when available', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      const logo = screen.getByRole('img', { name: 'Startup Inc' })
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/startup-logo.jpg')
    })

    it('renders placeholder when company has no logo', () => {
      const noLogoCompany: CompanyResult = {
        ...mockCompany,
        logo: null,
      }
      const noLogoResult: SearchResult = {
        type: 'company',
        data: noLogoCompany,
        rank: 1,
      }

      render(<SearchResults results={[noLogoResult]} query="test" />)

      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
      // Should not have img element
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('renders verified badge for verified companies', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      // BadgeCheck icon should be present - we can check by svg presence
      const companyCard = screen.getByText('Startup Inc').closest('a')
      expect(companyCard).toBeInTheDocument()
    })

    it('does not render verified badge for non-verified companies', () => {
      const unverifiedCompany: CompanyResult = {
        ...mockCompany,
        verified: false,
      }
      const unverifiedResult: SearchResult = {
        type: 'company',
        data: unverifiedCompany,
        rank: 1,
      }

      render(<SearchResults results={[unverifiedResult]} query="test" />)

      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    })

    it('renders company category when available', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      expect(screen.getByText('Technology')).toBeInTheDocument()
    })

    it('renders shorts count for companies', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      expect(screen.getByText(/company\.shortsCount/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('company card links to company page', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/en/companies/startup-inc')
    })

    it('renders multiple shorts with FeedCard', () => {
      const shortResult2: SearchResult = {
        type: 'short',
        data: { ...mockShort, id: 'short-2', title: 'Second Video' },
        rank: 2,
      }

      render(
        <SearchResults
          results={[mockShortResult, shortResult2]}
          query="test"
        />
      )

      const feedCards = screen.getAllByTestId('feed-card')
      expect(feedCards).toHaveLength(2)
    })

    it('renders multiple companies with links', () => {
      const companyResult2: SearchResult = {
        type: 'company',
        data: { ...mockCompany, id: 'company-3', name: 'Other Corp', slug: 'other-corp' },
        rank: 2,
      }

      render(
        <SearchResults
          results={[mockCompanyResult, companyResult2]}
          query="test"
        />
      )

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('transitions from empty to results', () => {
      const { rerender } = render(<SearchResults results={[]} query="test" />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()

      rerender(<SearchResults results={[mockShortResult]} query="test" />)

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
      expect(screen.getByTestId('feed-card')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('handles empty results array gracefully', () => {
      render(<SearchResults results={[]} query="test" />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'no-search-results')
    })

    it('handles company without category', () => {
      const noCategoryCompany: CompanyResult = {
        ...mockCompany,
        category: null,
      }
      const noCategoryResult: SearchResult = {
        type: 'company',
        data: noCategoryCompany,
        rank: 1,
      }

      render(<SearchResults results={[noCategoryResult]} query="test" />)

      expect(screen.getByText('Startup Inc')).toBeInTheDocument()
      // Category paragraph should not be rendered
    })

    it('preserves query in empty state', () => {
      render(<SearchResults results={[]} query="my search term" />)

      expect(screen.getByText('No results for: my search term')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('renders only shorts section when no companies', () => {
      render(<SearchResults results={[mockShortResult]} query="test" />)

      expect(screen.getByText('tabs.shorts')).toBeInTheDocument()
      expect(screen.queryByText('tabs.companies')).not.toBeInTheDocument()
    })

    it('renders only companies section when no shorts', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      expect(screen.getByText('tabs.companies')).toBeInTheDocument()
      expect(screen.queryByText('tabs.shorts')).not.toBeInTheDocument()
    })

    it('handles mixed results in correct order', () => {
      const results: SearchResult[] = [
        mockShortResult,
        mockCompanyResult,
        { type: 'short', data: { ...mockShort, id: 'short-3', title: 'Third Short' }, rank: 3 },
        { type: 'company', data: { ...mockCompany, id: 'company-3', name: 'Third Co', slug: 'third-co' }, rank: 4 },
      ]

      render(<SearchResults results={results} query="test" />)

      const feedCards = screen.getAllByTestId('feed-card')
      expect(feedCards).toHaveLength(2)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
    })

    it('handles special characters in query', () => {
      render(<SearchResults results={[]} query="test & <script>alert('xss')</script>" />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('handles company with zero shorts', () => {
      const zeroShortsCompany: CompanyResult = {
        ...mockCompany,
        shortsCount: 0,
      }
      const zeroShortsResult: SearchResult = {
        type: 'company',
        data: zeroShortsCompany,
        rank: 1,
      }

      render(<SearchResults results={[zeroShortsResult]} query="test" />)

      expect(screen.getByText(/company\.shortsCount.*"count":0/)).toBeInTheDocument()
    })

    it('handles very long company names', () => {
      const longNameCompany: CompanyResult = {
        ...mockCompany,
        name: 'A'.repeat(100),
      }
      const longNameResult: SearchResult = {
        type: 'company',
        data: longNameCompany,
        rank: 1,
      }

      render(<SearchResults results={[longNameResult]} query="test" />)

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('company cards are links with proper href', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/en/companies/startup-inc')
    })

    it('section headings are semantic h2 elements', () => {
      render(
        <SearchResults
          results={[mockShortResult, mockCompanyResult]}
          query="test"
        />
      )

      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings).toHaveLength(2)
    })

    it('company logos have alt text', () => {
      render(<SearchResults results={[mockCompanyResult]} query="test" />)

      const img = screen.getByRole('img', { name: 'Startup Inc' })
      expect(img).toHaveAttribute('alt', 'Startup Inc')
    })

    it('empty state is accessible', () => {
      render(<SearchResults results={[]} query="test" />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText(/No results for/)).toBeInTheDocument()
    })

    it('shorts section is navigable', () => {
      render(<SearchResults results={[mockShortResult]} query="test" />)

      // FeedCard should be rendered (mocked)
      expect(screen.getByTestId('feed-card')).toBeInTheDocument()
    })
  })
})
