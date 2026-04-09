# Stage 03: Shorts Upload + Payments

**Project:** videoshorts-stage-03-shorts-payments
**Period:** 2025-12-31 to 2026-01-01
**Status:** Completed
**Priority:** P0 (Critical - MVP Core)

---

## Overview

Stage 03 implements the core business logic of VideoShorts: video upload with serverless processing pipeline (Cloudflare R2 + Qencode), multi-provider payment system (Przelewy24, Tpay), publication credits, and the complete short lifecycle management. This is the most critical stage for MVP as it enables platform monetization.

### Key Deliverables

- Video upload wizard with drag & drop and R2 direct upload
- Qencode video transcoding to HLS (adaptive bitrate streaming)
- Multi-provider payment gateway (Przelewy24 + Tpay)
- Publication credits system with transaction history
- Complete CRUD for shorts (create, update, archive, delete, duplicate)
- Public short viewing with HLS player (@vidstack/react)
- 30-day lifecycle with auto-archive and renewal
- Email notifications (processing complete, expiry reminders)
- Background jobs with Inngest (transcoding, cleanup, archive, reminders)

---

## Architecture Summary

### Video Pipeline

```
User Upload                 Processing               Delivery
    |                           |                       |
    v                           v                       v
+--------+    +----------+    +--------+    +--------+
| Browser|--->| R2 Raw   |--->| Qencode|--->| R2 HLS |---> HLS Player
| Upload |    | Bucket   |    | API    |    | Bucket |    (@vidstack)
+--------+    +----------+    +--------+    +--------+
    |              |              |             |
    |              |              v             v
    |              |         [Webhook]     [Public URL]
    |              |              |
    v              v              v
         +------------------+
         | Inngest Jobs     |
         | - process-video  |
         | - cleanup-video  |
         +------------------+
```

### Payment Flow

```
User                    Server                    Provider
  |                        |                         |
  |---Publish Short------->|                         |
  |                        |--Check Credits--------->|
  |                        |                         |
  |  [If Credits > 0]      |                         |
  |<---Start Processing----|                         |
  |                        |                         |
  |  [If Credits = 0]      |                         |
  |                        |--Create Checkout------->|
  |<---Redirect to Pay-----|                    (P24/Tpay)
  |                        |                         |
  |----Complete Payment--->|                         |
  |                        |<---Webhook--------------|
  |                        |--Add Credits----------->|
  |                        |--Start Processing------>|
  |<---Redirect to Status--|                         |
```

---

## Tasks Summary

| Task | Name | Status | Files | Tests | Iterations |
|------|------|--------|-------|-------|------------|
| task-01 | Database Schema + Infrastructure | Completed | 8 | 53 | 1 |
| task-02 | R2 Video Module + Upload API | Completed | 10 | 87 | 2 |
| task-03 | Upload Wizard UI + Server Action | Completed | 18 | 179 | 2 |
| task-04 | Qencode Integration + Inngest Jobs | Completed | 15 | 221 | 2 |
| task-05 | Payment Providers + Credits System | Completed | 18 | 205 | 1 |
| task-06 | Shorts Management UI | Completed | 18 | 627 | 2 |
| task-07 | Lifecycle + Public View | Completed | 16 | 261 | 2 |

**Total:** 7 tasks, 103 files, 1633 tests (in this stage), ~3009 cumulative

---

## Database Changes

### New Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Short` | Video short entity | title, status, hlsPlaylistUrl, rawVideoKey, qencodeTaskId |
| `ShortStats` | View/engagement tracking | views, likes, ctaClicks, uniqueViews |
| `Tag` | Reusable content tags | name, slug, usageCount |
| `ShortTag` | Many-to-many junction | shortId, tagId |
| `Payment` | Payment transactions | provider, status, amount, creditsGranted |
| `CreditTransaction` | Credit audit trail | amount, source, shortId, paymentId |

### Schema Migration

