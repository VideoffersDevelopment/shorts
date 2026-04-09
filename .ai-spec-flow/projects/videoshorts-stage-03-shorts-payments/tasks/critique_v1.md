# Task Planner Critique v1

**Project:** videoshorts-stage-03-shorts-payments
**Date:** 2025-12-31
**Iteration:** 1/3

---

## Verdict: REJECT

The task breakdown requires revisions to address the issues listed below.

---

## Issues Found

### 1. Task 02 - Missing Translation File Count in Files to Create Table

**Severity:** LOW (Documentation inconsistency)

The index.md mentions "6x translation files" but the task spec lists them individually which is correct. However, the spec says 9 files total, but actually lists:
- 4 core files (r2-video.ts, 3 API routes)
- 6 translation files = 10 files total

**Action Required:** Update file count in Task 02 overview from 9 to 10 files, or clarify the count.

---

### 2. Task 05 - Exceeds File Count

**Severity:** MEDIUM

**Current:** 16 files listed in overview, but actual count:
- 12 create files (core)
- 6 translation files (payments.json)
= 18 files total

**Limit:** 20 files (within limit but incorrect documentation)

**Action Required:** Correct the file count to 18 in Task 05 overview.

---

### 3. Missing API Route: GET /api/payments/status/[id]

**Severity:** MEDIUM

Task 05 lists `src/app/api/payments/status/[id]/route.ts` in files to create, but there is no implementation detail provided in the "Implementation Details" section.

**Action Required:** Add implementation details for the payment status endpoint:
```typescript
// GET /api/payments/status/[id]
// Returns: { status: PaymentStatus, credits?: number, error?: string }
// Auth: payment owner only
```

---

### 4. Task 06 - File Count Inconsistency

**Severity:** LOW

Overview says 19 files, but actual count:
- 16 create files
- 2 modify files (shorts/page.tsx, credits/page.tsx)
= 18 files total

**Action Required:** Verify and correct file count in Task 06 overview.

---

### 5. Missing Architecture Coverage: Short Stats Tracking API

**Severity:** MEDIUM

Architecture mentions "Track view (increment stats)" in public view, but there's no dedicated API endpoint or server action for stats tracking documented in any task.

**Current:** Task 07 mentions tracking in page description but no explicit implementation.

**Action Required:** Add explicit stats tracking implementation to Task 07:
- Either inline in the page server component
- Or add `POST /api/shorts/[id]/stats` endpoint for client-side tracking

---

### 6. Task 04 - Missing Email Integration

**Severity:** LOW

Task 04 creates `processing-complete.tsx` email template and mentions modifying `src/lib/email/index.ts`, but doesn't specify when/where this email is actually sent.

**Action Required:** Clarify in the Qencode webhook handler implementation that the processing complete email should be triggered on successful transcoding:
```typescript
// In webhook handler on success:
// - Send "shorts/transcode.completed" event
// - Send processing complete email to company owner
```

---

### 7. Missing Server Action: duplicateShortAction Dependency

**Severity:** LOW

Task 06 specifies `duplicateShortAction` but the implementation detail says "Copy raw video key (if exists) - no file copy needed". This is correct, but should clarify that `rawVideoKey` copy only makes sense for DRAFT shorts that haven't been transcoded yet.

**Action Required:** Add clarification note that duplicate only copies `rawVideoKey` for DRAFT shorts, not HLS URLs.

---

### 8. Task 03 - Sidebar Translation Missing Keys Specification

**Severity:** LOW

Task 03 mentions modifying 6 sidebar.json files but doesn't specify the exact translation keys to add.

**Action Required:** Add specific keys to be added:
```json
{
  "company": {
    "shorts": "My Shorts",
    "credits": "Credits"
  }
}
```
(with translations for each locale)

---

### 9. Missing Verification: Company Verification Status Check

**Severity:** MEDIUM

Task 04's `publishShortAction` mentions "VERIFICATION CHECK (company must be viesVerified)" but this is not documented in Task 05's `PublishDialog` component. Users should see appropriate error message if company is not verified.

**Action Required:** Add to PublishDialog implementation:
- Check company.viesVerified status
- Show appropriate error message if not verified
- Link to verification page

---

### 10. Translation Coverage - Namespace Import Missing

