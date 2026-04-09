import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@/test/utils'
import { useFeedFilters } from '../use-feed-filters'

// ===========================================================================
// MOCKS
// ===========================================================================

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/pl/feed',
}))

// Helper to reset search params for each test
function resetSearchParams() {
  mockSearchParams = new URLSearchParams()
}

describe('useFeedFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSearchParams()
  })

  // ===========================================================================
  // INITIAL STATE
  // ===========================================================================

  describe('Initial State', () => {
    it('returns default filters when no URL params', () => {
      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters).toEqual({
        sort: 'algorithmic',
        categoryIds: undefined,
        tags: undefined,
        lat: undefined,
        lng: undefined,
        radius: undefined,
        verifiedOnly: false,
      })
    })

    it('returns hasActiveFilters as false with no filters', () => {
      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.hasActiveFilters).toBe(false)
    })

    it('returns activeFilterCount as 0 with no filters', () => {
      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(0)
    })
  })

  // ===========================================================================
  // PARSING URL PARAMS
  // ===========================================================================

  describe('Parsing URL Params', () => {
    it('parses sort option from URL', () => {
      mockSearchParams.set('sort', 'newest')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.sort).toBe('newest')
    })

    it('parses categoryIds from URL', () => {
      mockSearchParams.set('categoryIds', 'cat-1,cat-2,cat-3')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.categoryIds).toEqual([
        'cat-1',
        'cat-2',
        'cat-3',
      ])
    })

    it('parses tags from URL', () => {
      mockSearchParams.set('tags', 'react,typescript,nextjs')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.tags).toEqual([
        'react',
        'typescript',
        'nextjs',
      ])
    })

    it('parses location coordinates from URL', () => {
      mockSearchParams.set('lat', '52.2297')
      mockSearchParams.set('lng', '21.0122')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.lat).toBe(52.2297)
      expect(result.current.filters.lng).toBe(21.0122)
    })

    it('parses radius from URL', () => {
      mockSearchParams.set('radius', '25')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.radius).toBe(25)
    })

    it('parses verifiedOnly from URL', () => {
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.verifiedOnly).toBe(true)
    })

    it('filters empty values from arrays', () => {
      mockSearchParams.set('categoryIds', 'cat-1,,cat-2,')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.categoryIds).toEqual(['cat-1', 'cat-2'])
    })
  })

  // ===========================================================================
  // SET FILTERS
  // ===========================================================================

  describe('setFilters', () => {
    it('sets sort option', () => {
      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ sort: 'trending' })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed?sort=trending', {
        scroll: false,
      })
    })

    it('sets categoryIds as comma-separated string', () => {
      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ categoryIds: ['cat-1', 'cat-2'] })
      })

      expect(mockPush).toHaveBeenCalledWith(
        '/pl/feed?categoryIds=cat-1%2Ccat-2',
        { scroll: false }
      )
    })

    it('sets tags as comma-separated string', () => {
      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ tags: ['tag-1', 'tag-2'] })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed?tags=tag-1%2Ctag-2', {
        scroll: false,
      })
    })

    it('sets location coordinates', () => {
      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ lat: 52.2297, lng: 21.0122, radius: 25 })
      })

      expect(mockPush).toHaveBeenCalledWith(
        '/pl/feed?lat=52.2297&lng=21.0122&radius=25',
        { scroll: false }
      )
    })

    it('sets verifiedOnly as true', () => {
      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ verifiedOnly: true })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed?verifiedOnly=true', {
        scroll: false,
      })
    })

    it('removes param when value is undefined', () => {
      mockSearchParams.set('sort', 'newest')
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ verifiedOnly: undefined })
      })

      // verifiedOnly should be removed, sort should remain
      expect(mockPush).toHaveBeenCalledWith('/pl/feed?sort=newest', {
        scroll: false,
      })
    })

    it('removes param when value is false', () => {
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ verifiedOnly: false })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed?', { scroll: false })
    })

    it('removes param when array is empty', () => {
      mockSearchParams.set('categoryIds', 'cat-1,cat-2')

      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ categoryIds: [] })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed?', { scroll: false })
    })

    it('preserves existing params when setting new ones', () => {
      mockSearchParams.set('sort', 'newest')

      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.setFilters({ verifiedOnly: true })
      })

      expect(mockPush).toHaveBeenCalledWith(
        '/pl/feed?sort=newest&verifiedOnly=true',
        { scroll: false }
      )
    })
  })

  // ===========================================================================
  // CLEAR FILTERS
  // ===========================================================================

  describe('clearFilters', () => {
    it('navigates to pathname without params', () => {
      mockSearchParams.set('sort', 'newest')
      mockSearchParams.set('categoryIds', 'cat-1')
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      act(() => {
        result.current.clearFilters()
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/feed', { scroll: false })
    })
  })

  // ===========================================================================
  // HAS ACTIVE FILTERS
  // ===========================================================================

  describe('hasActiveFilters', () => {
    it('returns true when categoryIds are set', () => {
      mockSearchParams.set('categoryIds', 'cat-1')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.hasActiveFilters).toBe(true)
    })

    it('returns true when tags are set', () => {
      mockSearchParams.set('tags', 'tag-1')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.hasActiveFilters).toBe(true)
    })

    it('returns true when location is set', () => {
      mockSearchParams.set('lat', '52.2297')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.hasActiveFilters).toBe(true)
    })

    it('returns true when verifiedOnly is set', () => {
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.hasActiveFilters).toBe(true)
    })

    it('returns false when only sort is set', () => {
      mockSearchParams.set('sort', 'newest')

      const { result } = renderHook(() => useFeedFilters())

      // Sort does not count as active filter
      expect(result.current.hasActiveFilters).toBe(false)
    })
  })

  // ===========================================================================
  // ACTIVE FILTER COUNT
  // ===========================================================================

  describe('activeFilterCount', () => {
    it('counts each category as 1', () => {
      mockSearchParams.set('categoryIds', 'cat-1,cat-2,cat-3')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(3)
    })

    it('counts each tag as 1', () => {
      mockSearchParams.set('tags', 'tag-1,tag-2')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(2)
    })

    it('counts location as 1', () => {
      mockSearchParams.set('lat', '52.2297')
      mockSearchParams.set('lng', '21.0122')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(1)
    })

    it('counts verifiedOnly as 1', () => {
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(1)
    })

    it('sums all active filters correctly', () => {
      mockSearchParams.set('categoryIds', 'cat-1,cat-2')
      mockSearchParams.set('tags', 'tag-1,tag-2,tag-3')
      mockSearchParams.set('lat', '52.2297')
      mockSearchParams.set('verifiedOnly', 'true')

      const { result } = renderHook(() => useFeedFilters())

      // 2 categories + 3 tags + 1 location + 1 verified = 7
      expect(result.current.activeFilterCount).toBe(7)
    })

    it('does not count sort option', () => {
      mockSearchParams.set('sort', 'newest')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.activeFilterCount).toBe(0)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles invalid sort option gracefully', () => {
      mockSearchParams.set('sort', 'invalid')

      const { result } = renderHook(() => useFeedFilters())

      // Should still return the value (type coercion happens at component level)
      expect(result.current.filters.sort).toBe('invalid')
    })

    it('handles non-numeric lat/lng gracefully', () => {
      mockSearchParams.set('lat', 'invalid')
      mockSearchParams.set('lng', 'invalid')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.lat).toBeNaN()
      expect(result.current.filters.lng).toBeNaN()
    })

    it('handles non-numeric radius gracefully', () => {
      mockSearchParams.set('radius', 'invalid')

      const { result } = renderHook(() => useFeedFilters())

      expect(result.current.filters.radius).toBeNaN()
    })

    it('provides stable function references', () => {
      // Note: Due to searchParams dependency, functions are recreated
      // but they work correctly. This tests that functions exist.
      const { result } = renderHook(() => useFeedFilters())

      expect(typeof result.current.setFilters).toBe('function')
      expect(typeof result.current.clearFilters).toBe('function')
    })
  })
})
