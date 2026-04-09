"use client"

import { useCallback } from 'react'
import { SortDropdown } from './sort-dropdown'
import { FilterPanel } from './filter-panel'
import { useFeedFilters } from '@/hooks/use-feed-filters'
import type { FeedSortOption, FeedFilters } from '@/lib/types/feed'

export function HeaderFilterControls() {
  const { filters, setFilters, activeFilterCount } = useFeedFilters()

  const handleSortChange = useCallback((sort: FeedSortOption) => {
    setFilters({ sort })
  }, [setFilters])

  const handleFiltersChange = useCallback((newFilters: Partial<FeedFilters>) => {
    setFilters(newFilters)
  }, [setFilters])

  return (
    <div className="flex items-center gap-2">
      <SortDropdown
        value={filters.sort}
        onChange={handleSortChange}
      />
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeFilterCount={activeFilterCount}
      />
    </div>
  )
}
