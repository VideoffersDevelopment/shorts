# Tasks Summary: Feed + Discovery

**For Coder Agent - Quick Reference**

---

## Execution Order

```
[1] task-01 → Database Setup (indexes, extensions)
[2] task-07 → Translations (parallel, no deps)
[3] task-02 → Feed API
[4] task-05 → Search API (can parallel with task-02)
[5] task-03 → Core Feed Components
[6] task-04 → Filter Components
[7] task-06 → Search Components
[8] task-08 → Short Detail Page
```

---

## Task Quick Reference

| ID | Files | Key Deliverables |
|----|-------|------------------|
| 01 | 6 | SQL migration, haversine.ts, feed-scoring.ts |
| 02 | 8 | GET /api/feed, FeedShort type, scoring algorithm |
| 03 | 8 | FeedGrid, FeedCard, FeedSkeleton, EmptyState, home page |
| 04 | 12 | FilterPanel, LocationPicker, SortDropdown, header.tsx |
| 05 | 4 | GET /api/search, GET /api/search/suggestions |
| 06 | 9 | SearchBar, search page, SearchResults, useDebounce |
| 07 | 13 | 12 JSON files (feed + search), i18n.ts |
| 08 | 5 | /shorts/[id] page, ShortDetailView |

---

## Critical Patterns

**API Response:**
```typescript
interface FeedResponse {
  shorts: FeedShort[]
  nextPage: number | null
  totalCount: number
  hasMore: boolean
}
```

**Infinite Scroll:**
```typescript
useInfiniteQuery + useInView (react-intersection-observer)
```

**Filter State:**
```typescript
interface FeedFilters {
  sort: 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
  categoryIds?: string[]
  tags?: string[]
  lat?: number
  lng?: number
  radius?: number
  verifiedOnly?: boolean
}
```

---

## Key Decisions

- Maps: Leaflet (not Mapbox)
- Infinite Scroll: TanStack Query useInfiniteQuery
- Search: PostgreSQL tsvector + pg_trgm
- Following: Empty state with CTA (defer to Stage 5)
