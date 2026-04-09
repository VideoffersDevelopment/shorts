"use client"

import { FeedGrid } from "@/components/feed/feed-grid"
import type { FeedFilters } from "@/lib/types/feed"

const trendingFilters: FeedFilters = {
  sort: "trending"
}

export function TrendingFeed() {
  return (
    <FeedGrid
      filters={trendingFilters}
      onExpandRadius={() => {}}
      onClearFilters={() => {}}
    />
  )
}
