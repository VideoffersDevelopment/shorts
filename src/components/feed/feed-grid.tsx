"use client"

import { useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { FeedCard } from './feed-card'
import { FeedSkeleton } from './feed-skeleton'
import { EmptyState } from './empty-state'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { useTranslations } from '@/lib/i18n/client'
import type { FeedFilters, FeedResponse } from '@/lib/types/feed'

interface FeedGridProps {
  initialData?: FeedResponse
  filters: FeedFilters
  onExpandRadius?: () => void
  onClearFilters?: () => void
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

export function FeedGrid({
  initialData,
  filters,
  onExpandRadius,
  onClearFilters,
}: FeedGridProps) {
  const { t } = useTranslations('feed')

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
    staleTime: 1000 * 30, // 30 seconds — keep feed fresh for likes/comments updates
  })

  const handleLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
  })

  const allShorts = data?.pages.flatMap((page) => page.shorts) ?? []

  // Loading state
  if (isLoading && !initialData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <FeedSkeleton count={10} />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <EmptyState
        variant="no-shorts"
        onClearFilters={onClearFilters}
      />
    )
  }

  // Empty state
  if (allShorts.length === 0) {
    // Check if it's "following" sort with no results
    if (filters.sort === 'following') {
      return (
        <EmptyState
          variant="no-following"
        />
      )
    }

    return (
      <EmptyState
        variant="no-shorts"
        onExpandRadius={onExpandRadius}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {allShorts.map((short) => (
          <FeedCard key={short.id} short={short} />
        ))}

        {/* Loading more skeletons */}
        {isFetchingNextPage && <FeedSkeleton count={5} />}
      </div>

      {/* Load more sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t('loading.more')}</span>
        </div>
      )}

      {/* End of content */}
      {!hasNextPage && allShorts.length > 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          {t('loading.endOfFeed')}
        </p>
      )}
    </div>
  )
}
