# Task 01: Database Setup

## Overview

**Priority:** HIGH
**Dependencies:** None
**Complexity:** Simple (6 files, ~6k tokens)
**Status:** pending

## What to Build

Set up database infrastructure for Feed + Discovery feature:
1. Enable PostgreSQL extensions (PostGIS, pg_trgm) in Neon DB
2. Create SQL migration with performance indexes
3. Create utility functions for distance calculation and scoring

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `prisma/migrations/[timestamp]_feed_discovery_indexes/migration.sql` | Create | SQL indexes for feed performance |
| `src/lib/utils/haversine.ts` | Create | Haversine distance calculation function |
| `src/lib/utils/feed-scoring.ts` | Create | Algorithmic scoring utilities |
| `src/lib/types/feed.ts` | Create | Feed-related TypeScript types |

## Files to Modify

| File | Changes |
|------|---------|
| None | - |

## Implementation Details

### 1. SQL Migration

Create migration file with all required indexes:

```sql
-- Enable extensions (run in Neon console first if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Published shorts index (partial index for feed queries)
CREATE INDEX IF NOT EXISTS idx_shorts_published
ON "Short"("publishedAt" DESC)
WHERE status = 'PUBLISHED';

-- Category filter on published shorts
CREATE INDEX IF NOT EXISTS idx_shorts_category_published
ON "Short"("categoryId")
WHERE status = 'PUBLISHED';

-- Geospatial index (composite for lat/lng queries)
CREATE INDEX IF NOT EXISTS idx_shorts_location
ON "Short"(latitude, longitude)
WHERE status = 'PUBLISHED' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search index (Polish dictionary)
CREATE INDEX IF NOT EXISTS idx_shorts_search
ON "Short" USING GIN(
  to_tsvector('polish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Trigram index for fuzzy title matching
CREATE INDEX IF NOT EXISTS idx_shorts_title_trigram
ON "Short" USING GIST(title gist_trgm_ops);

-- Company name search for autocomplete
CREATE INDEX IF NOT EXISTS idx_company_name_trigram
ON "CompanyProfile" USING GIST("companyName" gist_trgm_ops);

-- Tags search index
CREATE INDEX IF NOT EXISTS idx_tags_search
ON "Tag" USING GIN(to_tsvector('polish', name));

-- ShortStats join optimization
CREATE INDEX IF NOT EXISTS idx_short_stats_shortid
ON "ShortStats"("shortId");

-- Tags by usage (for popular tags)
CREATE INDEX IF NOT EXISTS idx_tags_usage
ON "Tag"("usageCount" DESC);
```

### 2. Haversine Distance Function

```typescript
// src/lib/utils/haversine.ts
export interface LatLng {
  lat: number
  lng: number
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function haversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Check if point is within radius (km) of center
 */
export function isWithinRadius(
  center: LatLng,
  point: LatLng,
  radiusKm: number
): boolean {
  return haversineDistance(center, point) <= radiusKm
}
```

### 3. Feed Scoring Utilities

