import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@/test/utils'
import { useGeolocation } from '../use-geolocation'

// ===========================================================================
// MOCKS
// ===========================================================================

interface MockGeolocation {
  getCurrentPosition: ReturnType<typeof vi.fn>
  watchPosition: ReturnType<typeof vi.fn>
  clearWatch: ReturnType<typeof vi.fn>
}

const mockGeolocation: MockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

describe('useGeolocation', () => {
  // Store original navigator.geolocation
  const originalGeolocation = navigator.geolocation

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restore original geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true,
    })
  })

  // ===========================================================================
  // INITIAL STATE
  // ===========================================================================

  describe('Initial State', () => {
    it('returns initial state with null location', () => {
      const { result } = renderHook(() => useGeolocation())

      expect(result.current.location).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.permissionDenied).toBe(false)
    })

    it('provides detect and clear functions', () => {
      const { result } = renderHook(() => useGeolocation())

      expect(typeof result.current.detect).toBe('function')
      expect(typeof result.current.clear).toBe('function')
    })
  })

  // ===========================================================================
  // DETECTION - SUCCESS
  // ===========================================================================

  describe('Detection - Success', () => {
    it('detects location successfully', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success(mockPosition)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      let detectedLocation: { lat: number; lng: number } | null = null

      await act(async () => {
        detectedLocation = await result.current.detect()
      })

      expect(detectedLocation).toEqual({ lat: 52.2297, lng: 21.0122 })
      expect(result.current.location).toEqual({ lat: 52.2297, lng: 21.0122 })
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.permissionDenied).toBe(false)
    })

    it('sets loading state during detection', async () => {
      let resolvePosition: (value: void) => void
      const positionPromise = new Promise<void>((resolve) => {
        resolvePosition = resolve
      })

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          // Delay response
          positionPromise.then(() => {
            success({
              coords: {
                latitude: 52.2297,
                longitude: 21.0122,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            })
          })
        }
      )

      const { result } = renderHook(() => useGeolocation())

      // Start detection (don't await)
      let detectPromise: Promise<{ lat: number; lng: number } | null>
      act(() => {
        detectPromise = result.current.detect()
      })

      // Check loading state immediately
      expect(result.current.loading).toBe(true)

      // Resolve position
      await act(async () => {
        resolvePosition!()
        await detectPromise!
      })

      expect(result.current.loading).toBe(false)
    })

    it('calls geolocation API with correct options', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success({
            coords: {
              latitude: 0,
              longitude: 0,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          })
        }
      )

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.detect()
      })

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      )
    })
  })

  // ===========================================================================
  // DETECTION - ERRORS
  // ===========================================================================

  describe('Detection - Errors', () => {
    it('handles permission denied error', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      let detectedLocation: { lat: number; lng: number } | null = null

      await act(async () => {
        detectedLocation = await result.current.detect()
      })

      expect(detectedLocation).toBeNull()
      expect(result.current.location).toBeNull()
      expect(result.current.error).toBe('User denied Geolocation')
      expect(result.current.permissionDenied).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('handles position unavailable error', async () => {
      const mockError: GeolocationPositionError = {
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.error).toBe('Position unavailable')
      expect(result.current.permissionDenied).toBe(false)
    })

    it('handles timeout error', async () => {
      const mockError: GeolocationPositionError = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.error).toBe('Timeout')
      expect(result.current.permissionDenied).toBe(false)
    })

    it('handles geolocation not supported', async () => {
      // Remove geolocation API
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useGeolocation())

      let detectedLocation: { lat: number; lng: number } | null = null

      await act(async () => {
        detectedLocation = await result.current.detect()
      })

      expect(detectedLocation).toBeNull()
      expect(result.current.error).toBe(
        'Geolocation is not supported by your browser'
      )
    })
  })

  // ===========================================================================
  // CLEAR FUNCTION
  // ===========================================================================

  describe('Clear Function', () => {
    it('clears location state', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success(mockPosition)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      // First detect location
      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.location).not.toBeNull()

      // Then clear
      act(() => {
        result.current.clear()
      })

      expect(result.current.location).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.permissionDenied).toBe(false)
    })

    it('clears error state', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      // First trigger error
      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.permissionDenied).toBe(true)

      // Then clear
      act(() => {
        result.current.clear()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.permissionDenied).toBe(false)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles multiple sequential detect calls', async () => {
      let callCount = 0
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          callCount++
          success({
            coords: {
              latitude: callCount * 10,
              longitude: callCount * 10,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          })
        }
      )

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.location).toEqual({ lat: 10, lng: 10 })

      await act(async () => {
        await result.current.detect()
      })

      expect(result.current.location).toEqual({ lat: 20, lng: 20 })
    })

    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() => useGeolocation())

      const initialDetect = result.current.detect
      const initialClear = result.current.clear

      rerender()

      expect(result.current.detect).toBe(initialDetect)
      expect(result.current.clear).toBe(initialClear)
    })
  })
})
