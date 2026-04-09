# Feed API

API endpoint for fetching the public shorts feed with filtering, sorting, and pagination.

**File:** `src/app/api/feed/route.ts`
**Method:** GET

---

## Endpoint

```
GET /api/feed
```

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | `algorithmic` | Sort algorithm |
| `categoryIds` | string | No | - | Comma-separated category IDs |
| `lat` | number | No | - | User latitude for distance |
| `lng` | number | No | - | User longitude for distance |
| `radius` | number | No | - | Filter radius in kilometers |
| `verifiedOnly` | boolean | No | `false` | Only verified companies |
| `cursor` | string | No | - | Pagination cursor |
| `limit` | number | No | `20` | Items per page (max: 100) |

### Sort Options

| Value | Description |
|-------|-------------|
| `algorithmic` | AI-scored based on engagement, freshness, distance |
| `newest` | Most recently published first |
| `popular` | Highest total engagement |
| `trending` | Fastest growing engagement rate |
| `following` | From followed companies only (requires auth) |

---

## Response

### Success (200)

```typescript
interface FeedResponse {
  items: FeedShort[]
  nextCursor: string | null
  hasMore: boolean
}

interface FeedShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: string          // ISO 8601
  views: number
  likes: number
  ctaClicks: number
  location: string | null      // City name
  distance: number | null      // km from user (if lat/lng provided)
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
```

### Error (400)

```json
{
  "error": "Invalid query parameters",
  "details": {
    "lat": "Expected number, received string"
  }
}
```

### Error (500)

```json
{
  "error": "Internal server error"
}
```

---

## Examples

### Basic Request

```bash
curl -X GET "https://videoshorts.com/api/feed"
```

```json
{
  "items": [
    {
      "id": "clx1abc123",
      "title": "Amazing Restaurant Deal",
      "thumbnailUrl": "https://cdn.videoshorts.com/thumb/abc123.jpg",
      "hlsPlaylistUrl": "https://cdn.videoshorts.com/hls/abc123/playlist.m3u8",
      "duration": 45,
      "publishedAt": "2026-01-10T12:00:00.000Z",
      "views": 1250,
      "likes": 89,
      "ctaClicks": 23,
      "location": "Warsaw",
      "distance": null,
      "company": {
        "id": "clx1comp456",
        "name": "Best Restaurant",
        "slug": "best-restaurant",
        "logo": "https://cdn.videoshorts.com/logo/456.jpg",
        "verified": true
      },
      "category": {
        "id": "cat_food",
        "name": "Restaurants",
        "slug": "restaurants"
      },
      "ctaLink": "https://restaurant.com/deal"
    }
  ],
  "nextCursor": "2026-01-10T11:30:00.000Z_clx1def789",
  "hasMore": true
}
```

### With Location Filter

```bash
curl -X GET "https://videoshorts.com/api/feed?lat=52.2297&lng=21.0122&radius=10"
```

Response includes `distance` field:

```json
{
  "items": [
    {
      "id": "clx1abc123",
      "distance": 2.5,
      ...
    }
  ],
  "nextCursor": "...",
  "hasMore": true
}
```

### With Category Filter

```bash
curl -X GET "https://videoshorts.com/api/feed?categoryIds=cat_food,cat_beauty&sort=newest"
```

### Pagination

```bash
# First page
curl -X GET "https://videoshorts.com/api/feed?limit=20"

# Second page (using cursor from first response)
curl -X GET "https://videoshorts.com/api/feed?limit=20&cursor=2026-01-10T11:30:00.000Z_clx1def789"
```

---

## Validation Schema

```typescript
// src/lib/validation/feed.ts
import { z } from 'zod'

export const feedQuerySchema = z.object({
  sort: z.enum(['algorithmic', 'newest', 'popular', 'trending', 'following'])
    .default('algorithmic'),
  categoryIds: z.string()
    .optional()
    .transform(val => val ? val.split(',').filter(Boolean) : undefined),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
  verifiedOnly: z.coerce.boolean().default(false),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type FeedQueryParams = z.infer<typeof feedQuerySchema>
```

---

## Implementation Details

### Cursor-Based Pagination

Cursor combines timestamp and ID for stable pagination:

```typescript
// Encode cursor
const cursor = `${item.publishedAt.toISOString()}_${item.id}`

// Decode cursor
const [timestamp, id] = cursor.split('_')
const cursorDate = new Date(timestamp)
```

### Distance Calculation

Uses Haversine formula for accurate short-distance calculations:

```typescript
// src/lib/utils/haversine.ts
export function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

### Bounding Box Pre-Filter

For performance, location filtering uses bounding box before Haversine:

```typescript
if (lat && lng && radius) {
  const latDelta = radius / 111  // ~111km per degree latitude
  const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180))

  whereConditions.push(
    `latitude BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
    `longitude BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`
  )
}
```

### Algorithmic Scoring

```typescript
// src/lib/utils/feed-scoring.ts
export function calculateFeedScore(short: ShortScoreInput): number {
  const timeScore = getTimeDecay(short.publishedAt)
  const engagementScore = (short.views * 0.1) + (short.likes * 0.5)
  const distanceScore = short.distance
    ? Math.max(0, 100 - short.distance)
    : 50

  return (timeScore * 0.4) + (engagementScore * 0.4) + (distanceScore * 0.2)
}

function getTimeDecay(publishedAt: Date): number {
  const hoursSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
  return Math.max(0, 100 - hoursSince * 2) // Decays over ~50 hours
}
```

---

## Database Indexes

Optimized for feed queries:

```sql
-- Main feed query index
CREATE INDEX "Short_status_categoryId_publishedAt_idx"
  ON "Short" (status, "categoryId", "publishedAt" DESC);

-- Location filtering
CREATE INDEX "Short_latitude_longitude_idx"
  ON "Short" (latitude, longitude);

-- Verified filter
CREATE INDEX "CompanyProfile_viesVerified_idx"
  ON "CompanyProfile" ("viesVerified");
```

---

## Rate Limiting

- No authentication required
- Rate limit: 100 requests/minute per IP
- Caching: 5 minutes for algorithmic, 1 minute for others

---

## Related

- [Feed Feature Documentation](../../features/feed/overview.md)
- [Feed Filtering](../../features/feed/filtering.md)
- [FeedGrid Component](../../components/feed/feed-grid.md)

---

**Last Updated:** 2026-01-11
