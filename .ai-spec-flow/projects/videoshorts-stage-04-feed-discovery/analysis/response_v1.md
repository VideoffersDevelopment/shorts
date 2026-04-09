# Code Analysis: Feed + Discovery (Stage 4)

**Project:** videoshorts-stage-04-feed-discovery
**Date:** 2026-01-01
**Iteration:** v1

---

## 1. Component Inventory

### Feed/Display Components

| Component | Path | Status | API Compatible |
|-----------|------|--------|----------------|
| VideoCard | `src/components/home/video-card.tsx` | EXISTS | PARTIAL - needs Short data mapping |
| VideoGrid | `src/components/home/video-grid.tsx` | EXISTS | NO - uses static sampleVideos |
| CategoryFilter | `src/components/home/category-filter.tsx` | EXISTS | PARTIAL - static categories |
| HeroSection | `src/components/home/hero-section.tsx` | EXISTS | YES |
| ShortCard | `src/components/shorts/short-card.tsx` | EXISTS | YES - for panel, not feed |
| ShortPlayer | `src/components/shorts/short-player.tsx` | EXISTS | YES |
| VideoPreview | `src/components/shorts/video-preview.tsx` | EXISTS | PARTIAL - for edit, not feed preview |

### UI Components (Reusable)

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| Skeleton | `src/components/ui/skeleton.tsx` | EXISTS | Simple, needs card skeleton |
| Badge | `src/components/ui/badge.tsx` | EXISTS | YES |
| Card | `src/components/ui/card.tsx` | EXISTS | YES |
| Button | `src/components/ui/button.tsx` | EXISTS | YES |
| Sheet | `src/components/ui/sheet.tsx` | EXISTS | For mobile filter panel |
| Command (Combobox) | `src/components/ui/command.tsx` | EXISTS | For search autocomplete |
| Popover | `src/components/ui/popover.tsx` | EXISTS | For dropdowns |
| Select | `src/components/ui/select.tsx` | EXISTS | For sort dropdown |
| Switch | `src/components/ui/switch.tsx` | EXISTS | For verified toggle |

### Components to Create

| Component | Purpose | Base Pattern |
|-----------|---------|--------------|
| FeedGrid | Infinite scroll container with real data | Extend `VideoGrid` |
| FeedCard | Optimized video card for feed | Extend `VideoCard` |
| FeedVideoPreview | Autoplay on hover (muted) | New - use native video |
| SearchBar | Sticky search with autocomplete | Use Command + Input |
| SearchSuggestions | Dropdown with categories | Use Command |
| FilterPanel | Sidebar/bottom sheet filters | Use Sheet + existing patterns |
| LocationPicker | Mapbox autocomplete + radius | New - see address-location.tsx |
| CategoryPicker | Multi-select hierarchical | Extend CategoryCombobox |
| RadiusSelector | Dropdown 1km-50km | Use Select |
| SortDropdown | Sort options with icons | Use DropdownMenu |
| EmptyState | No results messages | New component |
| FeedSkeleton | Loading skeleton grid | Use Skeleton |

---

## 2. API Inventory

### Existing Endpoints

| Endpoint | Path | Status | Response Format |
|----------|------|--------|-----------------|
| GET /api/shorts | `src/app/api/shorts/route.ts` | EXISTS | Company-only, paginated |
| GET /api/tags/search | `src/app/api/tags/search/route.ts` | EXISTS | Tags array with usageCount |
| GET /api/shorts/[id]/status | `src/app/api/shorts/[id]/status/route.ts` | EXISTS | Short status |
| GET /api/categories/[id]/subcategories | `src/app/api/categories/[categoryId]/subcategories/route.ts` | EXISTS | Subcategories |

### Endpoints to Create

| Endpoint | Purpose | Base Pattern |
|----------|---------|--------------|
| GET /api/feed | Public feed with filters, sort, pagination | Base on /api/shorts |
| GET /api/search | Full-text search shorts + companies | New |
| GET /api/search/suggestions | Autocomplete suggestions | New |
| GET /api/categories | Public categories list | New (or use action) |

### Existing Server Actions

| Action | Path | Status | Notes |
|--------|------|--------|-------|
| getCategories | `src/app/actions/categories/get-categories.ts` | EXISTS | Returns CategoryWithChildren |
| createShortAction | `src/app/actions/shorts/create.ts` | EXISTS | Pattern reference |
| updateShortAction | `src/app/actions/shorts/update.ts` | EXISTS | Pattern reference |

