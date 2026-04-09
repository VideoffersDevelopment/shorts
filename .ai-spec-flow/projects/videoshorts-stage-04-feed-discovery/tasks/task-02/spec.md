# Task 02: Feed API

## Overview

**Priority:** HIGH
**Dependencies:** task-01
**Complexity:** Medium (8 files, ~8k tokens)
**Status:** pending

## What to Build

Create the main Feed API endpoint with filtering, sorting, and pagination:
1. GET /api/feed endpoint
2. Query building with all filter options
3. Sorting implementations (algorithmic, newest, popular, trending, following)
4. Pagination with cursor-based next page

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/api/feed/route.ts` | Create | Main feed API endpoint |
| `src/lib/api/feed-query-builder.ts` | Create | Query building utilities |
| `src/lib/validation/feed.ts` | Create | Zod schemas for feed params |

## Files to Modify

| File | Changes |
|------|---------|
| None | - |

## Implementation Details

### 1. Feed Validation Schema

```typescript
// src/lib/validation/feed.ts
import { z } from 'zod'

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['algorithmic', 'newest', 'popular', 'trending', 'following']).default('algorithmic'),
  categoryIds: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  tags: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
  verifiedOnly: z.string().optional().transform(val => val === 'true'),
})

export type FeedQueryParams = z.infer<typeof feedQuerySchema>
```

### 2. Query Builder

```typescript
// src/lib/api/feed-query-builder.ts
import { Prisma } from '@prisma/client'
import type { FeedQueryParams } from '@/lib/validation/feed'
import { haversineDistance } from '@/lib/utils/haversine'

export function buildFeedWhereClause(params: FeedQueryParams): Prisma.ShortWhereInput {
  const where: Prisma.ShortWhereInput = {
    status: 'PUBLISHED',
  }

  // Category filter
  if (params.categoryIds?.length) {
    where.categoryId = { in: params.categoryIds }
  }

  // Tags filter
  if (params.tags?.length) {
    where.tags = {
      some: {
        tag: {
          slug: { in: params.tags }
        }
      }
    }
  }

  // Verified companies only
  if (params.verifiedOnly) {
    where.company = {
      viesVerified: true
    }
  }

  // Location filter (basic - full filtering done post-query for accuracy)
  if (params.lat !== undefined && params.lng !== undefined && params.radius) {
    // Bounding box for initial filtering (optimization)
    const latDelta = params.radius / 111 // ~111km per degree latitude
    const lngDelta = params.radius / (111 * Math.cos(params.lat * Math.PI / 180))

    where.latitude = {
      gte: params.lat - latDelta,
      lte: params.lat + latDelta,
    }
    where.longitude = {
      gte: params.lng - lngDelta,
      lte: params.lng + lngDelta,
    }
  }

  return where
}

export function buildFeedOrderBy(
  sort: FeedQueryParams['sort']
): Prisma.ShortOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }]

    case 'popular':
      // Order by engagement (views + likes*2) in last 7 days
      // Note: For complex ordering, we'll sort in application layer
      return [{ publishedAt: 'desc' }] // Fallback, real sorting in app

    case 'trending':
      // Similar to popular, but emphasizes recent engagement
      return [{ publishedAt: 'desc' }]

    case 'following':
      // Requires user context, sorted by publishedAt
      return [{ publishedAt: 'desc' }]

    case 'algorithmic':
    default:
      // Algorithmic sorting done in application layer after fetch
      return [{ publishedAt: 'desc' }]
  }
}

export function buildFeedSelect(): Prisma.ShortSelect {
  return {
    id: true,
    title: true,
    thumbnailUrl: true,
    hlsPlaylistUrl: true,
    duration: true,
    publishedAt: true,
    latitude: true,
    longitude: true,
    ctaLink: true,
    stats: {
      select: {
        views: true,
        likes: true,
        ctaClicks: true,
      }
    },
    company: {
      select: {
        id: true,
        companyName: true,
        slug: true,
        logo: true,
        viesVerified: true,
        city: true,
      }
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      }
    }
  }
}
```

### 3. Feed API Route

```typescript
// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feedQuerySchema } from '@/lib/validation/feed'
import {
  buildFeedWhereClause,
  buildFeedOrderBy,
  buildFeedSelect,
} from '@/lib/api/feed-query-builder'
import { calculateScore, applyDiversityFilter } from '@/lib/utils/feed-scoring'
import { haversineDistance } from '@/lib/utils/haversine'
import type { FeedShort, FeedResponse } from '@/lib/types/feed'

