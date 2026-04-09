"use client"

import { useCallback, useState } from 'react'
import { FeedGrid } from './feed-grid'
import type { FeedFilters, FeedResponse } from '@/lib/types/feed'

interface HomeFeedWrapperProps {
  initialData: FeedResponse | null
  filters: FeedFilters
}

export function HomeFeedWrapper({ initialData, filters }: HomeFeedWrapperProps) {
  const [currentFilters, setCurrentFilters] = useState<FeedFilters>(filters)

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

  return (
    <FeedGrid
      initialData={initialData ?? undefined}
      filters={currentFilters}
      onExpandRadius={handleExpandRadius}
      onClearFilters={handleClearFilters}
    />
  )
}
