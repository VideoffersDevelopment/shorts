# Task 05: Search API

## Overview

**Priority:** MEDIUM
**Dependencies:** task-01
**Complexity:** Simple (4 files, ~4k tokens)
**Status:** pending

## What to Build

Create search API endpoints with full-text search:
1. GET /api/search - main search endpoint
2. GET /api/search/suggestions - autocomplete suggestions
3. PostgreSQL full-text search with tsvector and pg_trgm

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/api/search/route.ts` | Create | Main search endpoint |
| `src/app/api/search/suggestions/route.ts` | Create | Autocomplete suggestions |
| `src/lib/validation/search.ts` | Create | Zod schemas for search params |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types/feed.ts` | Add search-related types |

## Implementation Details

### 1. Search Types

```typescript
// Add to src/lib/types/feed.ts

export interface SearchResult {
  type: 'short' | 'company'
  data: FeedShort | CompanyResult
  rank: number
}

export interface CompanyResult {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  nextPage: number | null
  query: string
}

export interface SuggestionsResponse {
  recent: string[]
  popular: string[]
  shorts: ShortSuggestion[]
  companies: CompanySuggestion[]
}

export interface ShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

export interface CompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}
```

### 2. Search Validation Schema

```typescript
// src/lib/validation/search.ts
import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  type: z.enum(['all', 'shorts', 'companies']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryIds: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
})

export const suggestionsQuerySchema = z.object({
  q: z.string().min(1, 'Query must be at least 1 character'),
})

export type SearchQueryParams = z.infer<typeof searchQuerySchema>
export type SuggestionsQueryParams = z.infer<typeof suggestionsQuerySchema>
```

