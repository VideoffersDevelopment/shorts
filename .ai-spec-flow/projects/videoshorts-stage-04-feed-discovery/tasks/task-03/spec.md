# Task 03: Core Feed Components

## Overview

**Priority:** HIGH
**Dependencies:** task-02
**Complexity:** Medium (9 files, ~9k tokens)
**Status:** pending

## What to Build

Create core UI components for the public feed:
1. FeedGrid with infinite scroll (TanStack Query)
2. FeedCard with video preview on hover
3. FeedSkeleton loading state
4. EmptyState component variants
5. Modify home page to use dynamic feed

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/feed/feed-grid.tsx` | Create | Infinite scroll feed container |
| `src/components/feed/feed-card.tsx` | Create | Video card with hover preview |
| `src/components/feed/feed-skeleton.tsx` | Create | Loading skeleton grid |
| `src/components/feed/feed-video-preview.tsx` | Create | Autoplay video on hover |
| `src/components/feed/empty-state.tsx` | Create | No results / empty variants |
| `src/hooks/use-infinite-scroll.ts` | Create | Intersection Observer hook |
| `src/hooks/use-debounce.ts` | Create | Debounce utility hook (shared) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(main)/[locale]/page.tsx` | Convert from static to dynamic feed |

## Implementation Details

### 1. useInfiniteScroll Hook

```typescript
// src/hooks/use-infinite-scroll.ts
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
```

### 2. useDebounce Hook (Shared Utility)

```typescript
// src/hooks/use-debounce.ts
"use client"

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
```

### 3. FeedVideoPreview Component

```typescript
// src/components/feed/feed-video-preview.tsx
"use client"

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FeedVideoPreviewProps {
  src: string
  className?: string
  onError?: () => void
}

export function FeedVideoPreview({ src, className, onError }: FeedVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Autoplay muted
    video.muted = true
    video.loop = true
    video.playsInline = true

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented
        onError?.()
      })
    }

    return () => {
      video.pause()
    }
  }, [src, onError])

  return (
    <video
      ref={videoRef}
      src={src}
      className={cn('w-full h-full object-cover', className)}
      muted
      loop
      playsInline
    />
  )
}
```

### 4. FeedCard Component

```typescript
// src/components/feed/feed-card.tsx
"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { Play, Eye, Heart, MapPin, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FeedVideoPreview } from './feed-video-preview'
import type { FeedShort } from '@/lib/types/feed'

interface FeedCardProps {
  short: FeedShort
}

export function FeedCard({ short }: FeedCardProps) {
  const locale = useLocale()
  const [showPreview, setShowPreview] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleMouseEnter = () => {
    if (short.hlsPlaylistUrl) {
      setShowPreview(true)
    }
  }

  const handleMouseLeave = () => {
    setShowPreview(false)
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <Link
      href={`/${locale}/shorts/${short.id}`}
      className="group relative block"
    >
      <div
        className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thumbnail */}
        {short.thumbnailUrl && !imageError ? (
          <Image
            src={short.thumbnailUrl}
            alt={short.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Video Preview (on hover) */}
        {showPreview && short.hlsPlaylistUrl && (
          <div className="absolute inset-0 z-10">
            <FeedVideoPreview
              src={short.hlsPlaylistUrl}
              className="absolute inset-0"
              onError={() => setShowPreview(false)}
            />
          </div>
        )}

        {/* Play icon overlay (when not previewing) */}
        {!showPreview && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-black/50 p-4">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Stats badges (top) */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              {formatCount(short.views)}
            </Badge>
            {short.likes > 0 && (
              <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                <Heart className="h-3 w-3 mr-1" />
                {formatCount(short.likes)}
              </Badge>
            )}
          </div>

          {/* Distance badge */}
          {short.distance !== null && (
            <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {short.distance < 1
                ? `${Math.round(short.distance * 1000)}m`
                : `${short.distance.toFixed(1)}km`}
            </Badge>
          )}
        </div>

        {/* Content (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Title */}
          <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight">
            {short.title}
          </h3>

          {/* Company info */}
          <div className="flex items-center gap-2">
            {short.company.logo ? (
              <Image
                src={short.company.logo}
                alt={short.company.name}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {short.company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-white/90 text-xs truncate flex-1">
              {short.company.name}
            </span>
            {short.company.verified && (
              <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
            )}
          </div>

          {/* Location */}
          {short.location && (
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{short.location}</span>
            </div>
          )}
        </div>

        {/* CTA indicator */}
        {short.ctaLink && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground text-xs">
              CTA
            </Badge>
          </div>
        )}
      </div>
    </Link>
  )
}
```

### 5. FeedSkeleton Component

```typescript
// src/components/feed/feed-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface FeedSkeletonProps {
  count?: number
  className?: string
}

export function FeedSkeleton({ count = 8, className }: FeedSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('relative aspect-[9/16] rounded-2xl overflow-hidden', className)}
        >
          <Skeleton className="absolute inset-0" />

          {/* Stats placeholder */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Content placeholder */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function FeedGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <FeedSkeleton count={10} />
    </div>
  )
}
```

### 6. EmptyState Component

