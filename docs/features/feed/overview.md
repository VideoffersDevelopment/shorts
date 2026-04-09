# Feed Feature

**Status:** Implemented
**Stage:** 04 - Feed & Discovery

---

## Overview

The feed is the main discovery surface of VideoShorts, displaying published video shorts in an infinite-scroll grid. Users can browse shorts sorted by various algorithms and filtered by location, category, and company verification status.

### User Stories

- As a user, I can browse shorts in an infinite-scroll feed so that I discover new content
- As a user, I can sort shorts by different criteria (For You, Newest, Popular, Trending)
- As a user, I can filter shorts by category to see content that interests me
- As a user, I can filter by location to discover nearby businesses
- As a user, I can filter to see only verified companies

### Key Functionality

- Algorithmic feed with engagement and freshness scoring
- Infinite scroll with cursor-based pagination
- Multi-criteria sorting (algorithmic, newest, popular, trending)
- Category filtering (multi-select)
- Location filtering with radius options
- Verified-only toggle
- URL state synchronization for shareability
- Responsive grid layout (1-5 columns)
- Loading skeletons
- Empty state handling

---

## Implementation

### Database Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Short | Video content | title, thumbnailUrl, hlsPlaylistUrl, status, publishedAt |
| ShortStats | Engagement data | views, likes, ctaClicks |
| Category | Content classification | name, slug, icon |
| CompanyProfile | Business info | companyName, viesVerified, latitude, longitude |

### Server Actions

| Action | File | Purpose |
|--------|------|---------|
| N/A | API route only | Feed uses API route for client-side fetching |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feed` | GET | Fetch feed with pagination and filters |

### Components

| Component | File | Purpose |
|-----------|------|---------|
| FeedGrid | `src/components/feed/feed-grid.tsx` | Responsive grid layout |
| FeedCard | `src/components/feed/feed-card.tsx` | Short thumbnail card |
| FeedSkeleton | `src/components/feed/feed-skeleton.tsx` | Loading placeholder |
| FeedGridSkeleton | `src/components/feed/feed-skeleton.tsx` | Grid loading state |
| EmptyState | `src/components/feed/empty-state.tsx` | No results display |
| CategoryFilter | `src/components/feed/category-filter.tsx` | Category selection |
| DistanceFilter | `src/components/feed/distance-filter.tsx` | Location radius |
| SortSelect | `src/components/feed/sort-select.tsx` | Sort dropdown |
| FilterPanel | `src/components/feed/filter-panel.tsx` | Combined filters |

### Pages/Routes

| Route | File | Purpose |
|-------|------|---------|
| `/[locale]` | `src/app/(main)/[locale]/page.tsx` | Home feed page |

---

## Usage Examples

### Basic Feed Display

```tsx
import { FeedGrid } from '@/components/feed/feed-grid'
import { useFeed } from '@/hooks/use-feed'

export function FeedPage() {
  const { shorts, loadMore, hasMore, loading } = useFeed({
    sort: 'algorithmic',
    limit: 20,
  })

  return (
    <FeedGrid
      shorts={shorts}
      onLoadMore={loadMore}
      hasMore={hasMore}
      loading={loading}
    />
  )
}
```

### Feed with Filters

```tsx
import { FeedGrid } from '@/components/feed/feed-grid'
import { FilterPanel } from '@/components/feed/filter-panel'
import { SortSelect } from '@/components/feed/sort-select'

export function FilteredFeed() {
  const [filters, setFilters] = useState({
    sort: 'newest',
    categoryIds: [],
    radius: null,
    verifiedOnly: false,
  })

  const { shorts, loadMore, hasMore, loading } = useFeed(filters)

  return (
    <div>
      <div className="flex justify-between mb-4">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
        />
        <SortSelect
          value={filters.sort}
          onChange={(sort) => setFilters(f => ({ ...f, sort }))}
        />
      </div>
      <FeedGrid
        shorts={shorts}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
      />
    </div>
  )
}
```

### Individual Feed Card

```tsx
import { FeedCard } from '@/components/feed/feed-card'

