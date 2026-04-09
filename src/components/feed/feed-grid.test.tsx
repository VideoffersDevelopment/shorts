import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { FeedGrid } from './feed-grid'
import type { FeedFilters, FeedResponse, FeedShort } from '@/lib/types/feed'

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock useInfiniteQuery from TanStack Query
const mockFetchNextPage = vi.fn()
const mockRefetch = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => ({
    data: undefined,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  })),
}))

// Mock useInfiniteScroll hook
const mockSentinelRef = vi.fn()
vi.mock('@/hooks/use-infinite-scroll', () => ({
  useInfiniteScroll: () => ({
    sentinelRef: mockSentinelRef,
  }),
}))

// Mock useTranslations
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => `feed.${key}`,
  }),
}))

// Mock FeedCard
vi.mock('./feed-card', () => ({
  FeedCard: ({ short }: { short: FeedShort }) => (
    <div data-testid="feed-card" data-short-id={short.id}>
      {short.title}
    </div>
  ),
}))

// Mock FeedSkeleton
vi.mock('./feed-skeleton', () => ({
  FeedSkeleton: ({ count }: { count?: number }) => (
    <div data-testid="feed-skeleton" data-count={count ?? 8}>
      Skeleton ({count ?? 8})
    </div>
  ),
}))

// Mock EmptyState
vi.mock('./empty-state', () => ({
  EmptyState: ({
    variant,
    onExpandRadius,
    onClearFilters,
  }: {
    variant: string
    onExpandRadius?: () => void
    onClearFilters?: () => void
  }) => (
    <div
      data-testid="empty-state"
      data-variant={variant}
      data-has-expand={onExpandRadius ? 'true' : 'false'}
      data-has-clear={onClearFilters ? 'true' : 'false'}
    >
      Empty State: {variant}
    </div>
  ),
}))

// Import mocked useInfiniteQuery for manipulation
import { useInfiniteQuery } from '@tanstack/react-query'
const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery)

// ===========================================================================
// TEST DATA
// ===========================================================================

function createMockShort(id: string): FeedShort {
  return {
    id,
    title: `Short ${id}`,
    thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
    hlsPlaylistUrl: `https://example.com/video-${id}.m3u8`,
    duration: 30,
    publishedAt: '2025-01-01T00:00:00Z',
    views: 1000,
    likes: 100,
    ctaClicks: 50,
    location: 'New York, NY',
    distance: null,
    company: {
      id: 'company-1',
      name: 'Test Company',
      slug: 'test-company',
      logo: null,
      verified: false,
    },
    category: {
      id: 'category-1',
      name: 'Technology',
      slug: 'technology',
    },
    ctaLink: null,
  }
}

function createMockFeedResponse(
  count: number,
  nextPage: number | null = null,
  startId: number = 1
): FeedResponse {
  return {
    shorts: Array.from({ length: count }, (_, i) => createMockShort(`short-${startId + i}`)),
    nextPage,
    totalCount: count,
    hasMore: nextPage !== null,
  }
}

const defaultFilters: FeedFilters = {
  sort: 'algorithmic',
}

