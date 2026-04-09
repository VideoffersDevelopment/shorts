# Stage 03: Task Breakdown

**Project:** videoshorts-stage-03-shorts-payments
**Total Tasks:** 7
**Status:** All Completed

---

## Task Dependencies

```
Task 01: Database + Infrastructure
    |
    +-----> Task 02: R2 Video + Upload API
    |           |
    |           +-----> Task 03: Upload Wizard UI
    |           |           |
    |           +-----> Task 04: Qencode + Inngest
    |                       |
    +-----> Task 05: Payments + Credits
                |
                +-----> Task 06: Management UI (depends on 03, 05)
                            |
                            +-----> Task 07: Lifecycle + Public View (depends on 04, 06)
```

---

## Task 01: Database Schema + Infrastructure

**Priority:** HIGH
**Complexity:** Simple (8 files)
**Iterations:** 1 (approved first iteration)

### What Was Built

1. Prisma schema migration (Mux to Qencode field renames)
2. NPM packages installation (@vidstack/react, inngest)
3. Validation schemas (shorts, payments)
4. Inngest client configuration
5. i18n namespace configuration
6. Environment variables template

### Key Files

| File | Type | Description |
|------|------|-------------|
| `prisma/schema.prisma` | Modified | Field renames, new models |
| `src/lib/validation/shorts.ts` | Created | Zod schemas for short operations |
| `src/lib/validation/payments.ts` | Created | Zod schemas for payments |
| `src/lib/inngest/client.ts` | Created | Inngest client setup |
| `src/lib/inngest/events.ts` | Created | Event type definitions |

### Commits

- `e67407d` - feat(task-01): add shorts and payments database schema - iteration v1
- `f5c901e` - test(task-01): add validation and inngest tests - iteration v1

### Tests: 53 passing

---

## Task 02: R2 Video Module + Upload API

**Priority:** HIGH
**Complexity:** Simple (10 files)
**Iterations:** 2 (rejected iteration 1 for auth issues)

### What Was Built

