# Stage 04: Task Breakdown

Detailed breakdown of all 8 tasks completed in Stage 04: Feed & Discovery.

---

## Task 01: Database Setup

**Priority:** HIGH
**Complexity:** Simple (3 files, ~3k tokens)
**Status:** Completed

### Overview

Set up database indexes and utility functions for feed optimization.

### Files Created

| File | Description |
|------|-------------|
| `src/lib/utils/haversine.ts` | Haversine distance calculation |
| `src/lib/utils/feed-scoring.ts` | Algorithmic feed scoring |

### Implementation

**Haversine Distance:**
```typescript
export function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)
  // ... haversine formula
  return R * c // Distance in km
}
```

**Feed Scoring:**
```typescript
export function calculateFeedScore(short: ShortScoreInput): number {
  const timeScore = getTimeDecay(short.publishedAt)
  const engagementScore = (short.views * 0.1) + (short.likes * 0.5)
  const distanceScore = short.distance ? Math.max(0, 100 - short.distance) : 50
  return (timeScore * 0.4) + (engagementScore * 0.4) + (distanceScore * 0.2)
}
```

### Database Migrations

```sql
-- Feed performance indexes
CREATE INDEX "Short_status_categoryId_publishedAt_idx"
  ON "Short" (status, "categoryId", "publishedAt" DESC);

CREATE INDEX "Short_latitude_longitude_idx"
  ON "Short" (latitude, longitude);

-- Full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Short_title_trgm_idx"
  ON "Short" USING gin (title gin_trgm_ops);
```

### Tests

- 12 haversine tests (edge cases, accuracy)
- 18 feed scoring tests (components, combinations)

---

## Task 02: Feed API

**Priority:** HIGH
**Dependencies:** task-01
**Complexity:** Medium (5 files, ~6k tokens)
**Status:** Completed

### Overview

Create the main feed API endpoint with pagination, sorting, and filtering.

### Files Created

| File | Description |
|------|-------------|
| `src/app/api/feed/route.ts` | GET /api/feed endpoint |
| `src/lib/validation/feed.ts` | Zod schemas for feed params |
| `src/lib/types/feed.ts` | TypeScript interfaces |

### API Specification

**Endpoint:** `GET /api/feed`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| sort | string | algorithmic | Sort algorithm |
| categoryIds | string | - | Comma-separated IDs |
| lat | number | - | User latitude |
| lng | number | - | User longitude |
| radius | number | - | Radius in km |
| verifiedOnly | boolean | false | Filter verified |
| cursor | string | - | Pagination cursor |
| limit | number | 20 | Items per page |

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
```

### Sort Implementations

| Sort | Query |
|------|-------|
| algorithmic | Score calculation with time decay |
| newest | `ORDER BY publishedAt DESC` |
| popular | `ORDER BY (views + likes*5) DESC` |
| trending | Views in last 7 days weighted |

### Tests

- 45 API tests (sorting, filtering, pagination, errors)

---

## Task 03: Core Feed Components

**Priority:** HIGH
**Dependencies:** task-02
**Complexity:** Medium (7 files, ~7k tokens)
**Status:** Completed

### Overview

Create the core UI components for displaying the feed.

### Files Created

| File | Description |
|------|-------------|
| `src/components/feed/feed-grid.tsx` | Responsive grid layout |
| `src/components/feed/feed-card.tsx` | Short thumbnail card |
| `src/components/feed/feed-skeleton.tsx` | Loading placeholders |
| `src/components/feed/empty-state.tsx` | No results state |
| `src/hooks/use-debounce.ts` | Debounce hook |
| `src/hooks/use-intersection-observer.ts` | Infinite scroll hook |

### Component Details

**FeedGrid:**
```typescript
interface FeedGridProps {
  shorts: FeedShort[]
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}
```
- Responsive grid (1-5 columns)
- Infinite scroll trigger
- Loading state handling

**FeedCard:**
```typescript
interface FeedCardProps {
  short: FeedShort
}
```
- Thumbnail with hover preview
- Duration badge
- Company info
- Distance indicator
- Stats (views, likes)

**EmptyState:**
```typescript
interface EmptyStateProps {
  variant: 'no-shorts' | 'no-following' | 'no-search-results'
  query?: string
  onAction?: () => void
}
```
- Contextual messaging
- Action buttons (expand radius, clear filters)

### Tests

- 67 component tests (rendering, interactions, states)

---

## Task 04: Filter Components

**Priority:** MEDIUM
**Dependencies:** task-03
**Complexity:** Medium (5 files, ~5k tokens)
**Status:** Completed

### Overview

Create filter UI components with URL state synchronization.

### Files Created

| File | Description |
|------|-------------|
| `src/components/feed/category-filter.tsx` | Category multi-select |
| `src/components/feed/distance-filter.tsx` | Location radius picker |
| `src/components/feed/sort-select.tsx` | Sort dropdown |
| `src/components/feed/filter-panel.tsx` | Combined filter panel |

### Component Details

**CategoryFilter:**
```typescript
interface CategoryFilterProps {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  maxSelection?: number // Default: 5
}
```
- Multi-select with checkboxes
- Category icons
- Max selection limit

**DistanceFilter:**
```typescript
interface DistanceFilterProps {
  value: number | null
  onChange: (radius: number | null) => void
  userLocation: { lat: number; lng: number } | null
  onDetectLocation: () => void
}
```
- Preset radius options (1, 5, 10, 25, 50 km)
- "Whole country" option
- Location detection button

**SortSelect:**
```typescript
interface SortSelectProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

