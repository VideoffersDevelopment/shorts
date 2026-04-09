# Tasks: Shorts Upload + Payments (Stage 03)

**Project:** videoshorts-stage-03-shorts-payments
**Created:** 2025-12-31
**Total Tasks:** 7

---

## Task Overview

| Task | Name | Priority | Dependencies | Complexity | Status |
|------|------|----------|--------------|------------|--------|
| 01 | Database Schema + Infrastructure | HIGH | None | Simple (8 files, ~8k tokens) | pending |
| 02 | R2 Video Module + Upload API | HIGH | Task 01 | Simple (10 files, ~10k tokens) | pending |
| 03 | Upload Wizard UI + Server Action | HIGH | Task 02 | Medium (18 files, ~18k tokens) | pending |
| 04 | Qencode Integration + Inngest Jobs | HIGH | Task 02 | Medium (12 files, ~12k tokens) | pending |
| 05 | Payment Providers + Credits System | HIGH | Task 01 | Medium (18 files, ~18k tokens) | pending |
| 06 | Shorts Management UI | MEDIUM | Task 03, Task 05 | Medium (18 files, ~18k tokens) | pending |
| 07 | Lifecycle + Public View | MEDIUM | Task 04, Task 06 | Medium (16 files, ~16k tokens) | pending |

---

## Dependency Graph

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

## Implementation Order

### Phase 1: Foundation (Tasks 01-02)
1. **Task 01** - Database migration, NPM packages, validation schemas
2. **Task 02** - R2 video module, upload URL API routes

### Phase 2: Core Flows (Tasks 03-05) - Can Run in Parallel
3. **Task 03** - Upload wizard components, create short action
4. **Task 04** - Qencode integration, Inngest background jobs
5. **Task 05** - Payment providers, webhooks, credits system

### Phase 3: UI + Lifecycle (Tasks 06-07)
6. **Task 06** - Shorts list, detail page, management features
7. **Task 07** - Public view, auto-archive, renewal flow

---

## Complexity Summary

| Tier | Tasks | Token Range |
|------|-------|-------------|
| Simple (<=10k) | 01, 02 | 8-10k |
| Medium (<=20k) | 03, 04, 05, 06, 07 | 12-18k |
| Complex (>20k) | None | - |

**Total Estimated Tokens:** ~100k
**All tasks within single-response limits.**

---

## Files Summary by Task

### Task 01: Database + Infrastructure (8 files)
- prisma/schema.prisma (modify)
- src/lib/validation/shorts.ts (create)
- src/lib/validation/payments.ts (create)
- package.json (modify)
- src/lib/inngest/client.ts (create)
- src/lib/inngest/events.ts (create)
- i18n.ts (modify)
- .env.example (modify)

### Task 02: R2 Video Module + Upload API (10 files)
- src/lib/r2-video.ts (create)
- src/app/api/shorts/upload-url/route.ts (create)
- src/app/api/shorts/thumbnail-url/route.ts (create)
- src/app/api/tags/search/route.ts (create)
- 6x translation files: shorts.json (all locales)

### Task 03: Upload Wizard UI (18 files)
- src/components/shorts/video-dropzone.tsx (create)
- src/components/shorts/video-preview.tsx (create)
- src/components/shorts/short-metadata-form.tsx (create)
- src/components/shorts/tags-autocomplete.tsx (create)
- src/components/shorts/thumbnail-selector.tsx (create)
- src/components/shorts/step-indicator.tsx (create)
- src/components/shorts/video-upload-wizard.tsx (create)
- src/app/actions/shorts/create.ts (create)
- src/app/(main)/[locale]/panel/shorts/page.tsx (create)
- src/app/(main)/[locale]/panel/shorts/new/page.tsx (create)
- src/components/layout/app-sidebar.tsx (modify)
- 6x sidebar.json (all locales - modify)

