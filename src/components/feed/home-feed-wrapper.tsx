"use client"

import { useCallback, useState, type ReactNode } from 'react'
import { FeedGrid } from './feed-grid'
import { FeedList } from './feed-list'
import { ViewModeToggle } from './view-mode-toggle'
import { useViewMode } from '@/hooks/use-view-mode'
import type { FeedFilters, FeedResponse, ViewMode } from '@/lib/types/feed'

interface HomeFeedWrapperProps {
  initialData: FeedResponse | null
  filters: FeedFilters
  defaultViewMode?: ViewMode
  /** Optional header (breadcrumb, title, chips) rendered inside the list scroll container */
  header?: ReactNode
}

export function HomeFeedWrapper({ initialData, filters, defaultViewMode = 'grid', header }: HomeFeedWrapperProps) {
  const [currentFilters, setCurrentFilters] = useState<FeedFilters>(filters)
  const { viewMode, setViewMode } = useViewMode(defaultViewMode)

  const handleExpandRadius = useCallback(() => {
    setCurrentFilters(prev => ({
      ...prev,
      radius: prev.radius ? prev.radius * 2 : 50,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setCurrentFilters({
      sort: 'algorithmic',
      categoryIds: undefined,
      tags: undefined,
      lat: undefined,
      lng: undefined,
      radius: undefined,
      verifiedOnly: undefined,
    })
  }, [])

  const toggle = <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />

  // List mode: full-bleed layout (removes parent padding), snap-scroll viewport
  if (viewMode === 'list') {
    return (
      <div data-full-bleed className="h-full">
        <FeedList
          initialData={initialData ?? undefined}
          filters={currentFilters}
          onExpandRadius={handleExpandRadius}
          onClearFilters={handleClearFilters}
          header={header}
          viewModeToggle={toggle}
        />
      </div>
    )
  }

  // Grid mode: standard padded layout
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {header ?? <div />}
        {toggle}
      </div>

      <FeedGrid
        initialData={initialData ?? undefined}
        filters={currentFilters}
        onExpandRadius={handleExpandRadius}
        onClearFilters={handleClearFilters}
      />
    </div>
  )
}