type SortOption = 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
```

### URL State Sync

All filters sync to URL query params:
```
/pl?sort=newest&categoryIds=cat1,cat2&radius=10&lat=52.23&lng=21.01
```

### Tests

- 52 filter component tests

---

## Task 05: Search API

**Priority:** MEDIUM
**Dependencies:** task-01
**Complexity:** Simple (4 files, ~4k tokens)
**Status:** Completed

### Overview

Create search API endpoints with full-text search and suggestions.

### Files Created

| File | Description |
|------|-------------|
| `src/app/api/search/route.ts` | Main search endpoint |
| `src/app/api/search/suggestions/route.ts` | Autocomplete |
| `src/lib/validation/search.ts` | Zod schemas |

### Search Implementation

**Full-Text Search Query:**
```sql
SELECT ...
FROM "Short" s
WHERE
  to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
  @@ plainto_tsquery('polish', $1)
  OR s.title % $1
ORDER BY
  ts_rank(...) + similarity(s.title, $1) DESC
```

**Suggestions Query:**
```sql
SELECT s.id, s.title, s."thumbnailUrl"
FROM "Short" s
WHERE s.title ILIKE $1 OR s.title % $1
ORDER BY
  CASE WHEN s.title ILIKE $1 || '%' THEN 0 ELSE 1 END,
  similarity(s.title, $1) DESC
LIMIT 5
```

### API Specification

**GET /api/search:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Query (min 2 chars) |
| type | string | No | all/shorts/companies |
| page | number | No | Page number |
| limit | number | No | Results per page |

**GET /api/search/suggestions:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Query (min 1 char) |

### Tests

- 38 search API tests

---

## Task 06: Search Components

**Priority:** MEDIUM
**Dependencies:** task-03, task-05
**Complexity:** Medium (8 files, ~8k tokens)
**Status:** Completed

### Overview

Create search UI with autocomplete and results display.

### Files Created

| File | Description |
|------|-------------|
| `src/components/search/search-bar.tsx` | Command-based search |
| `src/components/search/search-suggestions.tsx` | Autocomplete dropdown |
| `src/components/search/search-results.tsx` | Results grid |
| `src/components/search/search-tabs.tsx` | Type filter tabs |
| `src/app/(main)/[locale]/search/page.tsx` | Search results page |

### Component Details

**SearchBar:**
- Command palette UI (shadcn/ui Command)
- Debounced input (300ms)
- Keyboard shortcut (Ctrl+K)
- Recent searches (localStorage)
- Suggestions popover

**SearchSuggestions:**
- Recent searches section
- Popular searches (tags)
- Shorts suggestions with thumbnails
- Company suggestions with logos
- Clear history button

**SearchResults:**
- Mixed results (shorts + companies)
- Grouped by type
- FeedCard for shorts
- CompanyCard for companies
- Empty state handling

### Header Integration

SearchBar added to main header:
```typescript
// Desktop: inline search bar
<div className="flex-1 max-w-xl mx-4 hidden md:block">
  <SearchBar />
</div>

// Mobile: search icon link
<Link href={`/${locale}/search`} className="md:hidden">
  <Button variant="ghost" size="icon">
    <Search className="h-5 w-5" />
  </Button>
