"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect media query matches.
 * Returns false during SSR and initial hydration to prevent mismatch.
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean - whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener("change", listener)

    // Cleanup
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}

/**
 * Convenience hooks for common breakpoints (matching Tailwind defaults)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("(min-width: 768px)")
}

export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery("(min-width: 768px)")
  const isBelowDesktop = !useMediaQuery("(min-width: 1024px)")
  return isAboveMobile && isBelowDesktop
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}

/**
 * Combined hook returning all breakpoint states
 */
export function useBreakpoints() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return { isMobile, isTablet, isDesktop }
}
