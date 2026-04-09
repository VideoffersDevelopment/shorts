# Search API

API endpoints for searching shorts and companies with full-text search and autocomplete suggestions.

---

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | GET | Full search with results |
| `/api/search/suggestions` | GET | Autocomplete suggestions |

---

## GET /api/search

Main search endpoint returning ranked results for shorts and companies.

**File:** `src/app/api/search/route.ts`

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (min 2 chars) |
| `type` | string | No | `all` | Result type filter |
| `page` | number | No | `1` | Page number |
| `limit` | number | No | `20` | Results per page (max: 100) |
| `categoryIds` | string | No | - | Comma-separated category IDs |
| `lat` | number | No | - | User latitude |
| `lng` | number | No | - | User longitude |
| `radius` | number | No | - | Filter radius (km) |

### Type Options

| Value | Description |
|-------|-------------|
| `all` | Both shorts and companies |
| `shorts` | Only shorts |
| `companies` | Only companies |

### Response (200)

```typescript
interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  nextPage: number | null
  query: string
}

interface SearchResult {
  type: 'short' | 'company'
  data: FeedShort | CompanyResult
  rank: number
}

interface CompanyResult {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: number
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid query parameters"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Examples

**Basic Search:**
```bash
curl -X GET "https://videoshorts.com/api/search?q=restaurant"
```

```json
{
  "results": [
    {
      "type": "short",
      "data": {
        "id": "clx1abc123",
        "title": "Best Restaurant in Town",
        "thumbnailUrl": "https://cdn.videoshorts.com/thumb/abc123.jpg",
        ...
      },
      "rank": 0.85
    },
    {
      "type": "company",
      "data": {
        "id": "clx1comp456",
        "name": "Restaurant ABC",
        "slug": "restaurant-abc",
        "logo": "https://cdn.videoshorts.com/logo/456.jpg",
        "verified": true,
        "category": "Food & Dining",
        "shortsCount": 12
      },
      "rank": 0.72
    }
  ],
  "totalCount": 45,
  "nextPage": 2,
  "query": "restaurant"
}
```

**Filter by Type:**
```bash
curl -X GET "https://videoshorts.com/api/search?q=beauty&type=companies"
```

**With Location:**
```bash
curl -X GET "https://videoshorts.com/api/search?q=pizza&lat=52.23&lng=21.01&radius=5"
```

---

## GET /api/search/suggestions

Autocomplete suggestions for the search input.

**File:** `src/app/api/search/suggestions/route.ts`

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (min 1 char) |

### Response (200)

```typescript
interface SuggestionsResponse {
  recent: string[]           // Always empty (client-side)
  popular: string[]          // Popular tags
  shorts: ShortSuggestion[]  // Matching shorts (max 5)
  companies: CompanySuggestion[]  // Matching companies (max 5)
}

interface ShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface CompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}
```

### Example

```bash
curl -X GET "https://videoshorts.com/api/search/suggestions?q=rest"
```

```json
{
  "recent": [],
  "popular": ["restaurants", "food", "deals"],
  "shorts": [
    {
      "id": "clx1abc123",
      "title": "Restaurant Special Offer",
      "thumbnailUrl": "https://cdn.videoshorts.com/thumb/abc123.jpg"
    },
    {
      "id": "clx1def456",
      "title": "Best Restaurants 2026",
      "thumbnailUrl": "https://cdn.videoshorts.com/thumb/def456.jpg"
    }
  ],
  "companies": [
    {
      "id": "clx1comp789",
      "name": "Restaurant La Bella",
      "slug": "restaurant-la-bella",
      "logo": "https://cdn.videoshorts.com/logo/789.jpg"
    }
  ]
}
```

---

## Validation Schemas

```typescript
// src/lib/validation/search.ts
import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  type: z.enum(['all', 'shorts', 'companies']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryIds: z.string()
    .optional()
    .transform(val => val ? val.split(',').filter(Boolean) : undefined),
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

---

## Search Implementation

### Full-Text Search (Shorts)

Uses PostgreSQL full-text search with Polish dictionary:

```sql
SELECT
  s.*,
  ts_rank(
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
    plainto_tsquery('polish', $1)
  ) + similarity(s.title, $1) as rank
FROM "Short" s
WHERE
  s.status = 'PUBLISHED'
  AND (
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
    @@ plainto_tsquery('polish', $1)
    OR s.title % $1
  )
ORDER BY rank DESC
LIMIT $2 OFFSET $3
```

### Trigram Similarity (Companies)

Uses `pg_trgm` extension for fuzzy matching:

```sql
SELECT
  c.*,
  similarity(c."companyName", $1) as rank,
  (SELECT COUNT(*)
   FROM "Short" s
   WHERE s."companyId" = c.id AND s.status = 'PUBLISHED'
  ) as "shortsCount"
FROM "CompanyProfile" c
WHERE c."companyName" % $1
ORDER BY rank DESC
LIMIT $2 OFFSET $3
```

### Suggestions Query

Prioritizes prefix matches:

```sql
SELECT s.id, s.title, s."thumbnailUrl"
FROM "Short" s
WHERE
  s.status = 'PUBLISHED'
  AND (s.title ILIKE '%' || $1 || '%' OR s.title % $1)
ORDER BY
  CASE WHEN s.title ILIKE $1 || '%' THEN 0 ELSE 1 END,
  similarity(s.title, $1) DESC
LIMIT 5
```

---

## Required PostgreSQL Extensions

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for fuzzy search
CREATE INDEX "Short_title_trgm_idx"
  ON "Short" USING gin (title gin_trgm_ops);

CREATE INDEX "CompanyProfile_companyName_trgm_idx"
  ON "CompanyProfile" USING gin ("companyName" gin_trgm_ops);
```

---

## Performance Considerations

1. **Limit Suggestions:** Max 5 items per category
2. **Bounding Box:** Pre-filter location before Haversine
3. **Index Usage:** Trigram and full-text indexes
4. **Query Timeout:** Consider adding timeout for complex queries

---

## Rate Limiting

- No authentication required
- Rate limit: 60 requests/minute per IP
- Suggestions: 120 requests/minute per IP

---

## Related

- [Search Feature Documentation](../../features/feed/search.md)
- [SearchBar Component](../../components/feed/search.md)

---

**Last Updated:** 2026-01-11