</Link>
```

### Tests

- 61 search component tests

---

## Task 07: Translations & i18n

**Priority:** MEDIUM
**Dependencies:** None
**Complexity:** Medium (13 files, ~13k tokens)
**Status:** Completed

### Overview

Create translation files for feed and search in 6 languages.

### Files Created

| File | Language |
|------|----------|
| `src/lib/locales/pl/feed.json` | Polish |
| `src/lib/locales/en/feed.json` | English |
| `src/lib/locales/de/feed.json` | German |
| `src/lib/locales/es/feed.json` | Spanish |
| `src/lib/locales/ru/feed.json` | Russian |
| `src/lib/locales/uk/feed.json` | Ukrainian |
| `src/lib/locales/pl/search.json` | Polish |
| `src/lib/locales/en/search.json` | English |
| `src/lib/locales/de/search.json` | German |
| `src/lib/locales/es/search.json` | Spanish |
| `src/lib/locales/ru/search.json` | Russian |
| `src/lib/locales/uk/search.json` | Ukrainian |

### Translation Keys

**feed.json structure:**
```json
{
  "sort": { "label", "algorithmic", "newest", "popular", "trending", "following" },
  "filters": { "title", "apply", "clear", "location", "categories", "tags", "verifiedOnly" },
  "empty": { "noShorts", "noFollowing" },
  "loading": { "more", "skeleton" },
  "card": { "views", "likes", "distance" }
}
```

**search.json structure:**
```json
{
  "bar": { "placeholder", "shortcut" },
  "suggestions": { "recent", "popular", "shorts", "companies", "clearRecent" },
  "tabs": { "all", "shorts", "companies" },
  "results": { "title", "count", "noResults" },
  "filters": { "inCategory", "inLocation" },
  "loading": "..."
}
```

### Tests

- 24 i18n validation tests

---

## Task 08: Short Detail Page

**Priority:** MEDIUM
**Dependencies:** task-02, task-03
**Complexity:** Simple (9 files, ~9k tokens)
**Status:** Completed

### Overview

Create the public short detail page with video player.

### Files Created

| File | Description |
|------|-------------|
| `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Detail page |
| `src/components/shorts/short-detail-view.tsx` | Full player view |
| `src/app/actions/shorts/get-public.ts` | Fetch public short |

### Page Features

- Full video player with controls
- Play/pause, mute, fullscreen
- Progress bar with seek
- View count increment
- Title and description
- Tags (clickable to search)
- CTA button (external link)
- Company card with profile link
- Related shorts grid
- Back to feed button
- Share functionality

### Server Action

```typescript
export async function getPublicShort(id: string): Promise<PublicShortDetail | null> {
  // Fetch published short
  // Increment view count (fire and forget)
  // Fetch related shorts (same category)
  return {
    ...shortData,
    description,
    tags,
    relatedShorts
  }
}
```

### Video Controls

```typescript
// Native HTML5 video with custom controls
<video
  ref={videoRef}
  src={short.hlsPlaylistUrl}
  poster={short.thumbnailUrl}
  loop
  playsInline
  muted={isMuted}
  onTimeUpdate={handleTimeUpdate}
  onClick={togglePlay}
/>
```

### SEO Metadata

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const short = await getPublicShort(id)
  return {
    title: short.title,
    description: short.description,
    openGraph: {
      title: short.title,
      images: short.thumbnailUrl ? [short.thumbnailUrl] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}
```

### Translation Keys Added

Added to existing `shorts.json`:
```json
{
  "backToFeed": "Back to feed",
  "viewOffer": "View offer",
  "viewCompany": "View company",
  "relatedShorts": "Related shorts"
}
```

### Tests

- 44 short detail tests

---

## Summary

| Task | Files | Tests | Complexity |
|------|-------|-------|------------|
| task-01 | 2 | 30 | Simple |
| task-02 | 5 | 45 | Medium |
| task-03 | 6 | 67 | Medium |
| task-04 | 4 | 52 | Medium |
| task-05 | 3 | 38 | Simple |
| task-06 | 5 | 61 | Medium |
| task-07 | 12 | 24 | Medium |
| task-08 | 3 | 44 | Simple |
| **Total** | **40** | **361** | - |

---

**Last Updated:** 2026-01-11
**Generated by:** exec-doc-generator (AI Spec Flow)
