"use client"

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { FeedFilters, FeedSortOption } from '@/lib/types/feed'

interface UseFeedFiltersReturn {
  filters: FeedFilters
  setFilters: (newFilters: Partial<FeedFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
}

export function useFeedFilters(): UseFeedFiltersReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo<FeedFilters>(() => ({
    sort: (searchParams.get('sort') as FeedSortOption) ?? 'algorithmic',
    categoryIds: searchParams.get('categoryIds')?.split(',').filter(Boolean),
    tags: searchParams.get('tags')?.split(',').filter(Boolean),
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
  }), [searchParams])

  const setFilters = useCallback((newFilters: Partial<FeedFilters>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false ||
          (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else if (typeof value === 'boolean') {
        if (value) params.set(key, 'true')
        else params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.categoryIds?.length ||
      filters.tags?.length ||
      filters.lat !== undefined ||
      filters.verifiedOnly
    )
  }, [filters.categoryIds?.length, filters.tags?.length, filters.lat, filters.verifiedOnly])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categoryIds?.length) count += filters.categoryIds.length
    if (filters.tags?.length) count += filters.tags.length
    if (filters.lat !== undefined) count += 1
    if (filters.verifiedOnly) count += 1
    return count
  }, [filters.categoryIds?.length, filters.tags?.length, filters.lat, filters.verifiedOnly])

  return { filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount }
}