```typescript
// src/components/feed/empty-state.tsx
"use client"

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Video, Users, SearchX, MapPin, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateVariant = 'no-shorts' | 'no-following' | 'no-search-results'

interface EmptyStateProps {
  variant: EmptyStateVariant
  query?: string
  onExpandRadius?: () => void
  onClearFilters?: () => void
}

export function EmptyState({
  variant,
  query,
  onExpandRadius,
  onClearFilters,
}: EmptyStateProps) {
  const t = useTranslations('feed')
  const tSearch = useTranslations('search')
  const locale = useLocale()

  const configs: Record<EmptyStateVariant, {
    icon: typeof Video
    title: string
    description: string
    actions: Array<{
      label: string
      onClick?: () => void
      href?: string
      variant?: 'default' | 'outline'
    }>
  }> = {
    'no-shorts': {
      icon: Video,
      title: t('empty.noShorts.title'),
      description: t('empty.noShorts.description'),
      actions: [
        ...(onExpandRadius ? [{
          label: t('empty.noShorts.expandRadius'),
          onClick: onExpandRadius,
          variant: 'outline' as const,
        }] : []),
        ...(onClearFilters ? [{
          label: t('empty.noShorts.clearFilters'),
          onClick: onClearFilters,
          variant: 'outline' as const,
        }] : []),
        {
          label: t('empty.noShorts.browseAll'),
          href: `/${locale}`,
        },
      ],
    },
    'no-following': {
      icon: Users,
      title: t('empty.noFollowing.title'),
      description: t('empty.noFollowing.description'),
      actions: [
        {
          label: t('empty.noFollowing.discoverCta'),
          href: `/${locale}`,
        },
      ],
    },
    'no-search-results': {
      icon: SearchX,
      title: tSearch('results.noResults.title', { query: query ?? '' }),
      description: tSearch('results.noResults.description'),
      actions: [],
    },
  }

  const config = configs[variant]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md">{config.description}</p>

      {config.actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {config.actions.map((action, i) =>
            action.href ? (
              <Button key={i} variant={action.variant ?? 'default'} asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button
                key={i}
                variant={action.variant ?? 'default'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
```

### 7. FeedGrid Component

```typescript
// src/components/feed/feed-grid.tsx
"use client"

import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { FeedCard } from './feed-card'
import { FeedSkeleton } from './feed-skeleton'
import { EmptyState } from './empty-state'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import type { FeedFilters, FeedResponse, FeedShort } from '@/lib/types/feed'

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

  return response.json()
}

export function FeedGrid({
  initialData,
  filters,
  onExpandRadius,
  onClearFilters,
}: FeedGridProps) {
  const t = useTranslations('feed')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: ({ pageParam = 1 }) => fetchFeed({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialData: initialData
      ? { pages: [initialData], pageParams: [1] }
      : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: () => fetchNextPage(),
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
  })

  // Refetch when filters change
  useEffect(() => {
    refetch()
  }, [filters, refetch])

  const allShorts = data?.pages.flatMap((page) => page.shorts) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

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
          {t('loading.skeleton')}
        </p>
      )}
    </div>
  )
}
```

### 8. Home Page Modification

```typescript
// src/app/(main)/[locale]/page.tsx - MODIFY
// Add these imports and replace static content with dynamic FeedGrid

import { FeedGrid } from '@/components/feed/feed-grid'
import { FeedGridSkeleton } from '@/components/feed/feed-skeleton'
import type { FeedFilters, FeedResponse } from '@/lib/types/feed'

// Parse search params into filters
function parseFilters(searchParams: Record<string, string | undefined>): FeedFilters {
  return {
    sort: (searchParams.sort as FeedFilters['sort']) ?? 'algorithmic',
    categoryIds: searchParams.categoryIds?.split(',').filter(Boolean),
    tags: searchParams.tags?.split(',').filter(Boolean),
    lat: searchParams.lat ? parseFloat(searchParams.lat) : undefined,
    lng: searchParams.lng ? parseFloat(searchParams.lng) : undefined,
    radius: searchParams.radius ? parseInt(searchParams.radius) : undefined,
    verifiedOnly: searchParams.verifiedOnly === 'true',
  }
}

// Server-side initial fetch
async function getInitialFeed(filters: FeedFilters): Promise<FeedResponse | null> {
  try {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('sort', filters.sort)
    // ... add other params

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/feed?${params.toString()}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

// In the page component, add FeedGrid:
// <FeedGrid initialData={initialData} filters={filters} />
```

## Acceptance Criteria

- [ ] FeedGrid displays shorts from API
- [ ] Infinite scroll loads more shorts at bottom
- [ ] FeedCard shows thumbnail, title, company, stats
- [ ] FeedCard hover shows video preview (if HLS URL exists)
- [ ] FeedCard click navigates to short detail page
- [ ] FeedSkeleton shows during initial load
- [ ] EmptyState shows when no shorts found
- [ ] EmptyState "no-following" variant works
- [ ] Distance badge shows when lat/lng provided
- [ ] Home page loads with dynamic feed
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Published shorts in database

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to home | Feed grid loads | `/` or `/pl` |
| 2 | Wait for load | Cards visible | `.grid > a` (feed cards) |
| 3 | Scroll to bottom | More shorts load | Observe new cards appear |
| 4 | Hover over card | Video preview plays | Check for `<video>` element |
| 5 | Click card | Navigate to short | URL changes to `/shorts/[id]` |

### Screenshot Checkpoints
- `01-feed-loading.png` - Skeleton loading state
- `02-feed-loaded.png` - Grid with cards
- `03-card-hover.png` - Card with video preview
- `04-infinite-scroll.png` - After scrolling, more cards loaded

## Notes

1. **Video Preview:** Uses native HTML5 video with HLS URL. Falls back gracefully if autoplay blocked.

2. **Image Optimization:** Uses Next.js Image with responsive sizes for performance.

3. **Infinite Scroll:** Uses Intersection Observer with 100px root margin for smooth prefetching.

4. **TanStack Query:** Provides caching, deduplication, and background refetching.