1. R2 video client for presigned URLs
2. Video upload URL API endpoint
3. Thumbnail upload URL API endpoint
4. Tags search API endpoint
5. Translation files (shorts.json for 6 locales)

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/lib/r2-video.ts` | Created | R2 video bucket operations |
| `src/app/api/shorts/upload-url/route.ts` | Created | Video upload presigned URL |
| `src/app/api/shorts/thumbnail-url/route.ts` | Created | Thumbnail upload URL |
| `src/app/api/tags/search/route.ts` | Created | Tag autocomplete search |
| `src/lib/locales/*/shorts.json` | Created | 6 translation files |

### Key Functions

```typescript
// R2 Video Module
export async function getVideoUploadUrl(options: VideoUploadUrlOptions): Promise<string>
export async function getVideoDownloadUrl(options: VideoDownloadUrlOptions): Promise<string>
export function getHlsPublicUrl(key: string): string
export async function deleteVideoObject(key: string): Promise<void>
```

### Commits

- `55e36e3` - feat(task-02): add R2 video module and upload APIs - iteration v1
- `8473fed` - fix(task-02): add auth check to tags search and thumbnail size validation - iteration v2
- `99c3fa8` - test(task-02): add R2 video module and API route tests

### Tests: 87 passing

---

## Task 03: Upload Wizard UI + Server Action

**Priority:** HIGH
**Complexity:** Medium (18 files)
**Iterations:** 2 (rejected iteration 1 for i18n issues)

### What Was Built

1. VideoDropzone component (drag & drop with progress)
2. Video preview component
3. Metadata form (title, description, category, tags, location, CTA)
4. Tags autocomplete component
5. Thumbnail selector (auto/custom)
6. Step indicator component
7. Complete wizard wrapper
8. createShortAction server action
9. Panel pages (list + new)
10. Sidebar navigation updates

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/components/shorts/video-upload-wizard.tsx` | Created | Multi-step wizard |
| `src/components/shorts/video-dropzone.tsx` | Created | Drag & drop upload |
| `src/components/shorts/short-metadata-form.tsx` | Created | Metadata form |
| `src/components/shorts/tags-autocomplete.tsx` | Created | Tag input |
| `src/app/actions/shorts/create.ts` | Created | Create short action |
| `src/app/(main)/[locale]/panel/shorts/page.tsx` | Created | Shorts list |
| `src/app/(main)/[locale]/panel/shorts/new/page.tsx` | Created | Upload wizard page |

### createShortAction Flow

```typescript
// 1. AUTH - verify session
// 2. AUTHORIZATION - verify company profile
// 3. VALIDATION - validate with Zod schema
// 4. LIMIT CHECK - max 10 drafts per company
// 5. TRANSACTION:
//    - Create Short record
//    - Create/upsert Tags
//    - Create ShortTag junction records
//    - Create ShortStats record
// 6. revalidatePath("/panel/shorts")
// 7. Return { shortId }
```

### Commits

- `3c2ea42` - feat(task-03): add upload wizard UI and create short action - iteration v1
- `6884c17` - fix(task-03): add aspect ratio warning and fix i18n - iteration v2
- `93ec932` - test(task-03): add upload wizard and server action tests - iteration v1
- `888dfd0` - test(task-03): fix test failures for upload wizard components - iteration v2

### Tests: 179 passing

---

## Task 04: Qencode Integration + Inngest Jobs

**Priority:** HIGH
**Complexity:** Medium (15 files)
**Iterations:** 2 (rejected iteration 1 for missing i18n in 4 locales)

### What Was Built

1. Qencode API client for transcoding
2. Inngest functions for video processing
3. Qencode webhook handler
4. Processing status API endpoint
5. Processing status timeline UI
6. Video player component (@vidstack/react)
7. Publishing status page
8. Publish server action
9. Email template for processing complete

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/lib/qencode.ts` | Created | Qencode API client |
| `src/lib/inngest/functions/process-video.ts` | Created | Start transcoding |
| `src/lib/inngest/functions/cleanup-video.ts` | Created | Cleanup raw video |
| `src/app/api/webhooks/qencode/route.ts` | Created | Webhook handler |
| `src/components/shorts/short-player.tsx` | Created | HLS video player |
| `src/components/shorts/processing-status-timeline.tsx` | Created | Status display |
| `src/app/actions/shorts/publish.ts` | Created | Publish action |

### Qencode Transcoding Profile

```typescript
// HLS output with 3 quality levels
const streams = [
  { size: "1080x1920", bitrate: 4500, profile: "high" },
  { size: "720x1280", bitrate: 2500, profile: "main" },
  { size: "480x854", bitrate: 1000, profile: "main" }
]
// Segment duration: 4 seconds
// Codec: H.264
```

### Commits

- `77bc3fa` - feat(task-04): add Qencode integration and Inngest jobs - iteration v1
- `879e8ec` - fix(task-04): add i18n translations to DE/ES/RU/UK locales - iteration v2
- `20c1f4e` - test(task-04): add comprehensive tests for Qencode and Inngest - iteration v1
- `b22a4e6` - fix(task-04): resolve test failures for Qencode integration tests - iteration v2

### Tests: 221 passing

---

## Task 05: Payment Providers + Credits System

**Priority:** HIGH
**Complexity:** Medium (18 files)
**Iterations:** 1 (approved first iteration)

### What Was Built

1. Payment abstraction layer
2. Przelewy24 integration
3. Tpay integration
4. Publication controller (credit management)
5. Payment checkout API
6. Payment status API
7. Payment webhooks (both providers)
8. Payment form component
9. Credits display component
10. Publish dialog with payment option
11. Credits page (basic)
12. Translation files (payments.json for 6 locales)

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/lib/payments/index.ts` | Created | Payment abstraction |
| `src/lib/payments/przelewy24.ts` | Created | P24 integration |
| `src/lib/payments/tpay.ts` | Created | Tpay integration |
| `src/lib/publication/publication-controller.ts` | Created | Credits logic |
| `src/app/api/payments/checkout/route.ts` | Created | Checkout API |
| `src/app/api/webhooks/przelewy24/route.ts` | Created | P24 webhook |
| `src/app/api/webhooks/tpay/route.ts` | Created | Tpay webhook |
| `src/components/payments/credits-display.tsx` | Created | Balance display |
| `src/components/shorts/publish-dialog.tsx` | Created | Publish modal |

### Credit Packages

| Credits | Price (PLN) | Discount |
|---------|-------------|----------|
| 1 | 5.00 | - |
| 5 | 22.50 | 10% |
| 20 | 80.00 | 20% |
| 50 | 175.00 | 30% |

### Commits

- `b7b6583` - feat(task-05): add payment providers and credits system - iteration v1
- `5d99a32` - test(task-05): add payment providers and credits system tests - iteration v1
- `efefe2d` - fix(task-05): resolve test failures for payment system - iteration v2
- `00b3222` - fix(task-05): resolve test syntax errors and behavior mismatches - iteration v3

### Tests: 205 passing

---

## Task 06: Shorts Management UI

**Priority:** MEDIUM
**Complexity:** Medium (18 files)
**Iterations:** 2 (rejected iteration 1 for validation issues)

### What Was Built

1. Shorts data table with filters
2. Short card component
3. Short detail page
4. Edit metadata dialog
5. Archive/Delete confirmation dialogs
6. Duplicate functionality
7. Credits history and purchase modal
8. CRUD API routes
9. Server actions for update/delete/archive/duplicate

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/components/shorts/shorts-table.tsx` | Created | DataTable |
| `src/components/shorts/shorts-filters.tsx` | Created | Filters |
| `src/components/shorts/short-card.tsx` | Created | Grid card |
| `src/components/shorts/edit-short-dialog.tsx` | Created | Edit modal |
| `src/app/actions/shorts/update.ts` | Created | Update action |
| `src/app/actions/shorts/delete.ts` | Created | Delete action |
| `src/app/actions/shorts/archive.ts` | Created | Archive action |
| `src/app/actions/shorts/duplicate.ts` | Created | Duplicate action |
| `src/app/api/shorts/route.ts` | Created | List/create API |
| `src/app/api/shorts/[id]/route.ts` | Created | CRUD API |
| `src/components/payments/credits-history.tsx` | Created | History table |
| `src/components/payments/credits-purchase-modal.tsx` | Created | Purchase modal |

### Actions per Status

| Status | Available Actions |
|--------|-------------------|
| DRAFT | View, Edit, Publish, Duplicate, Delete |
| PUBLISHED | View, Edit, Archive, Duplicate |
| ARCHIVED | View, Renew, Duplicate |

### Commits

- `bb760e0` - feat(task-06): add shorts management UI and CRUD actions - iteration v1
- `0a0bcac` - fix(task-06): add shortId validation, i18n keys, URL validation - iteration v2
- `aac09d6` - test(task-06): add shorts management UI and payments tests - iteration v1
- `ea8034c` - fix(task-06): resolve test failures for shorts management tests - iteration v2

### Tests: 627 passing

---

## Task 07: Lifecycle + Public View

**Priority:** MEDIUM
**Complexity:** Medium (16 files)
**Iterations:** 2 (rejected iteration 1 for validation issues)

### What Was Built

1. Auto-archive cron job (30-day expiry)
2. Expiry reminder emails (7 days before)
3. Published notification email
4. Renewal flow for archived shorts
5. Public short view page
6. SEO/OpenGraph optimization
7. Short sharing components
8. Company card for public view
9. Stats tracking (views, CTA clicks)

### Key Files

| File | Type | Description |
|------|------|-------------|
| `src/lib/inngest/functions/archive-expired.ts` | Created | Daily cron |
| `src/lib/inngest/functions/expiry-reminder.ts` | Created | Reminder cron |
| `src/emails/expiry-reminder.tsx` | Created | Email template |
| `src/emails/short-published.tsx` | Created | Email template |
| `src/app/actions/shorts/renew.ts` | Created | Renew action |
| `src/components/shorts/renew-dialog.tsx` | Created | Renew modal |
| `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Created | Public page |
| `src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx` | Created | OG image |
| `src/components/shorts/public-short-view.tsx` | Created | Public layout |
| `src/components/shorts/short-company-card.tsx` | Created | Company info |
| `src/components/shorts/short-cta-button.tsx` | Created | CTA button |
| `src/lib/shorts/stats.ts` | Created | Stats tracking |
| `src/app/api/shorts/[id]/track/route.ts` | Created | Track endpoint |

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `archiveExpiredShorts` | `0 3 * * *` (3 AM daily) | Archive 30-day old shorts |
| `sendExpiryReminders` | `0 9 * * *` (9 AM daily) | Send 7-day warnings |

### Commits

- `3baa784` - feat(task-07): add lifecycle management and public view - iteration v1
- `d936d15` - fix(task-07): add Zod validation, URL validation, and i18n fixes - iteration v2
- `d2cd54b` - test(task-07): add comprehensive tests for lifecycle and public view - iteration v1

### Tests: 261 passing

---

## Testing Summary

| Task | Test Files | Tests | Pass Rate |
|------|------------|-------|-----------|
| task-01 | 4 | 53 | 100% |
| task-02 | 5 | 87 | 100% |
| task-03 | 7 | 179 | 100% |
| task-04 | 8 | 221 | 100% |
| task-05 | 9 | 205 | 100% |
| task-06 | 26 | 627 | 100% |
| task-07 | 11 | 261 | 100% |
| **Total** | **81** | **1633** | **100%** |

---

**Generated:** 2026-01-01
**Generator:** exec-doc-generator (AI Spec Flow)