```typescript
// src/lib/utils/feed-scoring.ts
import { haversineDistance, type LatLng } from './haversine'

export interface ScoreableShort {
  publishedAt: Date
  stats?: {
    views: number
    likes: number
    comments?: number
    ctaClicks: number
  } | null
  latitude?: number | null
  longitude?: number | null
}

export interface ScoringOptions {
  userLocation?: LatLng
  weights?: {
    recency: number
    engagement: number
    geo: number
    personalization: number
  }
}

const DEFAULT_WEIGHTS = {
  recency: 0.20,
  engagement: 0.50,
  geo: 0.10,
  personalization: 0.20,
}

/**
 * Calculate algorithmic score for a short
 */
export function calculateScore(
  short: ScoreableShort,
  options: ScoringOptions = {}
): number {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights }

  // Recency score (exponential decay, 7-day half-life)
  const recencyScore = calculateRecencyScore(short.publishedAt)

  // Engagement score
  const engagementScore = calculateEngagementScore(short.stats)

  // Geo score (if user location available)
  const geoScore = calculateGeoScore(short, options.userLocation)

  // Personalization placeholder (Stage 5)
  const personalizationScore = 0.5

  return (
    recencyScore * weights.recency +
    engagementScore * weights.engagement +
    geoScore * weights.geo +
    personalizationScore * weights.personalization
  )
}

function calculateRecencyScore(publishedAt: Date): number {
  const now = Date.now()
  const published = new Date(publishedAt).getTime()
  const ageInHours = (now - published) / (1000 * 60 * 60)

  // Exponential decay: 168h = 7 days half-life
  return Math.exp(-ageInHours / 168)
}

function calculateEngagementScore(stats: ScoreableShort['stats']): number {
  if (!stats) return 0.1 // Minimal score for new content

  const views = stats.views || 1
  const likes = stats.likes || 0
  const comments = stats.comments || 0
  const ctaClicks = stats.ctaClicks || 0

  // Weighted engagement rate
  const engagementRate = (likes + comments * 2 + ctaClicks * 3) / views

  // Cap at 1.0
  return Math.min(engagementRate * 10, 1)
}

function calculateGeoScore(
  short: ScoreableShort,
  userLocation?: LatLng
): number {
  if (!userLocation || !short.latitude || !short.longitude) {
    return 0.5 // Neutral score
  }

  const distance = haversineDistance(userLocation, {
    lat: short.latitude,
    lng: short.longitude,
  })

  if (distance < 5) return 1.0      // < 5km = full boost
  if (distance < 25) return 0.7     // < 25km = partial boost
  return 0.3                         // > 25km = minimal
}

/**
 * Apply diversity filter: max N shorts per company
 */
export function applyDiversityFilter<T extends { company: { id: string } }>(
  shorts: T[],
  maxPerCompany: number = 2,
  inTopN: number = 20
): T[] {
  const companyCount = new Map<string, number>()
  const result: T[] = []
  const deferred: T[] = []

  for (const short of shorts) {
    const count = companyCount.get(short.company.id) || 0

    if (count < maxPerCompany && result.length < inTopN) {
      result.push(short)
      companyCount.set(short.company.id, count + 1)
    } else {
      deferred.push(short)
    }
  }

  return [...result, ...deferred]
}
```

### 4. Feed Types

```typescript
// src/lib/types/feed.ts
export type FeedSortOption =
  | 'algorithmic'
  | 'newest'
  | 'popular'
  | 'trending'
  | 'following'

export interface FeedFilters {
  sort: FeedSortOption
  categoryIds?: string[]
  tags?: string[]
  lat?: number
  lng?: number
  radius?: number
  verifiedOnly?: boolean
}

export interface FeedShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: string
  views: number
  likes: number
  ctaClicks: number
  location: string | null
  distance: number | null
  company: {
    id: string
    name: string
    slug: string
    logo: string | null
    verified: boolean
  }
  category: {
    id: string
    name: string
    slug: string
  }
  ctaLink: string | null
}

export interface FeedResponse {
  shorts: FeedShort[]
  nextPage: number | null
  totalCount: number
  hasMore: boolean
}
```

## Acceptance Criteria

- [ ] SQL migration file created with all required indexes
- [ ] Extensions (pg_trgm) confirmed enabled in Neon DB
- [ ] `haversineDistance` function correctly calculates distances
- [ ] `calculateScore` function returns scores between 0-1
- [ ] `applyDiversityFilter` limits company representation
- [ ] FeedFilters and FeedShort types exported
- [ ] `npx prisma migrate deploy` succeeds
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Notes

1. **PostGIS Extension:** While the brief mentions PostGIS, the codebase uses simple lat/lng fields. The haversine formula provides accurate distance calculation without PostGIS dependency. If PostGIS is needed later, it can be added.

2. **pg_trgm Extension:** Must be enabled in Neon DB console before migration:
   - Go to Neon Dashboard > Your Project > SQL Editor
   - Run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

3. **Index Naming:** All indexes use `IF NOT EXISTS` for idempotency.

4. **Polish Dictionary:** The `to_tsvector('polish', ...)` requires PostgreSQL Polish dictionary. Neon DB includes it by default.
