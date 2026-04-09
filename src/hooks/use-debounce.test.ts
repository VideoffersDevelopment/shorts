import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ===========================================================================
  // INITIAL VALUE
  // ===========================================================================

  describe('Initial Value', () => {
    it('returns the initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500))

      expect(result.current).toBe('initial')
    })

    it('works with different types - number', () => {
      const { result } = renderHook(() => useDebounce(42, 300))

      expect(result.current).toBe(42)
    })

    it('works with different types - object', () => {
      const obj = { name: 'test', value: 123 }
      const { result } = renderHook(() => useDebounce(obj, 300))

      expect(result.current).toEqual(obj)
    })

    it('works with different types - null', () => {
      const { result } = renderHook(() => useDebounce(null, 300))

      expect(result.current).toBeNull()
    })
  })

  // ===========================================================================
  // DEBOUNCE BEHAVIOR
  // ===========================================================================

  describe('Debounce Behavior', () => {
    it('does not update value before delay elapses', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      // Value should still be initial before delay
      expect(result.current).toBe('initial')

      // Advance time but not enough
      act(() => {
        vi.advanceTimersByTime(400)
      })

      expect(result.current).toBe('initial')
    })

    it('updates value after delay elapses', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      // Advance time past delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current).toBe('updated')
      })
    })

    it('resets timer when value changes during delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      )

      // First update
      rerender({ value: 'first' })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Second update before first completes - should reset timer
      rerender({ value: 'second' })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Still should be initial because timer was reset
      expect(result.current).toBe('initial')

      // Complete the second delay
      act(() => {
        vi.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(result.current).toBe('second')
      })
    })
  })

  // ===========================================================================
  // DELAY PARAMETER
  // ===========================================================================

  describe('Delay Parameter', () => {
    it('respects different delay values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      // 500ms should not be enough for 1000ms delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toBe('initial')

      // Complete the full delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current).toBe('updated')
      })
    })

    it('works with zero delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      act(() => {
        vi.advanceTimersByTime(0)
      })

      await waitFor(() => {
        expect(result.current).toBe('updated')
      })
    })
  })

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  describe('Cleanup', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

      const { rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('clears previous timeout when value changes', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'first' })
      rerender({ value: 'second' })

      // Should have cleared the previous timeout
      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles rapid successive updates', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      )

      // Rapid updates
      for (let i = 1; i <= 10; i++) {
        rerender({ value: i })
        act(() => {
          vi.advanceTimersByTime(100)
        })
      }

      // Should still be 0 since no full delay passed
      expect(result.current).toBe(0)

      // Wait for final value
      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current).toBe(10)
      })
    })

    it('handles delay parameter changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      )

      // Change both value and delay
      rerender({ value: 'updated', delay: 1000 })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should still be initial with new longer delay
      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current).toBe('updated')
      })
    })
  })
})
