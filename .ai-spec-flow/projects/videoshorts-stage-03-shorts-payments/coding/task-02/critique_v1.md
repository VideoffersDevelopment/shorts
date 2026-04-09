# Code Review: Task 02 - Iteration 1/3

**Commit:** 55e36e3fa767b40717dcf6ee0f8b7462b3be58e7
**Verdict:** CHANGES REQUIRED

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | R2 video module exports all functions | PASS | `r2-video.ts` exports: `getVideoUploadUrl`, `getVideoDownloadUrl`, `getHlsPublicUrl`, `deleteVideoObject`, `isValidVideoType`, `ALLOWED_VIDEO_TYPES`, `MAX_VIDEO_SIZE` |
| 2 | `POST /api/shorts/upload-url` returns valid presigned URL | PASS | Returns `{ uploadUrl, key }` with proper auth and validation |
| 3 | `POST /api/shorts/thumbnail-url` returns valid presigned URL | PASS | Returns `{ uploadUrl, key, publicUrl }` with proper auth |
| 4 | `GET /api/tags/search?q=test` returns matching tags | PASS | Returns `{ tags: [...] }` with case-insensitive search |
| 5 | All 6 translation files created with complete structure | PASS | All 6 locales (en, pl, de, es, ru, uk) have identical structure |
| 6 | `npm run build` passes | PASS | Build successful with no TypeScript errors |
| 7 | No TypeScript errors | PASS | No type errors in new files |

**Acceptance Criteria Result:** PASS (7/7 criteria met)

---

## Code Quality Issues

### Issue 1: [BLOCKER] Tags Search API - Missing Auth Check

**File:** `a:\wamp64\www\shorts\src\app\api\tags\search\route.ts`
**Line:** 18-21
**Severity:** BLOCKER

**Problem:** The tags search endpoint is completely open without authentication. Per coding practices, API routes should have auth checks.

**Current Code:**
```typescript
export async function GET(
  request: Request
): Promise<NextResponse<TagSearchResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    // No auth check!
```

**Required Fix:** Add authentication check at the beginning of the handler.

```typescript
import { auth } from '@/lib/auth'

export async function GET(
  request: Request
): Promise<NextResponse<TagSearchResponse | ErrorResponse>> {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    // ... rest of implementation
```

---

### Issue 2: [HIGH] console.error in Production Code

**Files:**
- `a:\wamp64\www\shorts\src\app\api\shorts\upload-url\route.ts:72`
- `a:\wamp64\www\shorts\src\app\api\shorts\thumbnail-url\route.ts:84`
- `a:\wamp64\www\shorts\src\app\api\tags\search\route.ts:63`

**Severity:** MEDIUM (per coding practices: "No console.log" - applies to debug logging)

**Problem:** All three API routes use `console.error` which is acceptable for error logging in production. This is NOT a blocker as `console.error` for actual errors is appropriate.

**Status:** ACCEPTABLE - Error logging is appropriate behavior.

---

### Issue 3: [MEDIUM] Missing Rate Limiting in Upload URL Endpoint

**File:** `a:\wamp64\www\shorts\src\app\api\shorts\upload-url\route.ts`
**Severity:** MEDIUM

**Problem:** The spec mentions "Rate limit: max 10 uploads per hour per company" but no rate limiting is implemented.

**Spec Requirement:**
```typescript
// Rate limit: max 10 uploads per hour per company
```

**Status:** Missing feature but marked as "for MVP" - can be deferred if intentional. Should clarify with spec author.

---

### Issue 4: [LOW] Thumbnail Size Validation Missing

**File:** `a:\wamp64\www\shorts\src\app\api\shorts\thumbnail-url\route.ts`
**Severity:** LOW

**Problem:** The spec mentions "File size: max 2MB" for thumbnails but no fileSize validation exists in the Zod schema.

**Spec Requirement:**
```typescript
// Validations:
// - File size: max 2MB
```

**Current Schema:**
```typescript
const thumbnailUrlRequestSchema = z.object({
  contentType: z.string().refine(...),
  shortId: z.string().optional()
  // Missing: fileSize validation
})
```

**Required Fix:** Add fileSize to request schema.

```typescript
const MAX_THUMBNAIL_SIZE = 2_000_000 // 2MB

const thumbnailUrlRequestSchema = z.object({
  contentType: z.string().refine(
    (val) => isValidThumbnailType(val),
    { message: `Content type must be one of: ${ALLOWED_THUMBNAIL_TYPES.join(', ')}` }
  ),
  fileSize: z.number().max(MAX_THUMBNAIL_SIZE, {
    message: `File size must be less than ${MAX_THUMBNAIL_SIZE / 1_000_000}MB`
  }).optional(),
  shortId: z.string().optional()
})
```

---

## Summary

### Blockers (Must Fix):
1. **Tags Search API missing auth check** - Security issue, endpoint is completely open

### Should Fix (High Priority):
1. Thumbnail file size validation missing from spec requirements

### Can Defer (Low Priority):
1. Rate limiting for uploads (marked "for MVP" in spec)

---

## Required Actions

1. Add `auth()` check to `/api/tags/search` endpoint
2. Add `fileSize` validation to thumbnail upload URL schema

---

## Positive Observations

- R2 video module follows existing `r2.ts` pattern well
- Type definitions are clean with no `any` types
- Zod validation is properly implemented
- Translation files are complete with proper translations (not just English copies)
- The i18n.ts configuration already includes `shorts` namespace (line 26, 40, 58)
- Proper error handling with typed responses
- Key format follows spec: `shorts/{companyId}/{nanoid()}` and `thumbnails/{companyId}/{folder}/{nanoid()}.{ext}`
