"use client"

import { useCallback, useState, useRef, useEffect, type ReactNode } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { FeedListItem } from './feed-list-item'
import { EmptyState } from './empty-state'
import { useTranslations } from '@/lib/i18n/client'
import type { FeedFilters, FeedResponse } from '@/lib/types/feed'

interface FeedListProps {
  initialData?: FeedResponse
  filters: FeedFilters
  onExpandRadius?: () => void
  onClearFilters?: () => void
  /** Sticky header rendered above the first slide (breadcrumb, title, chips) */
  header?: ReactNode
  /** View mode toggle rendered in the header bar */
  viewModeToggle?: ReactNode
}

async function fetchFeed(filters: FeedFilters & { page: number }): Promise<FeedResponse> {
  const params = new URLSearchParams()

  params.set('page', filters.page.toString())
  params.set('sort', filters.sort)

  if (filters.categoryIds?.length) {
    params.set('categoryIds', filters.categoryIds.join(','))
  }
  if (filters.tags?.length) {
    params.set('tags', filters.tags.join(','))
  }
  if (filters.lat !== undefined) {
    params.set('lat', filters.lat.toString())
  }
  if (filters.lng !== undefined) {
    params.set('lng', filters.lng.toString())
  }
  if (filters.radius !== undefined) {
    params.set('radius', filters.radius.toString())
  }
  if (filters.verifiedOnly) {
    params.set('verifiedOnly', 'true')
  }

  const response = await fetch(`/api/feed?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch feed')
  }

  return response.json() as Promise<FeedResponse>
}

function getSlideState(index: number, activeIndex: number): 'active' | 'adjacent' | 'idle' {
  if (index === activeIndex) return 'active'
  if (Math.abs(index - activeIndex) === 1) return 'adjacent'
  return 'idle'
}

export function FeedList({
  initialData,
  filters,
  onExpandRadius,
  onClearFilters,
  header,
  viewModeToggle,
}: FeedListProps) {
  const locale = useLocale()
  const { t } = useTranslations('feed')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: ({ pageParam }) => fetchFeed({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialData: initialData
      ? { pages: [initialData], pageParams: [1] }
      : undefined,
    staleTime: 1000 * 30,
  })

  const allShorts = data?.pages.flatMap((page) => page.shorts) ?? []

  // Measure the actual scroll area height so slides match exactly
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setScrollAreaHeight(entry.contentRect.height)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // IntersectionObserver — determines which slide is > 50% visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number(entry.target.getAttribute('data-slide-index'))
            if (!isNaN(idx)) {
              setActiveIndex(idx)
            }
          }
        }
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    )

    slideRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [allShorts.length])

  // Prefetch next page when user reaches the last 2 items
  useEffect(() => {
    if (activeIndex >= allShorts.length - 2 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [activeIndex, allShorts.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Update URL to reflect current short (shallow, no navigation)
  useEffect(() => {
    const currentShort = allShorts[activeIndex]
    if (!currentShort) return

    const newUrl = `/${locale}/shorts/${currentShort.id}`
    if (window.location.pathname !== newUrl) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [activeIndex, allShorts, locale])

  const setSlideRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      slideRefs.current.set(index, el)
    } else {
      slideRefs.current.delete(index)
    }
  }, [])

  const hasHeader = !!header

  // Loading state
  if (isLoading && !initialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState variant="no-shorts" onClearFilters={onClearFilters} />
      </div>
    )
  }

  // Empty state
  if (allShorts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        {filters.sort === 'following' ? (
          <EmptyState variant="no-following" />
        ) : (
          <EmptyState
            variant="no-shorts"
            onExpandRadius={onExpandRadius}
            onClearFilters={onClearFilters}
          />
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky header bar — breadcrumb, title, subcategories, toggle */}
      {(hasHeader || viewModeToggle) && (
        <div className="flex-shrink-0 border-b border-border bg-background z-20">
          <div className="flex items-start justify-between gap-4 px-4 md:px-6 lg:px-8 py-3">
            <div className="flex-1 min-w-0">
              {header}
            </div>
            {viewModeToggle && (
              <div className="flex-shrink-0 pt-1">
                {viewModeToggle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snap scroll container — takes remaining space */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
      >
        {allShorts.map((short, index) => (
          <div
            key={short.id}
            ref={setSlideRef(index)}
            data-slide-index={index}
            className="snap-start snap-always"
            style={{ height: scrollAreaHeight > 0 ? `${scrollAreaHeight}px` : '100%' }}
          >
            <FeedListItem
              short={short}
              state={getSlideState(index, activeIndex)}
            />
          </div>
        ))}

        {/* Loading next page indicator */}
        {isFetchingNextPage && (
          <div className="h-20 flex items-center justify-center snap-start">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground text-sm">{t('loading.more')}</span>
          </div>
        )}

        {/* End of feed */}
        {!hasNextPage && allShorts.length > 0 && (
          <div className="h-20 flex items-center justify-center snap-start">
            <p className="text-muted-foreground text-sm">{t('loading.endOfFeed')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
