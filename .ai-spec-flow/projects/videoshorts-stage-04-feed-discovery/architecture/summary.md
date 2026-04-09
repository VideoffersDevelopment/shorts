# Architecture Summary: Feed + Discovery (Stage 4)

**Project:** videoshorts-stage-04-feed-discovery
**Approved:** 2026-01-01 (iteration 1/3)
**Status:** ✅ Ready for Task Planning

---

## Database Schema

### Extensions Required
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Key Indexes
```sql
CREATE INDEX idx_shorts_published ON "Short"("publishedAt" DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_search ON "Short" USING GIN(to_tsvector('polish', title || ' ' || description));
CREATE INDEX idx_shorts_location ON "Short"(latitude, longitude) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_title_trigram ON "Short" USING GIST(title gist_trgm_ops);
```

---

## API Endpoints

| Endpoint | File | Purpose |
|----------|------|---------|
| GET /api/feed | `src/app/api/feed/route.ts` | Public feed with filters, pagination, sorting |
| GET /api/search | `src/app/api/search/route.ts` | Full-text search (tsvector + trigram) |
| GET /api/search/suggestions | `src/app/api/search/suggestions/route.ts` | Autocomplete suggestions |

---

## Components

### Feed Components
| Component | File | Type |
|-----------|------|------|
| FeedGrid | `src/components/feed/feed-grid.tsx` | Client (infinite scroll) |
| FeedCard | `src/components/feed/feed-card.tsx` | Client (video preview) |
| FeedSkeleton | `src/components/feed/feed-skeleton.tsx` | Client |
| FilterPanel | `src/components/feed/filter-panel.tsx` | Client (Sheet/Popover) |
| SortDropdown | `src/components/feed/sort-dropdown.tsx` | Client |
| LocationPicker | `src/components/feed/location-picker.tsx` | Client (Leaflet) |
| EmptyState | `src/components/feed/empty-state.tsx` | Client |

### Search Components
| Component | File | Type |
|-----------|------|------|
| SearchBar | `src/components/search/search-bar.tsx` | Client (Command) |
| SearchSuggestions | `src/components/search/search-suggestions.tsx` | Client |
| SearchResults | `src/components/search/search-results.tsx` | Client |
| SearchTabs | `src/components/search/search-tabs.tsx` | Client |

---

## Pages

| Page | Path | Type |
|------|------|------|
| Home (Feed) | `src/app/(main)/[locale]/page.tsx` | Server (MODIFY) |
| Search | `src/app/(main)/[locale]/search/page.tsx` | Server (CREATE) |
| Short Detail | `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Server (CREATE) |

---

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| useInfiniteScroll | `src/hooks/use-infinite-scroll.ts` | Intersection Observer |
| useGeolocation | `src/hooks/use-geolocation.ts` | Browser location API |
| useDebounce | `src/hooks/use-debounce.ts` | Search input debounce |
| useFeedFilters | `src/hooks/use-feed-filters.ts` | URL-synced filter state |

---

## Translations

**Namespaces:** `feed.json`, `search.json`
**Languages:** pl, en, de, es, ru, uk (6 total)
**Location:** `src/lib/locales/{lang}/`

**Key Prefixes:**
- `feed.sort.*` - Sort options
- `feed.filters.*` - Filter labels
- `feed.empty.*` - Empty states
- `search.bar.*` - Search placeholder
- `search.suggestions.*` - Autocomplete categories
- `search.results.*` - Results page

---

## Implementation Phases

| Phase | Days | Focus |
|-------|------|-------|
| 1 | 1 | Database indexes + extensions |
| 2 | 2-3 | API endpoints (feed, search) |
| 3 | 4-5 | Core components (FeedGrid, FeedCard) |
| 4 | 6-7 | Filters (location, categories, tags) |
| 5 | 8-9 | Search (bar, suggestions, results) |
| 6 | 10 | Translations + polish |

---

## Technical Decisions

| Decision | Choice |
|----------|--------|
| Maps | Leaflet (existing, free) |
| Infinite Scroll | TanStack Query |
| Search | PostgreSQL tsvector + pg_trgm |
| Following Feed | Empty state + CTA (defer Follow to Stage 5) |

---

**Full Architecture:** `./final_architecture.md`