describe('FeedGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      error: null,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle',
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isInitialLoading: false,
      isPaused: false,
      isPlaceholderData: false,
      isPending: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      fetchPreviousPage: vi.fn(),
      hasPreviousPage: false,
      isFetchingPreviousPage: false,
      promise: Promise.resolve({} as never),
    // eslint-disable-next-line
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe('Loading State', () => {
    it('shows skeleton when loading and no initial data', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByTestId('feed-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('feed-skeleton')).toHaveAttribute('data-count', '10')
    })

    it('does not show skeleton when loading but has initial data', () => {
      const initialData = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [initialData], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} initialData={initialData} />)

      // Should show cards, not skeleton
      expect(screen.queryByTestId('feed-skeleton')).not.toBeInTheDocument()
      expect(screen.getAllByTestId('feed-card')).toHaveLength(5)
    })
  })

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================

  describe('Error State', () => {
    it('shows empty state with no-shorts variant on error', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'no-shorts')
    })

    it('passes onClearFilters to empty state on error', () => {
      const onClearFilters = vi.fn()

      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} onClearFilters={onClearFilters} />)

      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-has-clear', 'true')
    })
  })

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  describe('Empty State', () => {
    it('shows no-shorts empty state when no data', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [{ shorts: [], nextPage: null, totalCount: 0, hasMore: false }], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'no-shorts')
    })

    it('shows no-following empty state when sort is following and no data', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [{ shorts: [], nextPage: null, totalCount: 0, hasMore: false }], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={{ sort: 'following' }} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'no-following')
    })

    it('passes action handlers to empty state', () => {
      const onExpandRadius = vi.fn()
      const onClearFilters = vi.fn()

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [{ shorts: [], nextPage: null, totalCount: 0, hasMore: false }], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(
        <FeedGrid
          filters={defaultFilters}
          onExpandRadius={onExpandRadius}
          onClearFilters={onClearFilters}
        />
      )

      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-has-expand', 'true')
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-has-clear', 'true')
    })
  })

  // ===========================================================================
  // SUCCESSFUL DATA RENDERING
  // ===========================================================================

  describe('Successful Data Rendering', () => {
    it('renders FeedCard for each short', () => {
      const feedResponse = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      const cards = screen.getAllByTestId('feed-card')
      expect(cards).toHaveLength(5)
    })

    it('renders shorts from multiple pages', () => {
      const page1 = createMockFeedResponse(3, 2, 1)   // shorts 1, 2, 3
      const page2 = createMockFeedResponse(2, null, 4) // shorts 4, 5

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [page1, page2], pageParams: [1, 2] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      const cards = screen.getAllByTestId('feed-card')
      expect(cards).toHaveLength(5) // 3 from page 1 + 2 from page 2
    })

    it('has responsive grid layout', () => {
      const feedResponse = createMockFeedResponse(3)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      const { container } = render(<FeedGrid filters={defaultFilters} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('sm:grid-cols-2')
      expect(grid).toHaveClass('md:grid-cols-3')
      expect(grid).toHaveClass('lg:grid-cols-4')
      expect(grid).toHaveClass('xl:grid-cols-5')
    })
  })

  // ===========================================================================
  // INFINITE SCROLL
  // ===========================================================================

  describe('Infinite Scroll', () => {
    it('renders sentinel element for infinite scroll', () => {
      const feedResponse = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      const { container } = render(<FeedGrid filters={defaultFilters} />)

      // Sentinel element should exist
      const sentinel = container.querySelector('.h-1')
      expect(sentinel).toBeInTheDocument()
    })

    it('shows loading skeletons when fetching next page', () => {
      const feedResponse = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      const skeleton = screen.getByTestId('feed-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('data-count', '5')
    })

    it('shows loading indicator when fetching next page', () => {
      const feedResponse = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByText('feed.loading.more')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // END OF FEED
  // ===========================================================================

  describe('End of Feed', () => {
    it('shows end of feed message when no more pages', () => {
      const feedResponse = createMockFeedResponse(5)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByText('feed.loading.endOfFeed')).toBeInTheDocument()
    })

    it('does not show end of feed when there are more pages', () => {
      const feedResponse = createMockFeedResponse(5, 2)

      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [feedResponse], pageParams: [1] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.queryByText('feed.loading.endOfFeed')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // QUERY CONFIGURATION
  // ===========================================================================

  describe('Query Configuration', () => {
    it('passes filters to useInfiniteQuery', () => {
      const filters: FeedFilters = {
        sort: 'newest',
        categoryIds: ['cat-1', 'cat-2'],
        verifiedOnly: true,
      }

      render(<FeedGrid filters={filters} />)

      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['feed', filters],
        })
      )
    })

    it('passes initialData to useInfiniteQuery when provided', () => {
      const initialData = createMockFeedResponse(5)

      render(<FeedGrid filters={defaultFilters} initialData={initialData} />)

      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          initialData: { pages: [initialData], pageParams: [1] },
        })
      )
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles undefined data gracefully', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      // Should show empty state, not crash
      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('handles empty pages array', () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [], pageParams: [] },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      // eslint-disable-next-line
      } as any)

      render(<FeedGrid filters={defaultFilters} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })
})
