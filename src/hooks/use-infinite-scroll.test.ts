import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInfiniteScroll } from './use-infinite-scroll'

// ===========================================================================
// MOCK INTERSECTION OBSERVER
// ===========================================================================

type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void

interface MockObserverInstance {
  callback: IntersectionObserverCallback
  observedElements: Set<Element>
  disconnect: ReturnType<typeof vi.fn>
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
}

let mockObserverInstances: MockObserverInstance[] = []

const mockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
  const instance: MockObserverInstance = {
    callback,
    observedElements: new Set<Element>(),
    observe: vi.fn((element: Element) => {
      instance.observedElements.add(element)
    }),
    unobserve: vi.fn((element: Element) => {
      instance.observedElements.delete(element)
    }),
    disconnect: vi.fn(() => {
      instance.observedElements.clear()
    }),
  }
  mockObserverInstances.push(instance)
  return {
    ...instance,
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: vi.fn(() => []),
  }
})

function getLatestObserver(): MockObserverInstance | undefined {
  return mockObserverInstances[mockObserverInstances.length - 1]
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', mockIntersectionObserver)
    mockObserverInstances = []
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ===========================================================================
  // BASIC FUNCTIONALITY
  // ===========================================================================

  describe('Basic Functionality', () => {
    it('returns a sentinelRef callback function', () => {
      const onLoadMore = vi.fn()
      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      expect(result.current.sentinelRef).toBeDefined()
      expect(typeof result.current.sentinelRef).toBe('function')
    })

    it('creates IntersectionObserver when hasMore is true and not loading', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      // Observer is created in useEffect when hasMore=true and isLoading=false
      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })
    })

    it('does not create observer when hasMore is false', async () => {
      const onLoadMore = vi.fn()

      mockIntersectionObserver.mockClear()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: false,
          isLoading: false,
        })
      )

      // Wait a tick to ensure effect would have run
      await new Promise((r) => setTimeout(r, 10))

      // Observer should not be created when hasMore is false
      expect(mockIntersectionObserver).not.toHaveBeenCalled()
    })

    it('does not create observer when isLoading is true', async () => {
      const onLoadMore = vi.fn()

      mockIntersectionObserver.mockClear()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: true,
        })
      )

      // Wait a tick to ensure effect would have run
      await new Promise((r) => setTimeout(r, 10))

      // Observer should not be created when loading
      expect(mockIntersectionObserver).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // INTERSECTION CALLBACK
  // ===========================================================================

  describe('Intersection Callback', () => {
    it('calls onLoadMore when element intersects', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      // Wait for observer to be created
      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!

      // Simulate an intersection
      const mockEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      }

      act(() => {
        observer.callback([mockEntry])
      })

      expect(onLoadMore).toHaveBeenCalledTimes(1)
    })

    it('does not call onLoadMore when element is not intersecting', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!

      // Simulate non-intersecting entry
      const mockEntry = {
        isIntersecting: false,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 0,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      }

      act(() => {
        observer.callback([mockEntry])
      })

      expect(onLoadMore).not.toHaveBeenCalled()
    })

    it('calls onLoadMore multiple times on multiple intersections', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!
      const mockTarget = document.createElement('div')

      // First intersection
      act(() => {
        observer.callback([{
          isIntersecting: true,
          target: mockTarget,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        }])
      })

      // Second intersection
      act(() => {
        observer.callback([{
          isIntersecting: true,
          target: mockTarget,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        }])
      })

      expect(onLoadMore).toHaveBeenCalledTimes(2)
    })
  })

  // ===========================================================================
  // OBSERVER OPTIONS
  // ===========================================================================

  describe('Observer Options', () => {
    it('uses default threshold of 0', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            threshold: 0,
          })
        )
      })
    })

    it('uses default rootMargin of 100px', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            rootMargin: '100px',
          })
        )
      })
    })

    it('uses custom threshold when provided', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
          threshold: 0.5,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            threshold: 0.5,
          })
        )
      })
    })

    it('uses custom rootMargin when provided', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
          rootMargin: '200px',
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            rootMargin: '200px',
          })
        )
      })
    })
  })

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  describe('Cleanup', () => {
    it('disconnects observer on unmount', async () => {
      const onLoadMore = vi.fn()

      const { unmount } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!

      unmount()

      expect(observer.disconnect).toHaveBeenCalled()
    })

    it('disconnects previous observer when dependencies change', async () => {
      const onLoadMore = vi.fn()

      const { rerender } = renderHook(
        ({ hasMore }) =>
          useInfiniteScroll({
            onLoadMore,
            hasMore,
            isLoading: false,
          }),
        { initialProps: { hasMore: true } }
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const firstObserver = getLatestObserver()!

      // Change hasMore to false
      rerender({ hasMore: false })

      expect(firstObserver.disconnect).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // SENTINEL REF BEHAVIOR
  // ===========================================================================

  describe('Sentinel Ref Behavior', () => {
    it('handles null sentinel element gracefully', () => {
      const onLoadMore = vi.fn()

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      // Should not throw when setting null
      expect(() => {
        act(() => {
          result.current.sentinelRef(null)
        })
      }).not.toThrow()
    })

    it('sentinelRef is a stable callback', () => {
      const onLoadMore = vi.fn()

      const { result, rerender } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      const firstRef = result.current.sentinelRef

      rerender()

      expect(result.current.sentinelRef).toBe(firstRef)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty entries array', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!

      // Simulate empty entries
      act(() => {
        observer.callback([])
      })

      expect(onLoadMore).not.toHaveBeenCalled()
    })

    it('recreates observer when onLoadMore changes', async () => {
      const onLoadMore1 = vi.fn()
      const onLoadMore2 = vi.fn()

      const { rerender } = renderHook(
        ({ onLoadMore }) =>
          useInfiniteScroll({
            onLoadMore,
            hasMore: true,
            isLoading: false,
          }),
        { initialProps: { onLoadMore: onLoadMore1 } }
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      // Change onLoadMore callback
      rerender({ onLoadMore: onLoadMore2 })

      await waitFor(() => {
        // Should have created a new observer
        expect(mockObserverInstances.length).toBeGreaterThanOrEqual(2)
      })

      const latestObserver = getLatestObserver()!

      // Simulate intersection with new callback
      act(() => {
        latestObserver.callback([{
          isIntersecting: true,
          target: document.createElement('div'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        }])
      })

      expect(onLoadMore2).toHaveBeenCalled()
    })

    it('handles undefined first entry gracefully', async () => {
      const onLoadMore = vi.fn()

      renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      )

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalled()
      })

      const observer = getLatestObserver()!

      // Simulate entries with undefined first element
      act(() => {
        // This tests the optional chaining: entries[0]?.isIntersecting
        observer.callback([] as IntersectionObserverEntry[])
      })

      expect(onLoadMore).not.toHaveBeenCalled()
    })
  })
})