```prisma
// Field renames using @map (non-destructive)
model Short {
  qencodeTaskId   String?  @unique @map("muxAssetId")
  hlsPlaylistUrl  String?  @unique @map("muxPlaybackId")
  rawVideoKey     String?  @map("muxUploadId")
}

// User model addition
model User {
  publicationCredits Int @default(0)
}
```

### Enums Added

- `ShortStatus`: DRAFT, PENDING_PAYMENT, PROCESSING, PUBLISHED, ARCHIVED, DELETED
- `PaymentProvider`: PRZELEWY24, TPAY, OTHER
- `PaymentStatus`: PENDING, SUCCEEDED, FAILED, REFUNDED
- `CreditSource`: PACKAGE, GIFT, PROMO, REFUND, ADMIN, PUBLICATION, OTHER

---

## New Pages

| Route | Purpose | Type |
|-------|---------|------|
| `/panel/shorts` | Shorts dashboard list | Protected (COMPANY) |
| `/panel/shorts/new` | Upload wizard | Protected (COMPANY) |
| `/panel/shorts/[id]` | Short detail/edit | Protected (COMPANY) |
| `/panel/shorts/[id]/publishing` | Processing status | Protected (COMPANY) |
| `/panel/credits` | Credits management | Protected (COMPANY) |
| `/shorts/[id]` | Public short view | Public |

---

## Server Actions Created

| Action | File | Purpose |
|--------|------|---------|
| `createShortAction` | `src/app/actions/shorts/create.ts` | Create draft short with video |
| `updateShortMetadataAction` | `src/app/actions/shorts/update.ts` | Update title, description, tags, CTA |
| `publishShortAction` | `src/app/actions/shorts/publish.ts` | Initiate publication (credits or payment) |
| `archiveShortAction` | `src/app/actions/shorts/archive.ts` | Archive published short |
| `deleteShortAction` | `src/app/actions/shorts/delete.ts` | Delete draft short |
| `duplicateShortAction` | `src/app/actions/shorts/duplicate.ts` | Duplicate short as new draft |
| `renewShortAction` | `src/app/actions/shorts/renew.ts` | Renew archived short for 30 days |

---

## API Routes Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shorts/upload-url` | POST | Generate R2 presigned PUT URL |
| `/api/shorts/thumbnail-url` | POST | Generate thumbnail upload URL |
| `/api/shorts` | GET/POST | List/create shorts |
| `/api/shorts/[id]` | GET/PATCH/DELETE | CRUD single short |
| `/api/shorts/[id]/status` | GET | Get processing status |
| `/api/shorts/[id]/track` | POST | Track views/CTA clicks |
| `/api/tags/search` | GET | Tag autocomplete search |
| `/api/payments/checkout` | POST | Create payment session |
| `/api/payments/status/[id]` | GET | Check payment status |
| `/api/credits` | GET | Get credits balance/history |
| `/api/webhooks/qencode` | POST | Qencode transcoding callback |
| `/api/webhooks/przelewy24` | POST | Przelewy24 payment webhook |
| `/api/webhooks/tpay` | POST | Tpay payment webhook |

---

## Components Created (23)

### Shorts Components (19)

