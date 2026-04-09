# Code Review: Task 05 - Iteration 1/3

**Commit:** 6ed927de8bb15821ffad1aad444a41605d51fdac
**Message:** feat(task-05): implement search API with full-text search - iteration v1
**Verdict:** OK

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | GET /api/search returns search results | PASS | `src/app/api/search/route.ts` created with GET handler |
| 2 | Query param `q` required (min 2 chars) | PASS | Zod schema: `z.string().min(2, 'Query must be at least 2 characters')` |
| 3 | Type filter works (all, shorts, companies) | PASS | `z.enum(['all', 'shorts', 'companies']).default('all')` |
| 4 | Pagination works (page, limit) | PASS | `page` and `limit` params validated and used in offset calculation |
| 5 | Category filter works | PASS | `categoryIds` param with `ANY($N::text[])` SQL filter |
| 6 | Location filter works with radius | PASS | Bounding box calculation with lat/lng/radius |
| 7 | Results sorted by rank | PASS | `results.sort((a, b) => b.rank - a.rank)` |
| 8 | Full-text search with Polish dictionary | PASS | `to_tsvector('polish', ...)` and `plainto_tsquery('polish', ...)` |
| 9 | Trigram similarity for fuzzy matching | PASS | `similarity(s.title, $1)` and `s.title % $N` operators |
| 10 | GET /api/search/suggestions returns autocomplete | PASS | `src/app/api/search/suggestions/route.ts` created |
| 11 | Suggestions include shorts and companies | PASS | `searchShortsSuggestions()` and `searchCompaniesSuggestions()` |
| 12 | Popular tags returned | PASS | `getPopularSearchTerms()` via `prisma.tag.findMany` |
| 13 | Invalid params return 400 error | PASS | ZodError check returns 400 |
| 14 | `npm run build` passes | PASS | Build successful |
| 15 | No TypeScript errors | PASS | Build linting passed |

**Acceptance Criteria Result:** PASS (15/15 criteria met)

---

## Code Quality Review

### Type Safety

| Check | Status | Notes |
|-------|--------|-------|
| No `any` types | PASS | All types explicitly defined: `RawShortRow`, `RawCompanyRow`, `SearchOptions`, etc. |
| Proper interfaces | PASS | Dedicated interfaces for raw SQL row types |
| Type exports | PASS | Types exported from `src/lib/types/feed.ts` |

### Zod Validation

| Check | Status | Notes |
|-------|--------|-------|
| Input validation | PASS | `searchQuerySchema` and `suggestionsQuerySchema` |
| Proper coercion | PASS | `z.coerce.number()` for numeric params |
| Bounds validation | PASS | lat (-90, 90), lng (-180, 180), radius (1, 100) |

### Error Handling

| Check | Status | Notes |
|-------|--------|-------|
| 400 for invalid input | PASS | `ZodError` check returns 400 |
| 500 for server errors | PASS | Generic catch returns 500 |
| Error logging | PASS | `console.error()` for debugging |

### SQL Injection Prevention

| Check | Status | Notes |
|-------|--------|-------|
| Parameterized queries | PASS | All user input via `$N` placeholders |
| Raw unsafe queries | NOTE | Using `$queryRawUnsafe` but properly parameterized |
| Tagged template literals | PASS | Suggestions API uses `$queryRaw` with template literals |

**Analysis:** The code uses `$queryRawUnsafe` for the main search endpoint due to dynamic WHERE clause construction. However, all user inputs are passed through numbered parameters (`$1`, `$2`, etc.) and never concatenated directly into the SQL string. The query string is built from static conditions only. This is a safe pattern.

### Coding Practices Compliance

| Practice | Status | Notes |
|----------|--------|-------|
| No `any` type (Zasada #1) | PASS | All types explicit |
| Zod validation (Zasada #1-2) | PASS | Schemas centralized in `src/lib/validation/search.ts` |
| UUID validation | N/A | No ID validation needed for search |
| Input sanitization | PASS | Zod handles input validation |

### OWASP Top 10

| Vulnerability | Status | Notes |
|--------------|--------|-------|
| A01 Broken Access Control | N/A | Public search endpoint |
| A03 Injection | PASS | Parameterized queries |
| A05 Security Misconfiguration | PASS | Proper error responses |
| A07 XSS | N/A | API returns JSON only |

---

## Files Reviewed

### 1. `src/app/api/search/route.ts` (335 lines)

**Positive:**
- Proper TypeScript interfaces for raw SQL results
- Full-text search using Polish dictionary (`to_tsvector('polish', ...)`)
- Trigram similarity for fuzzy matching (`similarity()` and `%` operator)
- Location filtering with bounding box calculation
- Proper pagination handling

**Minor Observations:**
- Line 88: `console.error` - acceptable for API error logging
- `$queryRawUnsafe` usage is justified due to dynamic WHERE clause construction

### 2. `src/app/api/search/suggestions/route.ts` (125 lines)

**Positive:**
- Uses safe `$queryRaw` with tagged template literals
- Parallel execution with `Promise.all()`
- Proper error handling (400/500)

### 3. `src/lib/validation/search.ts` (21 lines)

**Positive:**
- Clean Zod schemas
- Proper type exports with `z.infer<>`
- Transform for categoryIds (comma-separated string to array)

### 4. `src/lib/types/feed.ts` (additions)

**Positive:**
- Complete type definitions matching spec
- Proper union types (`FeedShort | CompanyResult`)

---

## Summary

The implementation is **well-structured and follows coding practices**:

1. **Type Safety:** No `any` types, all raw SQL results properly typed
2. **Validation:** Comprehensive Zod schemas for all query parameters
3. **Security:** SQL injection prevented via parameterized queries
4. **Error Handling:** Proper 400/500 responses with error logging
5. **Features:** Full-text search (Polish), trigram similarity, location filtering, pagination

**No blocking issues found.**

---

## Verdict: OK

The implementation meets all acceptance criteria and follows coding practices. Ready for testing.
