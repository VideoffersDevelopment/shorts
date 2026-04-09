"use client"

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node
  }, [])

  useEffect(() => {
    if (!hasMore || isLoading) return

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      if (entries[0]?.isIntersecting) {
        onLoadMore()
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    })

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin])

  return { sentinelRef: setSentinelRef }
}