export function ShortPreview({ short }: { short: FeedShort }) {
  return (
    <FeedCard short={short} />
  )
}
```

### Empty State

```tsx
import { EmptyState } from '@/components/feed/empty-state'

export function NoResults({ query, onClearFilters }) {
  return (
    <EmptyState
      variant="no-shorts"
      onAction={onClearFilters}
    />
  )
}
```

---

## API Reference

### GET /api/feed

Fetch shorts for the feed with filtering and pagination.

**Request:**
```typescript
interface FeedParams {
  sort?: 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
  categoryIds?: string  // Comma-separated category IDs
  lat?: number          // User latitude for distance
  lng?: number          // User longitude for distance
  radius?: number       // Filter radius in km
  verifiedOnly?: boolean
  cursor?: string       // Pagination cursor
  limit?: number        // Items per page (default: 20, max: 100)
}
```

**Response:**
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
  publishedAt: string
  views: number
  likes: number
  ctaClicks: number
  location: string | null
  distance: number | null  // km from user, if location provided
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

**Example Request:**
```bash
GET /api/feed?sort=newest&categoryIds=cat1,cat2&radius=10&lat=52.23&lng=21.01&limit=20
```

**Example Response:**
```json
{
  "items": [
    {
      "id": "short_abc123",
      "title": "Amazing Restaurant Deal",
      "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
      "hlsPlaylistUrl": "https://cdn.example.com/video/playlist.m3u8",
      "duration": 45,
      "publishedAt": "2026-01-10T12:00:00Z",
      "views": 1250,
      "likes": 89,
      "ctaClicks": 23,
      "location": "Warsaw",
      "distance": 2.5,
      "company": {
        "id": "comp_xyz789",
        "name": "Best Restaurant",
        "slug": "best-restaurant",
        "logo": "https://cdn.example.com/logo.jpg",
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
  "nextCursor": "2026-01-10T11:30:00Z_short_def456",
  "hasMore": true
}
```

---

## Sorting Algorithms

### Algorithmic ("For You")

Combined score based on:
- **Time decay (40%)**: Fresher content scores higher
- **Engagement (40%)**: Views and likes weighted
- **Distance (20%)**: Closer content preferred (if location provided)

```typescript
function calculateFeedScore(short: ShortScoreInput): number {
  const timeScore = getTimeDecay(short.publishedAt)
  const engagementScore = (short.views * 0.1) + (short.likes * 0.5)
  const distanceScore = short.distance
    ? Math.max(0, 100 - short.distance)
    : 50
  return (timeScore * 0.4) + (engagementScore * 0.4) + (distanceScore * 0.2)
}
```

### Newest

Simple chronological order by `publishedAt DESC`.

### Popular

Weighted engagement score:
```sql
ORDER BY (views + likes * 5) DESC
```

### Trending

Recent engagement rate - views in the last 7 days weighted higher:
```typescript
const trendingScore = recentViews / daysSincePublish
```

---

## Filtering

### Category Filter

Multi-select categories with max 5 selections:

```typescript
interface CategoryFilterProps {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  maxSelection?: number  // Default: 5
}
```

Categories display with icons (Lucide React).

### Distance Filter

Radius options:
| Option | Value |
|--------|-------|
| 1 km | 1 |
| 5 km | 5 |
| 10 km | 10 |
| 25 km | 25 |
| 50 km | 50 |
| Whole country | null |

Includes "Detect location" button using browser Geolocation API.

### Verified Only

Boolean toggle to show only shorts from VIES-verified companies.

---

## URL State

All filter state syncs to URL for shareability:

```
/pl?sort=newest&categoryIds=cat1,cat2&radius=10&lat=52.23&lng=21.01&verifiedOnly=true
```

This allows:
- Sharing filtered feed views
- Browser back/forward navigation
- Bookmarking specific views
- Deep linking from other pages

---

## Related Documentation

- [Feed API Reference](../api/routes/feed.md)
- [Feed Components](../components/feed/feed-grid.md)
- [Filter Components](./filtering.md)
- [Search Feature](./search.md)

---

**Implemented:** 2026-01-03
**Last Updated:** 2026-01-11
