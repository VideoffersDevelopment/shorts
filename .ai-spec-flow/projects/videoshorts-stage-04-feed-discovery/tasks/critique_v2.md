# Task Breakdown Critique v2

**Project:** videoshorts-stage-04-feed-discovery
**Reviewed:** 2026-01-01
**Iteration:** 2/3

---

## Verdict: OK

All issues from v1 critique have been addressed. The task breakdown is ready for implementation.

---

## Previous Issues - Resolution Status

### 1. Hook Dependency Ordering (useDebounce) - FIXED

**v1 Issue:** `useDebounce` was created in Task 06 but needed by Task 04.

**v2 Status:** RESOLVED
- Task 03 now creates `src/hooks/use-debounce.ts` (line 29 in spec.md)
- Task 04 correctly references it as dependency from task-03 (line 17 in spec.md)
- Task 06 correctly lists it as dependency from task-03 (line 14 in spec.md)
- index.md confirms: "useDebounce created in Task 03, used by Task 04 (TagFilter) and Task 06 (SearchBar)"

### 2. Missing API Endpoints - RESOLVED

**v1 Issue:** `/api/tags/search` endpoint not defined in any task.

**v2 Status:** RESOLVED
- Task 04 now explicitly notes: "`src/app/api/tags/search/route.ts` | EXISTS | Used by TagFilter for autocomplete"
- Verified in codebase: File exists at `a:\wamp64\www\shorts\src\app\api\tags\search\route.ts`

### 3. Missing Hook (useMediaQuery) - RESOLVED

**v1 Issue:** `useMediaQuery` hook not listed in files to create.

**v2 Status:** RESOLVED
- Task 04 now explicitly notes: "`src/hooks/use-media-query.ts` | EXISTS | Used in FilterPanel for responsive design"
- Verified in codebase: File exists at `a:\wamp64\www\shorts\src\hooks\use-media-query.ts`

### 4. Missing Translation Keys (Task 08) - FIXED

**v1 Issue:** Task 08 used translation keys not included in any task's files.

**v2 Status:** RESOLVED
- Task 08 now includes all 6 `shorts.json` files in "Files to Modify" section
- Keys listed: `backToFeed`, `viewOffer`, `viewCompany`, `relatedShorts`
- All 6 languages covered: pl, en, de, es, ru, uk
- File count updated in index.md: "Modified Files (9)" including these 6 shorts.json files

---

## Re-Validation Results

### Task Size Validation

| Task | Files | Est. Tokens | Status |
|------|-------|-------------|--------|
| 01 | 6 | ~6k | PASS (Simple) |
| 02 | 8 | ~8k | PASS (Medium) |
| 03 | 9 | ~9k | PASS (Medium) |
| 04 | 11 | ~11k | PASS (Medium) |
| 05 | 4 | ~4k | PASS (Simple) |
| 06 | 8 | ~8k | PASS (Medium) |
| 07 | 13 | ~13k | PASS (Medium) |
| 08 | 9 | ~9k | PASS (Medium) |

All tasks within limits (max 20 files, max 25k tokens).

### Dependency Validation

| Task | Dependencies | Status |
|------|--------------|--------|
| 01 | None | VALID |
| 02 | task-01 | VALID (DB before API) |
| 03 | task-02 | VALID (API before UI) |
| 04 | task-03 | VALID (includes useDebounce) |
| 05 | task-01 | VALID (DB before Search API) |
| 06 | task-03, task-05 | VALID (useDebounce + Search API) |
| 07 | None | VALID (parallel) |
| 08 | task-02, task-03 | VALID (API + Feed components) |

No circular dependencies. Dependency graph is valid.

### Frontend Coverage

| Feature | Task | Status |
|---------|------|--------|
| Home page feed | 03 | COVERED |
| Filter panel | 04 | COVERED |
| Search bar | 06 | COVERED |
| Search page | 06 | COVERED |
| Short detail page | 08 | COVERED |
| Navigation (header) | 04, 06 | COVERED |

### Translation Coverage

| Language | feed.json | search.json | shorts.json | Status |
|----------|-----------|-------------|-------------|--------|
| pl | Task 07 | Task 07 | Task 08 | COVERED |
| en | Task 07 | Task 07 | Task 08 | COVERED |
| de | Task 07 | Task 07 | Task 08 | COVERED |
| es | Task 07 | Task 07 | Task 08 | COVERED |
| ru | Task 07 | Task 07 | Task 08 | COVERED |
| uk | Task 07 | Task 07 | Task 08 | COVERED |

All 6 languages covered for all namespaces.

### Existing Dependencies Validation

| File | Claimed Status | Verified |
|------|----------------|----------|
| `src/hooks/use-media-query.ts` | EXISTS | YES - Found in codebase |
| `src/app/api/tags/search/route.ts` | EXISTS | YES - Found in codebase |
| `src/app/api/categories/[categoryId]/subcategories/route.ts` | EXISTS | YES - Found in codebase |

### Visual Verification Steps

All UI tasks (03, 04, 06, 08) include:
- Prerequisites section
- Steps table with Action, Expected Result, Selector/URL
- Screenshot checkpoints

---

## Architecture Coverage

All files from architecture are assigned to tasks:

| Category | Count | Status |
|----------|-------|--------|
| API Routes | 3 new | COVERED |
| Pages | 2 new | COVERED |
| Feed Components | 13 new | COVERED |
| Search Components | 4 new | COVERED |
| Shorts Components | 1 new | COVERED |
| Hooks | 4 new | COVERED |
| Utils | 2 new | COVERED |
| Translations | 12 new + 6 modified | COVERED |
| Database Migrations | 1 new | COVERED |

---

## Summary

The task breakdown has been corrected to address all issues from the v1 critique:

1. `useDebounce` hook is now created in Task 03 (earlier in pipeline)
2. Existing API endpoints (`/api/tags/search`) are properly documented
3. Existing hooks (`useMediaQuery`) are properly documented
4. Task 08 now includes all 6 `shorts.json` translation files

The breakdown is well-structured with:
- Proper vertical slicing
- Clear dependencies
- Complete translation coverage
- All acceptance criteria testable
- Visual verification steps for UI tasks

**Verdict: OK - Ready for implementation.**
