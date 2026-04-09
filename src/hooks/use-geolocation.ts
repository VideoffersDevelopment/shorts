"use client"

import { useState, useCallback } from 'react'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  loading: boolean
  error: string | null
  permissionDenied: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  detect: () => Promise<{ lat: number; lng: number } | null>
  clear: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
  })

  const detect = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: 'Geolocation is not supported by your browser',
      }))
      return null
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setState({
            location,
            loading: false,
            error: null,
            permissionDenied: false,
          })
          resolve(location)
        },
        (error) => {
          const permissionDenied = error.code === error.PERMISSION_DENIED
          setState((s) => ({
            ...s,
            loading: false,
            error: error.message,
            permissionDenied,
          }))
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      )
    })
  }, [])

  const clear = useCallback(() => {
    setState({
      location: null,
      loading: false,
      error: null,
      permissionDenied: false,
    })
  }, [])

  return { ...state, detect, clear }
}
