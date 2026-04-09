# Task Breakdown: Feed + Discovery (Stage 4)

**Project:** videoshorts-stage-04-feed-discovery
**Total Tasks:** 8
**Iteration:** v2
**Date:** 2026-01-01

---

## Summary

| Task | Name | Priority | Dependencies | Complexity | Status |
|------|------|----------|--------------|------------|--------|
| 01 | Database Setup | HIGH | None | Simple (6 files, ~6k tokens) | pending |
| 02 | Feed API | HIGH | task-01 | Medium (8 files, ~8k tokens) | pending |
| 03 | Core Feed Components | HIGH | task-02 | Medium (9 files, ~9k tokens) | pending |
| 04 | Filter Components | HIGH | task-03 | Medium (11 files, ~11k tokens) | pending |
| 05 | Search API | MEDIUM | task-01 | Simple (4 files, ~4k tokens) | pending |
| 06 | Search Components | MEDIUM | task-03, task-05 | Medium (8 files, ~8k tokens) | pending |
| 07 | Translations & i18n | MEDIUM | None | Medium (13 files, ~13k tokens) | pending |
| 08 | Short Detail Page | MEDIUM | task-02, task-03 | Medium (9 files, ~9k tokens) | pending |

---

## Dependency Graph

```
task-01 (Database)
    │
    ├──► task-02 (Feed API)
    │       │
    │       ├──► task-03 (Core Feed Components) ──┬──► task-04 (Filter Components)
    │       │       │                             │
    │       │       │                             └──► task-06 (Search Components)
    │       │       │                                      ▲
    │       │       └──► task-08 (Short Detail Page)       │
    │       │                                              │
    │       └──► task-08 (Short Detail Page)               │
    │                                                      │
    └──► task-05 (Search API) ─────────────────────────────┘

task-07 (Translations) ─── No dependencies (can run in parallel)
```

**Note:** Task 06 depends on BOTH task-03 (for useDebounce hook) and task-05 (for Search API).

---

## Critical Path

**Main Flow:** task-01 → task-02 → task-03 → task-04

**Parallel Tracks:**
- Search: task-01 → task-05 → (wait for task-03) → task-06
- Translations: task-07 (independent)
- Detail Page: task-08 (after task-02, task-03)

**Shared Dependencies:**
- `useDebounce` hook created in task-03, used by task-04 and task-06

---

## Task Details

### Task 01: Database Setup
- Enable PostGIS and pg_trgm PostgreSQL extensions
- Create performance indexes for feed queries
- Add utility functions (haversine distance, scoring helpers)

### Task 02: Feed API
- GET /api/feed endpoint with filters, sorting, pagination
- Algorithmic scoring implementation
- Diversity filter (max 2 shorts per company)

### Task 03: Core Feed Components
- FeedGrid with infinite scroll (useInfiniteQuery)
- FeedCard with video preview on hover
- FeedSkeleton loading state
- EmptyState variants
- **useDebounce hook** (shared utility for task-04, task-06)
- Home page modification to use dynamic feed

### Task 04: Filter Components
- FilterPanel (Sheet mobile / Popover desktop)
- LocationPicker with Leaflet + geolocation
- CategoryMultiSelect (hierarchical, max 5)
- TagFilter autocomplete
- SortDropdown (5 options)
- VerifiedToggle, RadiusSelector
- ActiveFiltersBar with pills
- Header integration

### Task 05: Search API
- GET /api/search with full-text search (tsvector)
- GET /api/search/suggestions for autocomplete
- PostgreSQL fuzzy matching (pg_trgm)

### Task 06: Search Components
- SearchBar with Command autocomplete
- SearchSuggestions dropdown
- Search results page with tabs
- SearchResults grid
- Uses useDebounce hook from task-03

### Task 07: Translations & i18n
- feed.json for 6 languages (pl, en, de, es, ru, uk)
- search.json for 6 languages
- i18n.ts configuration update

### Task 08: Short Detail Page
- Public short view page (/shorts/[id])
- ShortDetailView component
- Related shorts section (optional)

---

## Files Summary

### New Files (44 total)

**API Routes (4):**
- src/app/api/feed/route.ts
- src/app/api/search/route.ts
- src/app/api/search/suggestions/route.ts

**Pages (2):**
- src/app/(main)/[locale]/search/page.tsx
- src/app/(main)/[locale]/shorts/[id]/page.tsx

**Feed Components (13):**
- src/components/feed/feed-grid.tsx
- src/components/feed/feed-card.tsx
- src/components/feed/feed-skeleton.tsx
- src/components/feed/feed-video-preview.tsx
- src/components/feed/filter-panel.tsx
- src/components/feed/sort-dropdown.tsx
- src/components/feed/radius-selector.tsx
- src/components/feed/category-multi-select.tsx
- src/components/feed/tag-filter.tsx
- src/components/feed/verified-toggle.tsx
- src/components/feed/active-filters-bar.tsx
- src/components/feed/empty-state.tsx
- src/components/feed/location-picker.tsx

**Search Components (4):**
- src/components/search/search-bar.tsx
- src/components/search/search-suggestions.tsx
- src/components/search/search-results.tsx
- src/components/search/search-tabs.tsx

**Shorts Components (1):**
- src/components/shorts/short-detail-view.tsx

**Hooks (4):**
- src/hooks/use-infinite-scroll.ts
- src/hooks/use-geolocation.ts
- src/hooks/use-debounce.ts
- src/hooks/use-feed-filters.ts

**Utils (2):**
- src/lib/utils/haversine.ts
- src/lib/utils/feed-scoring.ts

**Translations (12):**
- src/lib/locales/{pl,en,de,es,ru,uk}/feed.json
- src/lib/locales/{pl,en,de,es,ru,uk}/search.json

**Database (1):**
- prisma/migrations/[timestamp]_feed_discovery_indexes/migration.sql

### Modified Files (9)
- src/app/(main)/[locale]/page.tsx
- src/components/layout/header.tsx
- i18n.ts
- src/lib/locales/pl/shorts.json (Task 08 - new translation keys)
- src/lib/locales/en/shorts.json (Task 08 - new translation keys)
- src/lib/locales/de/shorts.json (Task 08 - new translation keys)
- src/lib/locales/es/shorts.json (Task 08 - new translation keys)
- src/lib/locales/ru/shorts.json (Task 08 - new translation keys)
- src/lib/locales/uk/shorts.json (Task 08 - new translation keys)

---

## Notes

1. **Following Feed:** Deferred to Stage 5 (requires Follow model). Task-03 includes empty state with CTA.

2. **Maps Library:** Using Leaflet (already in codebase) instead of Mapbox per analysis recommendation.

3. **Video Preview:** Native HTML5 video element, no additional library needed.

4. **PostgreSQL Extensions:** PostGIS and pg_trgm must be enabled via Neon DB console before running migrations.

5. **Existing Dependencies (Already in Codebase):**
   - `src/hooks/use-media-query.ts` - Used by FilterPanel (Task 04)
   - `src/app/api/tags/search/route.ts` - Used by TagFilter (Task 04)
   - `src/app/api/categories/[categoryId]/subcategories/route.ts` - Reference for categories

6. **Shared Hooks:**
   - `useDebounce` created in Task 03, used by Task 04 (TagFilter) and Task 06 (SearchBar)