### 3. Search API Route

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchQuerySchema } from '@/lib/validation/search'
import { haversineDistance } from '@/lib/utils/haversine'
import type {
  SearchResponse,
  SearchResult,
  FeedShort,
  CompanyResult,
} from '@/lib/types/feed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    const params = searchQuerySchema.parse(rawParams)
    const { q, type, page, limit, categoryIds, lat, lng, radius } = params

    const results: SearchResult[] = []
    let totalCount = 0

    // Search shorts
    if (type === 'all' || type === 'shorts') {
      const shortsResults = await searchShorts(q, {
        categoryIds,
        lat,
        lng,
        radius,
        limit: type === 'shorts' ? limit : Math.floor(limit / 2),
        offset: type === 'shorts' ? (page - 1) * limit : 0,
      })

      results.push(
        ...shortsResults.items.map((short, index) => ({
          type: 'short' as const,
          data: short,
          rank: shortsResults.ranks[index] ?? 0,
        }))
      )

      if (type === 'shorts') {
        totalCount = shortsResults.total
      }
    }

    // Search companies
    if (type === 'all' || type === 'companies') {
      const companiesResults = await searchCompanies(q, {
        limit: type === 'companies' ? limit : Math.floor(limit / 2),
        offset: type === 'companies' ? (page - 1) * limit : 0,
      })

      results.push(
        ...companiesResults.items.map((company, index) => ({
          type: 'company' as const,
          data: company,
          rank: companiesResults.ranks[index] ?? 0,
        }))
      )

      if (type === 'companies') {
        totalCount = companiesResults.total
      }
    }

    // For "all" type, estimate total
    if (type === 'all') {
      totalCount = results.length
    }

    // Sort by rank (descending)
    results.sort((a, b) => b.rank - a.rank)

    // Calculate pagination
    const hasMore = page * limit < totalCount
    const nextPage = hasMore ? page + 1 : null

    return NextResponse.json({
      results,
      totalCount,
      nextPage,
      query: q,
    } satisfies SearchResponse)

  } catch (error) {
    console.error('Search API error:', error)

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

interface SearchOptions {
  categoryIds?: string[]
  lat?: number
  lng?: number
  radius?: number
  limit: number
  offset: number
}

async function searchShorts(
  query: string,
  options: SearchOptions
): Promise<{ items: FeedShort[]; ranks: number[]; total: number }> {
  const { categoryIds, lat, lng, radius, limit, offset } = options

  // Build WHERE conditions
  const conditions: string[] = [`s.status = 'PUBLISHED'`]
  const params: unknown[] = []
  let paramIndex = 1

  // Full-text search condition
  conditions.push(`(
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
    @@ plainto_tsquery('polish', $${paramIndex})
    OR s.title % $${paramIndex}
  )`)
  params.push(query)
  paramIndex++

  // Category filter
  if (categoryIds?.length) {
    conditions.push(`s."categoryId" = ANY($${paramIndex}::text[])`)
    params.push(categoryIds)
    paramIndex++
  }

  // Location filter (bounding box)
  if (lat !== undefined && lng !== undefined && radius) {
    const latDelta = radius / 111
    const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180))

    conditions.push(`s.latitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
    params.push(lat - latDelta, lat + latDelta)
    paramIndex += 2

    conditions.push(`s.longitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
    params.push(lng - lngDelta, lng + lngDelta)
    paramIndex += 2
  }

  const whereClause = conditions.join(' AND ')

  // Count query
  const countQuery = `SELECT COUNT(*) as count FROM "Short" s WHERE ${whereClause}`
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    countQuery,
    ...params
  )
  const total = Number(countResult[0]?.count ?? 0)

  // Search query with ranking
  const searchQuery = `
    SELECT
      s.id,
      s.title,
      s."thumbnailUrl",
      s."hlsPlaylistUrl",
      s.duration,
      s."publishedAt",
      s.latitude,
      s.longitude,
      s."ctaLink",
      ss.views,
      ss.likes,
      ss."ctaClicks",
      c.id as "companyId",
      c."companyName",
      c.slug as "companySlug",
      c.logo as "companyLogo",
      c."viesVerified" as "companyVerified",
      c.city,
      cat.id as "categoryId",
      cat.name as "categoryName",
      cat.slug as "categorySlug",
      ts_rank(
        to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
        plainto_tsquery('polish', $1)
      ) + similarity(s.title, $1) as rank
    FROM "Short" s
    LEFT JOIN "ShortStats" ss ON ss."shortId" = s.id
    LEFT JOIN "CompanyProfile" c ON c.id = s."companyId"
    LEFT JOIN "Category" cat ON cat.id = s."categoryId"
    WHERE ${whereClause}
    ORDER BY rank DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  params.push(limit, offset)

  const rows = await prisma.$queryRawUnsafe<RawShortRow[]>(searchQuery, ...params)

  const items: FeedShort[] = rows.map((row) => {
    const distance = lat !== undefined && lng !== undefined && row.latitude && row.longitude
      ? haversineDistance({ lat, lng }, { lat: row.latitude, lng: row.longitude })
      : null

    return {
      id: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnailUrl,
      hlsPlaylistUrl: row.hlsPlaylistUrl,
      duration: row.duration,
      publishedAt: row.publishedAt.toISOString(),
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      ctaClicks: row.ctaClicks ?? 0,
      location: row.city,
      distance: distance !== null ? Math.round(distance * 10) / 10 : null,
      company: {
        id: row.companyId,
        name: row.companyName,
        slug: row.companySlug,
        logo: row.companyLogo,
        verified: row.companyVerified,
      },
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug,
      },
      ctaLink: row.ctaLink,
    }
  })

  const ranks = rows.map((row) => row.rank as number)

  return { items, ranks, total }
}

interface RawShortRow {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: Date
  latitude: number | null
  longitude: number | null
  ctaLink: string | null
  views: number | null
  likes: number | null
  ctaClicks: number | null
  companyId: string
  companyName: string
  companySlug: string
  companyLogo: string | null
  companyVerified: boolean
  city: string | null
  categoryId: string
  categoryName: string
  categorySlug: string
  rank: number
}

async function searchCompanies(
  query: string,
  options: { limit: number; offset: number }
): Promise<{ items: CompanyResult[]; ranks: number[]; total: number }> {
  const { limit, offset } = options

  // Count query
  const countQuery = `
    SELECT COUNT(*) as count
    FROM "CompanyProfile" c
    WHERE c."companyName" % $1
  `
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    countQuery,
    query
  )
  const total = Number(countResult[0]?.count ?? 0)

  // Search query
  const searchQuery = `
    SELECT
      c.id,
      c."companyName" as name,
      c.slug,
      c.logo,
      c."viesVerified" as verified,
      cat.name as category,
      (SELECT COUNT(*) FROM "Short" s WHERE s."companyId" = c.id AND s.status = 'PUBLISHED') as "shortsCount",
      similarity(c."companyName", $1) as rank
    FROM "CompanyProfile" c
    LEFT JOIN "Category" cat ON cat.id = c."categoryId"
    WHERE c."companyName" % $1
    ORDER BY rank DESC
    LIMIT $2 OFFSET $3
  `

  const rows = await prisma.$queryRawUnsafe<RawCompanyRow[]>(
    searchQuery,
    query,
    limit,
    offset
  )

  const items: CompanyResult[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    verified: row.verified,
    category: row.category,
    shortsCount: Number(row.shortsCount),
  }))

  const ranks = rows.map((row) => row.rank as number)

  return { items, ranks, total }
}

interface RawCompanyRow {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: bigint
  rank: number
}
```