---

## 3. Database Analysis

### Existing Models (Relevant)

| Model | Relevant Fields | Notes |
|-------|-----------------|-------|
| Short | id (cuid), companyId, title, description, categoryId, latitude, longitude, status, publishedAt, thumbnailUrl | Has location fields |
| ShortStats | views, likes, ctaClicks, avgWatchTime | For engagement scoring |
| ShortTag | shortId, tagId (junction) | For tag filtering |
| Tag | name, slug, usageCount | For tag search |
| Category | id, name, slug, parentId, children | Hierarchical |
| CompanyProfile | id, companyName, logo, viesVerified, latitude, longitude | For company info |

### Geolocation Fields (Existing)

| Model | Field | Type | Index |
|-------|-------|------|-------|
| Short | latitude | Float | NO - needs index |
| Short | longitude | Float | NO - needs index |
| CompanyProfile | latitude | Float | YES - `@@index([latitude, longitude])` |
| CompanyProfile | longitude | Float | YES |
| UserProfile | latitude | Float | YES - `@@index([latitude, longitude])` |
| UserProfile | longitude | Float | YES |

### Missing Database Features

| Feature | Issue | Required Action |
|---------|-------|-----------------|
| Geospatial Index on Short | No `GIST` index for location | Add PostGIS extension + index |
| Full-text Search Index | No `tsvector` index | Create GIN index |
| Trigram Index | No `pg_trgm` for fuzzy search | Create GIST index |
| Published Shorts Index | No partial index | Create with `WHERE status = 'PUBLISHED'` |
| Follow Model | Does NOT exist | Create in later stage (Stage 5) |

### Validation Issues

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| Short ID validation | `src/lib/validation/shorts.ts:40` | Uses `.cuid()` | Correct - matches schema |
| Category ID validation | `src/lib/validation/shorts.ts:11` | Uses `.cuid()` | Correct - matches schema |

### Required SQL Migrations (Additive Only)

```sql
-- Enable PostGIS (if not already)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Feed performance indexes
CREATE INDEX idx_shorts_published ON "Short"("publishedAt" DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_category_published ON "Short"("categoryId") WHERE status = 'PUBLISHED';

-- Geospatial index (requires PostGIS point column or composite)
CREATE INDEX idx_shorts_location ON "Short"(latitude, longitude) WHERE status = 'PUBLISHED';

-- Full-text search index
CREATE INDEX idx_shorts_search ON "Short" USING GIN(to_tsvector('polish', title || ' ' || COALESCE(description, '')));

-- Trigram index for fuzzy matching
CREATE INDEX idx_shorts_title_trigram ON "Short" USING GIST(title gist_trgm_ops);

-- Stats join optimization
CREATE INDEX idx_short_stats_shortid ON "ShortStats"("shortId");
```

---

## 4. Routing Analysis

### Existing Routes

| Route | File | Status | Notes |
|-------|------|--------|-------|
| /[locale] | `src/app/(main)/[locale]/page.tsx` | EXISTS | Home/Feed page (static data) |
| /[locale]/trending | `src/app/(main)/[locale]/trending/page.tsx` | EXISTS | Static sample data |
| /[locale]/following | `src/app/(main)/[locale]/following/page.tsx` | EXISTS | Static sample data |
| /[locale]/saved | `src/app/(main)/[locale]/saved/page.tsx` | EXISTS | Static sample data |
| /[locale]/companies/[slug] | `src/app/(main)/[locale]/companies/[slug]/page.tsx` | EXISTS | Company profile |
| /[locale]/panel/shorts/[id] | `src/app/(main)/[locale]/panel/shorts/[id]/page.tsx` | EXISTS | Short detail (panel) |

### Routes to Create

| Route | Purpose | Notes |
|-------|---------|-------|
| /[locale]/search | Search results page | With tabs: All, Shorts, Companies |
| /[locale]/shorts/[id] | Public short view | Different from panel view |

---

## 5. Frontend Patterns

### Navigation Pattern

**File:** `src/components/layout/main-sidebar.tsx`

