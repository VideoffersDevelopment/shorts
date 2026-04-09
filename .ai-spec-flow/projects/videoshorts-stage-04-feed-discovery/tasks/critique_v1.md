# Task Breakdown Critique v1

**Project:** videoshorts-stage-04-feed-discovery
**Reviewed:** 2026-01-01
**Iteration:** 1/3

---

## Verdict: REJECT

The task breakdown requires corrections before proceeding. See issues below.

---

## Issues Found

### 1. Task 04 Exceeds Size Limit

**Current:** 12 files (~12k tokens) - listed as 10 create + 1 modify
**Actual File Count:** 10 create + 1 modify = 11 files
**Status:** BORDERLINE PASS (within 20 file limit, within 25k token limit)

This is acceptable but on the higher end. No action required.

### 2. Missing Hook: useMediaQuery in Task 04

**Issue:** Task 04 (Filter Components) uses `useMediaQuery` hook in `filter-panel.tsx` but this hook is not listed in "Files to Create".

**Location in spec:**
```typescript
import { useMediaQuery } from '@/hooks/use-media-query'
```

**Action Required:** Either:
- Add `src/hooks/use-media-query.ts` to Task 04's "Files to Create"
- OR confirm this hook already exists in the codebase

### 3. Missing API Route in File Count

**Issue:** Task 02 references 3 files to create but the architecture shows:
- `src/app/api/feed/route.ts`

This is correctly listed. No issue.

### 4. Task 03 Dependency on useDebounce

**Issue:** Task 04 (TagFilter component) imports `useDebounce` from `@/hooks/use-debounce.ts`, but this hook is created in Task 06, not Task 04.

**Current Dependencies:** task-04 depends on task-03
**Required:** task-04 should also depend on task-06 OR useDebounce should be created earlier

**Action Required:** Move `src/hooks/use-debounce.ts` from Task 06 to Task 03 or Task 04.

### 5. Missing API Endpoint for Tags Search

**Issue:** Task 04's `TagFilter` component calls `/api/tags/search`:
```typescript
const response = await fetch(`/api/tags/search?q=${encodeURIComponent(debouncedQuery)}`)
```

This endpoint is not defined in any task specification.

**Action Required:** Add `/api/tags/search` endpoint creation to Task 04 or Task 05.

### 6. Missing API Endpoint for Categories

**Issue:** Task 04's `CategoryMultiSelect` component calls `/api/categories`:
```typescript
const response = await fetch('/api/categories')
```

This endpoint is not defined in any task specification. Need to confirm if it already exists in the codebase.

**Action Required:** Either:
- Confirm `/api/categories` already exists
- OR add this endpoint to Task 04

### 7. Task 08 - Missing Translation Keys

**Issue:** Task 08 adds new translation keys to `shorts.json`:
- `backToFeed`
- `viewOffer`
- `viewCompany`
- `relatedShorts`

These keys are not included in Task 07 (Translations).

**Action Required:** Either:
- Add these keys to Task 08's "Files to Modify" section (modify existing shorts.json files)
- OR add them to Task 07

### 8. Missing Visual Verification Steps Selectors

**Issue:** Several Visual Verification Steps tables have incomplete selectors.

**Task 02:**
| Step | Selector Issue |
|------|----------------|
| 4 | "Check company.verified=true" - not a CSS selector |

**Task 03:**
| Step | Selector Issue |
|------|----------------|
| 2 | `.grid > a` is valid |

**Task 04:**
| Step | Selector Issue |
|------|----------------|
| 2 | `button:has-text("For You")` - Playwright syntax, not CSS |

**Action Required:** Standardize selectors to valid CSS or explain they are Playwright selectors.

---

## Validation Summary

| Category | Status | Notes |
|----------|--------|-------|
| Task Size | PASS | All tasks within limits (max 13 files) |
| Dependencies | FAIL | useDebounce created after usage |
| Frontend Coverage | PASS | All pages and components covered |
| Translations | PARTIAL | Missing shorts.json keys for Task 08 |
| Acceptance Criteria | PASS | All tasks have testable criteria |
| Visual Verification | PARTIAL | Selectors need standardization |
| Architecture Coverage | FAIL | Missing /api/tags/search, /api/categories |

---

## Files Coverage Check

### Architecture vs Tasks

| Architecture File | Task | Status |
|-------------------|------|--------|
| `src/app/api/feed/route.ts` | 02 | COVERED |
| `src/app/api/search/route.ts` | 05 | COVERED |
| `src/app/api/search/suggestions/route.ts` | 05 | COVERED |
| `src/app/(main)/[locale]/search/page.tsx` | 06 | COVERED |
| `src/app/(main)/[locale]/shorts/[id]/page.tsx` | 08 | COVERED |
| `src/components/feed/*` (13 files) | 03, 04 | COVERED |
| `src/components/search/*` (4 files) | 06 | COVERED |
| `src/components/shorts/short-detail-view.tsx` | 08 | COVERED |
| `src/hooks/use-infinite-scroll.ts` | 03 | COVERED |
| `src/hooks/use-geolocation.ts` | 04 | COVERED |
| `src/hooks/use-debounce.ts` | 06 | COVERED (but needed earlier) |
| `src/hooks/use-feed-filters.ts` | 04 | COVERED |
| `src/lib/utils/haversine.ts` | 01 | COVERED |
| `src/lib/utils/feed-scoring.ts` | 01 | COVERED |
| Translation files (12) | 07 | COVERED |
| `prisma/migrations/*/migration.sql` | 01 | COVERED |

### Missing from Architecture

| File | Should Be In Task |
|------|-------------------|
| `src/hooks/use-media-query.ts` | 04 (if not existing) |
| `src/app/api/tags/search/route.ts` | 04 or 05 |
| `src/app/api/categories/route.ts` | 04 (if not existing) |

---

## Required Changes

### Priority 1 (Must Fix)

1. **Move useDebounce to earlier task:**
   - Move from Task 06 to Task 03 or Task 04
   - Update dependencies accordingly

2. **Add missing API endpoints:**
   - Add `/api/tags/search` route to Task 04 or Task 05
   - Confirm or add `/api/categories` route

3. **Add useMediaQuery hook:**
   - Add to Task 04 if not already in codebase

### Priority 2 (Should Fix)

4. **Update Task 08 to modify shorts.json:**
   - Add all 6 language files to "Files to Modify"
   - Include new translation keys

5. **Standardize Visual Verification selectors:**
   - Use consistent selector format (CSS or explain Playwright)

---

## Recommended Fixes

### Fix 1: Update Task 04 Dependencies and Files

Add to Task 04 "Files to Create":
```
| `src/hooks/use-debounce.ts` | Create | Debounce hook |
| `src/hooks/use-media-query.ts` | Create | Media query hook |
| `src/app/api/tags/search/route.ts` | Create | Tag search API |
```

Remove from Task 06 "Files to Create":
```
| `src/hooks/use-debounce.ts` | Create | Debounce hook |
```

### Fix 2: Confirm Existing APIs

Verify in codebase if these exist:
- `/api/categories` - likely exists from earlier stages
- `useMediaQuery` - likely exists in hooks folder

### Fix 3: Update Task 08 Files to Modify

Add to Task 08 "Files to Modify":
```
| `src/lib/locales/pl/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/en/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/de/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/es/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/ru/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/uk/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
```

---

## Conclusion

The task breakdown is well-structured with good vertical slicing. The main issues are:
1. Hook dependency ordering (useDebounce needed before it's created)
2. Missing API endpoints for tag search
3. Missing translation keys in Task 08

After fixing these issues, the breakdown will be ready for implementation.