**Severity:** LOW

Task 01 mentions updating `i18n.ts` to add shorts and payments namespaces, but no specific code example is provided.

**Action Required:** Add specific implementation:
```typescript
// i18n.ts - add to imports and messages
const namespaces = ['common', 'sidebar', 'shorts', 'payments', ...]
```

---

## Checklist Results

### 1. Vertical Slicing
- [x] Tasks organized by feature/flow - PASS
- [x] Each task delivers end-to-end value - PASS
- [x] No task is just "backend" or just "frontend" - PASS (Task 01 is infrastructure which is acceptable)

### 2. Self-Contained Tasks
- [x] Each task can be coded+tested independently - PASS
- [x] Each task has clear input/output - PASS
- [x] No hidden dependencies between tasks - PASS

### 3. Dependencies
- [x] Dependencies are logical and explicit - PASS
- [x] No circular dependencies - PASS
- [x] Correct execution order - PASS

### 4. Size Limits
| Task | Files (Reported) | Files (Actual) | Est. Tokens | Status |
|------|------------------|----------------|-------------|--------|
| 01 | 8 | 8 | ~8k | PASS |
| 02 | 9 | 10 | ~9k | PASS (minor fix) |
| 03 | 18 | 18 | ~18k | PASS |
| 04 | 12 | 12 | ~12k | PASS |
| 05 | 16 | 18 | ~16k | PASS (minor fix) |
| 06 | 19 | 18 | ~19k | PASS (minor fix) |
| 07 | 14 | 14 | ~14k | PASS |

All tasks within limits.

### 5. Acceptance Criteria
- [x] Specific and testable - PASS
- [x] Include `npm run build` check - PASS (all tasks)
- [x] Include visual verification for UI tasks - PASS

### 6. Coverage Check

**Database:**
- [x] Migration (Mux -> Qencode fields) - Task 01

**Frontend:**
- [x] Navigation updates (app-sidebar.tsx) - Task 03
- [x] All 6 pages covered - PASS
  - /panel/shorts - Task 03
  - /panel/shorts/new - Task 03
  - /panel/shorts/[id] - Task 06
  - /panel/shorts/[id]/publishing - Task 04
  - /panel/credits - Task 05, enhanced Task 06
  - /shorts/[id] - Task 07
- [x] All components covered - PASS
- [x] Translation files (12 total: 6x shorts, 6x payments) - Task 02, Task 05

**Backend:**
- [x] All 6 Server Actions covered - PASS
  - createShortAction - Task 03
  - updateShortMetadataAction - Task 06
  - publishShortAction - Task 04
  - archiveShortAction - Task 06
  - deleteShortAction - Task 06
  - renewShortAction - Task 07
  - duplicateShortAction - Task 06
- [x] All API Routes covered - PASS (8+ routes)
- [x] All 4 Inngest Jobs covered - PASS
  - start-transcoding - Task 04
  - cleanup-raw-video - Task 04
  - archive-expired-shorts - Task 07
  - send-expiry-reminders - Task 07

**External Services:**
- [x] R2 video module - Task 02
- [x] Qencode integration - Task 04
- [x] Przelewy24 integration - Task 05
- [x] Tpay integration - Task 05

### 7. Visual Verification Steps
- [x] UI tasks have step-by-step verification - PASS
- [x] Screenshots checkpoints defined - PASS
- [x] Login credentials referenced - PASS (Task 03)

---

## Summary of Required Changes

### Must Fix (Before approval):
1. **Task 02:** Correct file count (9 -> 10)
2. **Task 05:**
   - Correct file count (16 -> 18)
   - Add implementation details for GET /api/payments/status/[id]
3. **Task 06:** Correct file count (19 -> 18)
4. **Task 04:** Clarify when processing-complete email is sent

### Should Fix (Recommended):
5. Task 03: Add specific sidebar.json translation keys
6. Task 04: Add company verification status check to PublishDialog description
7. Task 06: Clarify duplicateShortAction rawVideoKey behavior for different statuses
8. Task 01: Add specific i18n.ts namespace import code
9. Task 07: Add explicit stats tracking implementation

---

## Next Steps

1. Fix the 4 "Must Fix" issues in task specs
2. Address "Should Fix" recommendations
3. Re-run critique for v2 approval