**Structure:**
- Uses `useSidebar()` hook for state (collapsed/expanded)
- Navigation items array with href, icon, label
- Active state detection via `pathname.startsWith()`
- Mobile: Sheet component overlay
- Desktop: Fixed sidebar with toggle
- Role-based links (COMPANY role shows company link)

**Categories in Sidebar:**
- `SidebarCategories` component at `src/components/layout/sidebar-categories.tsx`
- Categories passed from layout, fetched via `getCategories` action

### Form Pattern

**Example:** `src/app/actions/shorts/create.ts`

```typescript
// Pattern: AUTH -> AUTHORIZATION -> VALIDATION -> LIMIT -> TRANSACTION -> revalidatePath
export async function createShortAction(data: unknown): Promise<ActionResult<T>> {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) return createError("errors.unauthorized", "UNAUTHORIZED")

  // 2. AUTHORIZATION (role check)
  if (session.user.role !== "COMPANY") return createError(...)

  // 3. VALIDATION (Zod)
  const parsed = schema.safeParse(data)
  if (!parsed.success) return formatZodError(parsed.error)

  // 4. LIMIT CHECK (optional)
  // 5. DATABASE TRANSACTION
  // 6. revalidatePath
  // 7. Return result
}
```

### Translation Pattern

**Languages Present (6 total):**
- `src/lib/locales/pl/` - Polish
- `src/lib/locales/en/` - English
- `src/lib/locales/de/` - German
- `src/lib/locales/es/` - Spanish
- `src/lib/locales/ru/` - Russian
- `src/lib/locales/uk/` - Ukrainian (new addition)

**Existing Namespaces:**
- `home.json` - Hero, filter labels
- `shorts.json` - Short-related translations
- `sidebar.json` - Navigation labels
- `common.json` - Common UI elements

**Missing Namespaces:**
- `feed.json` - Feed-specific translations
- `search.json` - Search-specific translations

**Usage (Client):**
```typescript
import { useTranslations } from "@/lib/i18n/client"
const { t } = useTranslations("namespace")
```

**Usage (Server):**
```typescript
import { getTranslations } from "next-intl/server"
const t = await getTranslations("namespace")
```

### Autocomplete Pattern

**Example:** `src/components/shorts/tags-autocomplete.tsx`

**Features:**
- Debounced search (300ms)
- Keyboard navigation (ArrowUp/Down, Enter, Escape)
- Click outside to close
- Loading state
- Create new option

**API Call:**
```typescript
const response = await fetch(`/api/tags/search?q=${encodeURIComponent(query)}`)
```

### Location/Map Pattern

**Existing Implementation:** `src/components/companies/address-location.tsx`

**Features:**
- Uses Leaflet (NOT Mapbox) via react-leaflet
- Dynamic import (SSR disabled)
- Nominatim geocoding (OpenStreetMap)
- Debounced geocoding (1 second)
- Draggable marker

**Note:** Brief specifies Mapbox, but codebase uses Leaflet/OSM. Need decision on which to use for feed.

---

## 6. Backend Patterns

### API Route Pattern

**Example:** `src/app/api/shorts/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error }, { status: 401 })

  // 2. Role/ownership check
  if (session.user.role !== "COMPANY") return NextResponse.json({ error }, { status: 403 })

  // 3. Parse query params
  const { searchParams } = new URL(request.url)

  // 4. Build where clause
  const where = { ... }

  // 5. Query with pagination
  const [total, items] = await Promise.all([
    prisma.model.count({ where }),
    prisma.model.findMany({ where, include, orderBy, skip, take })
  ])

  // 6. Return paginated response
  return NextResponse.json({ items, total, page, limit, totalPages })
}
```

### Tag Search API Pattern

**File:** `src/app/api/tags/search/route.ts`

- Auth required
- If no query: return popular tags (top 10 by usageCount)
- If query: search by name (case-insensitive contains)
- Response: `{ tags: TagResult[] }`

---

## 7. Gap Analysis

### Components to Create