| Component | File | Purpose |
|-----------|------|---------|
| `VideoDropzone` | `video-dropzone.tsx` | Drag & drop video upload |
| `VideoPreview` | `video-preview.tsx` | Preview uploaded video |
| `ShortMetadataForm` | `short-metadata-form.tsx` | Title, description, tags form |
| `TagsAutocomplete` | `tags-autocomplete.tsx` | Tag input with search |
| `ThumbnailSelector` | `thumbnail-selector.tsx` | Auto/custom thumbnail picker |
| `StepIndicator` | `step-indicator.tsx` | Wizard step progress |
| `VideoUploadWizard` | `video-upload-wizard.tsx` | Multi-step upload wizard |
| `ShortPlayer` | `short-player.tsx` | HLS video player |
| `ProcessingStatusTimeline` | `processing-status-timeline.tsx` | Processing status display |
| `PublishDialog` | `publish-dialog.tsx` | Publish confirmation |
| `ShortsTable` | `shorts-table.tsx` | DataTable for shorts |
| `ShortsFilters` | `shorts-filters.tsx` | Status/search filters |
| `ShortCard` | `short-card.tsx` | Grid view card |
| `EditShortDialog` | `edit-short-dialog.tsx` | Edit metadata modal |
| `ArchiveDialog` | `archive-dialog.tsx` | Archive confirmation |
| `DeleteDialog` | `delete-dialog.tsx` | Delete confirmation |
| `RenewDialog` | `renew-dialog.tsx` | Renewal confirmation |
| `PublicShortView` | `public-short-view.tsx` | Public page layout |
| `ShortCompanyCard` | `short-company-card.tsx` | Company info on public page |
| `ShortCtaButton` | `short-cta-button.tsx` | CTA with click tracking |
| `ShortLocationMap` | `short-location-map.tsx` | Location display |
| `ShortShareButton` | `short-share-button.tsx` | Share functionality |
| `ShortsManagement` | `shorts-management.tsx` | Management wrapper |

### Payment Components (5)

| Component | File | Purpose |
|-----------|------|---------|
| `PaymentForm` | `payment-form.tsx` | Provider selection form |
| `CreditsDisplay` | `credits-display.tsx` | Credits balance badge |
| `CreditsHistory` | `credits-history.tsx` | Transaction history |
| `CreditsPurchaseModal` | `credits-purchase-modal.tsx` | Credit package purchase |
| `CreditsManagement` | `credits-management.tsx` | Credits page wrapper |

---

## External Service Integrations

| Service | Purpose | Integration Type |
|---------|---------|------------------|
| Cloudflare R2 | Video storage (raw + HLS) | Presigned URLs, S3 API |
| Qencode | Video transcoding | REST API + Webhook |
| Przelewy24 | Payment provider (primary) | REST API + Webhook |
| Tpay | Payment provider (fallback) | REST API + Webhook |
| Inngest | Background jobs | Event-driven functions |
| Resend | Email notifications | React Email templates |
| @vidstack/react | HLS video player | React component |

---

## Inngest Background Jobs

| Function | Trigger | Purpose |
|----------|---------|---------|
| `startTranscoding` | `shorts/transcode.started` | Start Qencode job |
| `cleanupRawVideo` | `shorts/transcode.completed` | Delete raw video from R2 |
| `archiveExpiredShorts` | Cron: `0 3 * * *` | Auto-archive after 30 days |
| `sendExpiryReminders` | Cron: `0 9 * * *` | 7-day expiry email |

---

## Translation Files

Created `shorts.json` and `payments.json` for all 6 locales:
- English (en)
- Polish (pl)
- German (de)
- Spanish (es)
- Russian (ru)
- Ukrainian (uk)

---

## Key Architecture Decisions

### AD-1: Serverless Video Pipeline (R2 + Qencode)

**Context:** Need scalable video processing without server load
**Decision:** Use Cloudflare R2 for storage + Qencode for transcoding
**Rationale:**
- Direct browser-to-R2 upload (presigned URLs)
- Pay-per-use transcoding with Qencode
- HLS adaptive streaming (1080p/720p/480p)
- No server-side video handling

### AD-2: Multi-Provider Payment Gateway

**Context:** Polish market requires local payment methods
**Decision:** Implement Przelewy24 (primary) + Tpay (fallback)
**Rationale:**
- BLIK, bank transfers, cards coverage
- Provider abstraction layer for easy switching
- Webhook-based confirmation (reliable)

### AD-3: Credit-Based Publication

**Context:** Need flexible payment model
**Decision:** Publication credits with transaction audit trail
**Rationale:**
- Prepaid credits model (1 credit = 1 publication)
- Bulk purchase discounts (5, 20, 50 packs)
- Full transaction history for compliance
- Supports future features (gifts, promos)

### AD-4: 30-Day Lifecycle with Auto-Archive