export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    const params = feedQuerySchema.parse(rawParams)

    // For 'following' sort, require authentication
    let userId: string | undefined
    if (params.sort === 'following') {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required for following feed' },
          { status: 401 }
        )
      }
      userId = session.user.id
    }

    // Build query
    const where = buildFeedWhereClause(params)
    const orderBy = buildFeedOrderBy(params.sort)
    const select = buildFeedSelect()

    // For 'following' sort, filter by followed companies
    // Note: Follow model not yet implemented - return empty for now
    if (params.sort === 'following') {
      // TODO: Implement when Follow model is created in Stage 5
      return NextResponse.json({
        shorts: [],
        nextPage: null,
        totalCount: 0,
        hasMore: false,
      } satisfies FeedResponse)
    }

    // Fetch with overfetch for algorithmic sorting
    const overfetchMultiplier = params.sort === 'algorithmic' ? 3 : 1
    const fetchLimit = params.limit * overfetchMultiplier

    const [total, shorts] = await Promise.all([
      prisma.short.count({ where }),
      prisma.short.findMany({
        where,
        select,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: fetchLimit,
      }),
    ])

    // Transform to FeedShort format
    let feedShorts: FeedShort[] = shorts.map(short => {
      const userLocation = params.lat !== undefined && params.lng !== undefined
        ? { lat: params.lat, lng: params.lng }
        : undefined

      const distance = userLocation && short.latitude && short.longitude
        ? haversineDistance(userLocation, { lat: short.latitude, lng: short.longitude })
        : null

      return {
        id: short.id,
        title: short.title,
        thumbnailUrl: short.thumbnailUrl,
        hlsPlaylistUrl: short.hlsPlaylistUrl,
        duration: short.duration,
        publishedAt: short.publishedAt.toISOString(),
        views: short.stats?.views ?? 0,
        likes: short.stats?.likes ?? 0,
        ctaClicks: short.stats?.ctaClicks ?? 0,
        location: short.company?.city ?? null,
        distance: distance !== null ? Math.round(distance * 10) / 10 : null,
        company: {
          id: short.company!.id,
          name: short.company!.companyName,
          slug: short.company!.slug,
          logo: short.company!.logo,
          verified: short.company!.viesVerified,
        },
        category: {
          id: short.category!.id,
          name: short.category!.name,
          slug: short.category!.slug,
        },
        ctaLink: short.ctaLink,
      }
    })

    // Apply distance filter for geolocation (accurate post-fetch filtering)
    if (params.lat !== undefined && params.lng !== undefined && params.radius) {
      feedShorts = feedShorts.filter(short =>
        short.distance !== null && short.distance <= params.radius!
      )
    }

    // Apply sorting
    if (params.sort === 'algorithmic') {
      const userLocation = params.lat !== undefined && params.lng !== undefined
        ? { lat: params.lat, lng: params.lng }
        : undefined

      // Calculate scores and sort
      const scoredShorts = feedShorts.map(short => ({
        ...short,
        _score: calculateScore({
          publishedAt: new Date(short.publishedAt),
          stats: {
            views: short.views,
            likes: short.likes,
            ctaClicks: short.ctaClicks,
          },
          latitude: short.distance !== null ? params.lat : null,
          longitude: short.distance !== null ? params.lng : null,
        }, { userLocation }),
      }))

      scoredShorts.sort((a, b) => b._score - a._score)

      // Apply diversity filter
      feedShorts = applyDiversityFilter(scoredShorts, 2, 20).slice(0, params.limit)
    } else if (params.sort === 'popular') {
      // Sort by engagement score
      feedShorts.sort((a, b) => {
        const scoreA = a.views + a.likes * 2
        const scoreB = b.views + b.likes * 2
        return scoreB - scoreA
      })
      feedShorts = feedShorts.slice(0, params.limit)
    } else if (params.sort === 'trending') {
      // Sort by engagement rate (recent content weighted higher)
      feedShorts.sort((a, b) => {
        const now = Date.now()
        const ageA = (now - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60)
        const ageB = (now - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60)

        const recencyBoostA = Math.exp(-ageA / 24)
        const recencyBoostB = Math.exp(-ageB / 24)

        const rateA = (a.views > 0 ? (a.likes + a.ctaClicks) / a.views : 0) * recencyBoostA
        const rateB = (b.views > 0 ? (b.likes + b.ctaClicks) / b.views : 0) * recencyBoostB

        return rateB - rateA
      })
      feedShorts = feedShorts.slice(0, params.limit)
    } else {
      feedShorts = feedShorts.slice(0, params.limit)
    }

    // Calculate pagination
    const hasMore = params.page * params.limit < total
    const nextPage = hasMore ? params.page + 1 : null

    return NextResponse.json({
      shorts: feedShorts,
      nextPage,
      totalCount: total,
      hasMore,
    } satisfies FeedResponse)

  } catch (error) {
    console.error('Feed API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Acceptance Criteria

- [ ] GET /api/feed returns paginated shorts
- [ ] Query params validated: page, limit, sort, categoryIds, tags, lat, lng, radius, verifiedOnly
- [ ] Sorting works: algorithmic, newest, popular, trending
- [ ] Following sort returns empty array with message (Stage 5 dependency)
- [ ] Category filtering works (single and multiple)
- [ ] Tag filtering works (single and multiple)
- [ ] Verified-only filter works
- [ ] Location filtering works with radius
- [ ] Distance is calculated and returned when lat/lng provided
- [ ] Diversity filter applied (max 2 per company in top 20)
- [ ] Pagination returns correct nextPage and hasMore
- [ ] Response matches FeedResponse type
- [ ] Invalid params return 400 error
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- At least one published short in database

### Steps

| Step | Action | Expected Result | URL/Notes |
|------|--------|-----------------|-----------|
| 1 | GET /api/feed | Returns shorts array | `/api/feed` |
| 2 | GET /api/feed?sort=newest | Sorted by publishedAt DESC | `/api/feed?sort=newest` |
| 3 | GET /api/feed?limit=5 | Returns max 5 shorts | `/api/feed?limit=5` |
| 4 | GET /api/feed?verifiedOnly=true | Only verified companies | Check company.verified=true |
| 5 | GET /api/feed?lat=52&lng=21&radius=10 | Returns shorts with distance | Check distance field |

## Notes

1. **Following Sort:** Returns empty array until Follow model is implemented in Stage 5.

2. **Overfetching:** For algorithmic sort, we fetch 3x the limit to have enough data for scoring and diversity filtering.

3. **Distance Calculation:** Done in application layer for accuracy. PostgreSQL bounding box used for initial filtering optimization.

4. **Performance:** Complex sorting (algorithmic, popular, trending) done post-fetch. Consider caching for production.