| Component | Priority | Base Pattern | Notes |
|-----------|----------|--------------|-------|
| FeedGrid | P0 | VideoGrid | Add infinite scroll, real data |
| FeedCard | P0 | VideoCard | Optimize for feed, add video preview |
| SearchBar | P0 | Command | Sticky, autocomplete |
| FilterPanel | P0 | Sheet | Mobile bottom sheet, desktop sidebar |
| SortDropdown | P0 | DropdownMenu | 5 sort options |
| LocationPicker | P1 | address-location | Mapbox or Leaflet autocomplete |
| RadiusSelector | P1 | Select | 1km, 5km, 10km, 25km, 50km, All |
| CategoryPicker | P1 | CategoryCombobox | Multi-select, max 5 |
| EmptyState | P1 | New | Multiple variants |
| FeedSkeleton | P1 | Skeleton | Grid of card skeletons |
| SearchSuggestions | P1 | Command | Recent, popular, matches |

### APIs to Create

| Endpoint | Priority | Notes |
|----------|----------|-------|
| GET /api/feed | P0 | Public, pagination, filters, sorting |
| GET /api/search | P0 | Full-text search with tabs |
| GET /api/search/suggestions | P1 | Autocomplete |

### Hooks to Create

| Hook | Priority | Notes |
|------|----------|-------|
| useInfiniteScroll | P0 | Intersection Observer + prefetch |
| useGeolocation | P1 | Browser geolocation API |
| useDebounce | P1 | For search input |
| useFeedFilters | P2 | Filter state management |

### Database Migrations Needed

| Migration | Priority | Notes |
|-----------|----------|-------|
| PostGIS extension | P0 | Enable for geospatial |
| pg_trgm extension | P0 | Enable for fuzzy search |
| idx_shorts_published | P0 | Feed performance |
| idx_shorts_search | P0 | Full-text search |
| idx_shorts_location | P1 | Geolocation queries |

### Translations to Add

| Namespace | Languages | Status |
|-----------|-----------|--------|
| feed.json | pl, en, de, es, ru, uk | NEEDS CREATION |
| search.json | pl, en, de, es, ru, uk | NEEDS CREATION |

---

## 8. Recommendations

### Architecture Phase Priorities

1. **Database First**
   - Enable PostGIS and pg_trgm extensions
   - Create performance indexes
   - Verify Neon DB supports these extensions

2. **API Layer**
   - Create `/api/feed` endpoint first (core functionality)
   - Design filter/sort query params carefully
   - Implement scoring algorithm for algorithmic sort

3. **Component Layer**
   - Start with FeedGrid + FeedCard (reuse VideoCard styles)
   - Add infinite scroll via Intersection Observer
   - Implement FilterPanel with mobile-first approach

4. **Search Layer (P1)**
   - Full-text search requires Polish dictionary config
   - Trigram similarity for typo tolerance
   - Consider using Prisma `$queryRaw` for tsvector queries

### Technical Decisions Needed

1. **Mapbox vs Leaflet**
   - Brief specifies Mapbox for geolocation
   - Codebase uses Leaflet/OSM
   - Recommendation: Use Leaflet for consistency (free, no API key)

2. **PostGIS vs Prisma Geo**
   - Brief specifies PostGIS `ST_DWithin`
   - Neon DB supports PostGIS extension
   - Recommendation: Use PostGIS for accurate radius search

3. **Infinite Scroll Implementation**
   - Option A: useInfiniteQuery (TanStack Query)
   - Option B: Custom hook with Intersection Observer
   - Recommendation: TanStack Query (already in stack per architecture)

4. **Follow Model**
   - NOT in current schema
   - Brief mentions "Following" feed
   - Recommendation: Create Follow model or defer "Following" to Stage 5

---

## 9. Files Referenced

### Key Source Files
- `src/components/home/video-card.tsx` - Feed card reference
- `src/components/home/video-grid.tsx` - Grid layout reference
- `src/components/home/category-filter.tsx` - Filter UI reference
- `src/components/shorts/tags-autocomplete.tsx` - Autocomplete pattern
- `src/components/companies/category-combobox.tsx` - Hierarchical select pattern
- `src/components/companies/address-location.tsx` - Location/geocoding pattern
- `src/components/layout/main-sidebar.tsx` - Navigation pattern
- `src/app/api/shorts/route.ts` - API pagination pattern
- `src/app/api/tags/search/route.ts` - Search API pattern
- `src/app/actions/shorts/create.ts` - Server Action pattern
- `prisma/schema.prisma` - Database models

### Existing Pages (Static Data)
- `src/app/(main)/[locale]/page.tsx` - Home page
- `src/app/(main)/[locale]/trending/page.tsx` - Trending page
- `src/app/(main)/[locale]/following/page.tsx` - Following page