**Context:** Need content freshness and renewal revenue
**Decision:** Auto-archive after 30 days with renewal option
**Rationale:**
- Fresh content in feed
- Recurring revenue opportunity
- Archived shorts still accessible via direct link

---

## Challenges & Solutions

### Challenge 1: Qencode Webhook Reliability

**Problem:** Need guaranteed delivery of transcoding results
**Solution:**
- Inngest retry mechanism
- Max 3 retries for failed transcodes
- Automatic credit refund on failure
- Email notification on error

### Challenge 2: Multi-Provider Payment Abstraction

**Problem:** Different APIs for Przelewy24 and Tpay
**Solution:**
- Common `PaymentProvider` interface
- Provider-specific signature verification
- Unified checkout session flow

### Challenge 3: Real-Time Processing Status

**Problem:** User needs to know transcoding progress
**Solution:**
- Polling-based status page (5s interval)
- ProcessingStatusTimeline component
- Auto-redirect on completion

### Challenge 4: Large Video Upload Progress

**Problem:** 100MB uploads need progress feedback
**Solution:**
- XMLHttpRequest with progress events
- Client-side validation before upload
- Aspect ratio warning (non-9:16)

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Tasks | 7 |
| Total Files Created | 103 |
| Total Tests | 1633 |
| Test Pass Rate | 100% |
| Test Files | 81 |
| Cumulative Tests | 3009 |
| Iterations | 14 (including fixes) |
| Database Models Added | 6 |
| Server Actions | 7 |
| API Routes | 13 |
| Components | 24 |
| Translation Keys | ~400 |

---

## Commit History

### Task 01: Database Schema + Infrastructure
- `e67407d` - feat(task-01): add shorts and payments database schema
- `f5c901e` - test(task-01): add validation and inngest tests

### Task 02: R2 Video Module + Upload API
- `55e36e3` - feat(task-02): add R2 video module and upload APIs
- `8473fed` - fix(task-02): add auth check and thumbnail validation
- `99c3fa8` - test(task-02): add R2 video and API route tests

### Task 03: Upload Wizard UI + Server Action
- `3c2ea42` - feat(task-03): add upload wizard UI and create short action
- `6884c17` - fix(task-03): add aspect ratio warning and fix i18n
- `93ec932` - test(task-03): add upload wizard and server action tests
- `888dfd0` - test(task-03): fix test failures

### Task 04: Qencode Integration + Inngest Jobs
- `77bc3fa` - feat(task-04): add Qencode integration and Inngest jobs
- `879e8ec` - fix(task-04): add i18n translations for DE/ES/RU/UK
- `20c1f4e` - test(task-04): add comprehensive Qencode tests
- `b22a4e6` - fix(task-04): resolve test failures

### Task 05: Payment Providers + Credits System
- `b7b6583` - feat(task-05): add payment providers and credits system
- `5d99a32` - test(task-05): add payment system tests
- `efefe2d` - fix(task-05): resolve test failures
- `00b3222` - fix(task-05): resolve syntax errors

### Task 06: Shorts Management UI
- `bb760e0` - feat(task-06): add shorts management UI and CRUD actions
- `0a0bcac` - fix(task-06): add shortId validation, i18n, URL validation
- `aac09d6` - test(task-06): add shorts management tests
- `ea8034c` - fix(task-06): resolve test failures

### Task 07: Lifecycle + Public View
- `3baa784` - feat(task-07): add lifecycle management and public view
- `d936d15` - fix(task-07): add Zod validation, URL validation, i18n fixes
- `d2cd54b` - test(task-07): comprehensive test suite

---

## References

- [Stage Specification](../../../.ai-project-planner/projects/videoshorts/stages/stage-03-shorts-payments/spec.md)
- [Architecture Document](../../../.ai-spec-flow/projects/videoshorts-stage-03-shorts-payments/architecture/final_architecture.md)
- [Task Specifications](../../../.ai-spec-flow/projects/videoshorts-stage-03-shorts-payments/tasks/)

---

**Generated:** 2026-01-01
**Generator:** exec-doc-generator (AI Spec Flow)