### Task 04: Qencode + Inngest Jobs (12 files)
- src/lib/qencode.ts (create)
- src/lib/inngest/functions/process-video.ts (create)
- src/lib/inngest/functions/cleanup-video.ts (create)
- src/app/api/inngest/route.ts (create)
- src/app/api/webhooks/qencode/route.ts (create)
- src/app/api/shorts/[id]/status/route.ts (create)
- src/components/shorts/processing-status-timeline.tsx (create)
- src/components/shorts/short-player.tsx (create)
- src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx (create)
- src/app/actions/shorts/publish.ts (create)
- src/lib/email/templates/processing-complete.tsx (create)
- src/lib/email/index.ts (modify)

### Task 05: Payments + Credits (18 files)
- src/lib/payments/index.ts (create)
- src/lib/payments/przelewy24.ts (create)
- src/lib/payments/tpay.ts (create)
- src/lib/publication/publication-controller.ts (create)
- src/app/api/payments/checkout/route.ts (create)
- src/app/api/payments/status/[id]/route.ts (create)
- src/app/api/webhooks/przelewy24/route.ts (create)
- src/app/api/webhooks/tpay/route.ts (create)
- src/components/payments/payment-form.tsx (create)
- src/components/payments/credits-display.tsx (create)
- src/components/shorts/publish-dialog.tsx (create)
- src/app/(main)/[locale]/panel/credits/page.tsx (create)
- 6x payments.json (all locales - create)

### Task 06: Management UI (18 files)
- src/components/shorts/shorts-table.tsx (create)
- src/components/shorts/shorts-filters.tsx (create)
- src/components/shorts/short-card.tsx (create)
- src/components/shorts/edit-short-dialog.tsx (create)
- src/components/shorts/archive-dialog.tsx (create)
- src/components/shorts/delete-dialog.tsx (create)
- src/components/payments/credits-history.tsx (create)
- src/components/payments/credits-purchase-modal.tsx (create)
- src/app/actions/shorts/update.ts (create)
- src/app/actions/shorts/delete.ts (create)
- src/app/actions/shorts/archive.ts (create)
- src/app/actions/shorts/duplicate.ts (create)
- src/app/api/shorts/route.ts (create)
- src/app/api/shorts/[id]/route.ts (create)
- src/app/api/credits/route.ts (create)
- src/app/(main)/[locale]/panel/shorts/[id]/page.tsx (create)
- src/app/(main)/[locale]/panel/credits/page.tsx (modify)

### Task 07: Lifecycle + Public View (16 files)
- src/lib/inngest/functions/archive-expired.ts (create)
- src/lib/inngest/functions/expiry-reminder.ts (create)
- src/lib/email/templates/expiry-reminder.tsx (create)
- src/lib/email/templates/short-published.tsx (create)
- src/lib/shorts/stats.ts (create)
- src/app/api/shorts/[id]/track/route.ts (create)
- src/app/api/inngest/route.ts (modify)
- src/lib/email/index.ts (modify)
- src/app/actions/shorts/renew.ts (create)
- src/components/shorts/renew-dialog.tsx (create)
- src/app/(main)/[locale]/shorts/[id]/page.tsx (create)
- src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx (create)
- src/components/shorts/public-short-view.tsx (create)
- src/components/shorts/short-company-card.tsx (create)
- src/components/shorts/short-cta-button.tsx (create)
- src/components/shorts/short-location-map.tsx (create)
- src/components/shorts/short-share-button.tsx (create)

---

## Notes

1. **Translation files** are distributed across tasks where they are first needed (Task 02 for shorts.json, Task 05 for payments.json)

2. **Sidebar updates** are in Task 03 when the first panel pages are created

3. **Inngest route** is created in Task 04 and extended in Task 07 with additional functions

4. **Credits page** is created in Task 05 (basic) and enhanced in Task 06 (with history/purchase)

5. All tasks include **Visual Verification Steps** for UI testing via Chrome DevTools MCP