### 4. Suggestions API Route

```typescript
// src/app/api/search/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { suggestionsQuerySchema } from '@/lib/validation/search'
import type { SuggestionsResponse, ShortSuggestion, CompanySuggestion } from '@/lib/types/feed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    const params = suggestionsQuerySchema.parse(rawParams)
    const { q } = params

    // Fetch suggestions in parallel
    const [shorts, companies, popularTags] = await Promise.all([
      searchShortsSuggestions(q),
      searchCompaniesSuggestions(q),
      getPopularSearchTerms(),
    ])

    return NextResponse.json({
      recent: [], // Recent searches handled client-side (localStorage)
      popular: popularTags,
      shorts,
      companies,
    } satisfies SuggestionsResponse)

  } catch (error) {
    console.error('Suggestions API error:', error)

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

async function searchShortsSuggestions(query: string): Promise<ShortSuggestion[]> {
  const results = await prisma.$queryRaw<ShortSuggestion[]>`
    SELECT
      s.id,
      s.title,
      s."thumbnailUrl"
    FROM "Short" s
    WHERE
      s.status = 'PUBLISHED'
      AND (
        s.title ILIKE ${`%${query}%`}
        OR s.title % ${query}
      )
    ORDER BY
      CASE WHEN s.title ILIKE ${`${query}%`} THEN 0 ELSE 1 END,
      similarity(s.title, ${query}) DESC
    LIMIT 5
  `

  return results
}

async function searchCompaniesSuggestions(query: string): Promise<CompanySuggestion[]> {
  const results = await prisma.$queryRaw<CompanySuggestion[]>`
    SELECT
      c.id,
      c."companyName" as name,
      c.slug,
      c.logo
    FROM "CompanyProfile" c
    WHERE
      c."companyName" ILIKE ${`%${query}%`}
      OR c."companyName" % ${query}
    ORDER BY
      CASE WHEN c."companyName" ILIKE ${`${query}%`} THEN 0 ELSE 1 END,
      similarity(c."companyName", ${query}) DESC
    LIMIT 5
  `

  return results
}

async function getPopularSearchTerms(): Promise<string[]> {
  // Return popular tags as search suggestions
  const tags = await prisma.tag.findMany({
    select: { name: true },
    orderBy: { usageCount: 'desc' },
    take: 5,
  })

  return tags.map((t) => t.name)
}
```

## Acceptance Criteria

- [ ] GET /api/search returns search results
- [ ] Query param `q` is required (min 2 chars)
- [ ] Type filter works (all, shorts, companies)
- [ ] Pagination works (page, limit)
- [ ] Category filter works
- [ ] Location filter works with radius
- [ ] Results sorted by rank (relevance)
- [ ] Full-text search works for Polish text
- [ ] Trigram similarity provides fuzzy matching
- [ ] GET /api/search/suggestions returns autocomplete
- [ ] Suggestions include shorts and companies
- [ ] Popular tags returned as popular searches
- [ ] Invalid params return 400 error
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Published shorts with searchable titles

### Steps

| Step | Action | Expected Result | URL/Notes |
|------|--------|-----------------|-----------|
| 1 | GET /api/search?q=test | Returns results | `/api/search?q=test` |
| 2 | GET /api/search?q=te | Returns 400 (too short) | Min 2 chars |
| 3 | GET /api/search?q=test&type=shorts | Only shorts | Check type field |
| 4 | GET /api/search?q=test&type=companies | Only companies | Check type field |
| 5 | GET /api/search/suggestions?q=t | Returns suggestions | `/api/search/suggestions?q=t` |
| 6 | Check suggestions.shorts | Array of shorts | Has id, title, thumbnailUrl |
| 7 | Check suggestions.companies | Array of companies | Has id, name, slug, logo |

## Notes

1. **pg_trgm Extension:** Required for similarity operator (`%`). Ensure enabled in database (task-01).

2. **Polish Dictionary:** PostgreSQL must have Polish dictionary for accurate full-text search. Neon DB includes it.

3. **Query Timeout:** Consider adding timeout for complex queries in production.

4. **Recent Searches:** Handled client-side via localStorage, not stored in database.

5. **Raw Queries:** Using `$queryRawUnsafe` for complex queries with dynamic WHERE clauses. Ensure proper parameterization to prevent SQL injection.
