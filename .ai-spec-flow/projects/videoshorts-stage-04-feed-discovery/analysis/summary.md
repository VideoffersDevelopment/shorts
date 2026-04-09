# Analysis Summary: Feed + Discovery (Stage 4)

**Project:** videoshorts-stage-04-feed-discovery
**Analyzed:** 2026-01-01
**Status:** ✅ Approved (iteration 1/3)

---

## Reusable Components

| Component | Path | Reuse |
|-----------|------|-------|
| VideoCard | `src/components/home/video-card.tsx` | Base for FeedCard |
| VideoGrid | `src/components/home/video-grid.tsx` | Extend for infinite scroll |
| CategoryFilter | `src/components/home/category-filter.tsx` | Reuse with dynamic data |
| Sheet | `src/components/ui/sheet.tsx` | Mobile filter panel |
| Command | `src/components/ui/command.tsx` | Search autocomplete |
| TagsAutocomplete | `src/components/shorts/tags-autocomplete.tsx` | Pattern for search |
| AddressLocation | `src/components/companies/address-location.tsx` | Leaflet geocoding |
| CategoryCombobox | `src/components/companies/category-combobox.tsx` | Multi-select pattern |

## Components to Create

| Component | Priority | Base Pattern |
|-----------|----------|--------------|
| FeedGrid | P0 | VideoGrid + infinite scroll |
| FeedCard | P0 | VideoCard + video preview |
| SearchBar | P0 | Command + Input |
| FilterPanel | P0 | Sheet (mobile) |
| SortDropdown | P0 | DropdownMenu |
| LocationPicker | P1 | AddressLocation |
| EmptyState | P1 | New component |

## Patterns Found

### Server Actions
```
AUTH → AUTHORIZATION → VALIDATION → LIMIT → TRANSACTION → revalidatePath
```
Reference: `src/app/actions/shorts/create.ts`

### API Routes
```
AUTH → ROLE_CHECK → PARSE_PARAMS → BUILD_WHERE → QUERY → PAGINATED_RESPONSE
```
Reference: `src/app/api/shorts/route.ts`

### Forms
- React Hook Form + Zod validation
- Reference: `src/lib/validation/shorts.ts`

### Translations
- 6 languages: pl, en, de, es, ru, uk
- Location: `src/lib/locales/{lang}/`
- New namespaces needed: `feed.json`, `search.json`

## Database

### Existing Models
- Short (has latitude, longitude)
- ShortStats (views, likes, engagement)
- Tag, Category, CompanyProfile

### Missing
- Follow model (defer to Stage 5)
- PostGIS indexes
- Full-text search indexes

### Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## APIs to Create

| Endpoint | Priority | Notes |
|----------|----------|-------|
| GET /api/feed | P0 | Public, filters, pagination |
| GET /api/search | P0 | Full-text search |
| GET /api/search/suggestions | P1 | Autocomplete |

## Hooks to Create

| Hook | Priority |
|------|----------|
| useInfiniteScroll | P0 |
| useGeolocation | P1 |
| useDebounce | P1 |

## Technical Decisions

1. **Geolocation:** Use Leaflet (existing) instead of Mapbox
2. **Infinite Scroll:** Use TanStack Query useInfiniteQuery
3. **Search:** PostgreSQL tsvector + pg_trgm
4. **Following Feed:** Defer Follow model to Stage 5

## Frontend Patterns

- **Navigation:** `src/components/layout/main-sidebar.tsx`
- **Translations:** `src/lib/locales/{pl,en,de,es,ru,uk}/`
- **Forms:** React Hook Form + Zod
- **Autocomplete:** Debounced 300ms, keyboard nav

---

**Full Analysis:** `./final_analysis.md`
