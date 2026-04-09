# Code Review: Task-04 - Iteration 1/3

**Commit Reviewed:** 77bc3fa154c59c4a67bbfa69ea3a99a0a8775ebf
**Commit Message:** feat(task-04): add Qencode integration and Inngest jobs - iteration v1

---

## Verdict: CHANGES REQUIRED

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Qencode client can start transcoding jobs | PASS | `src/lib/qencode.ts` - `startQencodeJob()` implemented with HLS profile |
| 2 | Webhook verifies signatures correctly | PASS | `verifyQencodeSignature()` uses HMAC-SHA256 with timing-safe comparison |
| 3 | Inngest functions registered | PASS | `src/lib/inngest/functions/index.ts` exports array, route.ts serves them |
| 4 | Status endpoint returns correct short status | PASS | `src/app/api/shorts/[id]/status/route.ts` with auth + ownership check |
| 5 | Timeline component shows correct steps | PASS | `processing-status-timeline.tsx` implements all 4 steps |
| 6 | ShortPlayer plays HLS streams | PASS | `short-player.tsx` uses @vidstack/react |
| 7 | Publishing page polls and shows progress | PASS | 5-second polling interval with useEffect |
| 8 | Auto-redirect works when published | PASS | `setTimeout(() => router.push(...), 2000)` |
| 9 | publishShortAction deducts credits correctly | PASS | Prisma transaction with user update + credit transaction |
| 10 | Processing complete email sends | PASS | `sendProcessingCompleteEmail()` called in webhook handler |
| 11 | npm run build passes | PASS | Build successful with only warnings |

**Acceptance Criteria Result:** PASS (11/11 criteria met)

---

## File Completeness

| File | Status | Notes |
|------|--------|-------|
| `src/lib/qencode.ts` | CREATED | Qencode API client with HLS profile |
| `src/lib/inngest/functions/process-video.ts` | CREATED | Start transcoding function |
| `src/lib/inngest/functions/cleanup-video.ts` | CREATED | Cleanup raw video function |
| `src/lib/inngest/functions/index.ts` | CREATED | Function exports and array |
| `src/app/api/inngest/route.ts` | CREATED | Inngest API route handler |
| `src/app/api/webhooks/qencode/route.ts` | CREATED | Webhook handler with signature verification |
| `src/app/api/shorts/[id]/status/route.ts` | CREATED | Status endpoint with auth |
| `src/components/shorts/processing-status-timeline.tsx` | CREATED | Timeline component |
| `src/components/shorts/short-player.tsx` | CREATED | HLS video player |
| `src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx` | CREATED | Publishing status page |
| `src/app/actions/shorts/publish.ts` | CREATED | Publish server action |
| `src/lib/email/templates/processing-complete.tsx` | CREATED | Email template |
| `src/lib/email/index.ts` | CREATED | Email sending utility (new file, not modified) |
| `src/lib/locales/en/shorts.json` | MODIFIED | Added timeline, player, publishing keys |
| `src/lib/locales/pl/shorts.json` | MODIFIED | Added timeline, player, publishing keys |

---

## Issues Found

### BLOCKER 1: i18n - Missing translations in 4 locales

**Severity:** BLOCKER (per coding-practices.md - Zasada #3: ZAWSZE Dodaj Wszystkie 5 Jezyki)

**Problem:** The new translation keys were only added to EN and PL locales. The following keys are MISSING from DE, ES, RU, UK:

```
timeline.draft
timeline.payment
timeline.processing
timeline.published
timeline.estimatedTime
navigation.backToShorts
player.play
player.pause
player.mute
player.unmute
player.fullscreen
player.exitFullscreen
publishing.loading
publishing.processing.title
publishing.processing.description
publishing.processing.doNotClose
```

**Fix:** Add all missing keys to:
- `src/lib/locales/de/shorts.json`
- `src/lib/locales/es/shorts.json`
- `src/lib/locales/ru/shorts.json`
- `src/lib/locales/uk/shorts.json`

**Files affected:**
- `a:\wamp64\www\shorts\src\lib\locales\de\shorts.json`
- `a:\wamp64\www\shorts\src\lib\locales\es\shorts.json`
- `a:\wamp64\www\shorts\src\lib\locales\ru\shorts.json`
- `a:\wamp64\www\shorts\src\lib\locales\uk\shorts.json`

---

## Code Quality Assessment

### Type Safety: PASS
- No `any` types found
- All interfaces properly defined (`QencodeJobOptions`, `QencodeJobResult`, `ShortStatusResponse`, etc.)
- Function return types explicit

### Security: PASS
- Webhook signature verification with timing-safe comparison (line 214-224 in qencode.ts)
- Auth check in server action (`session?.user?.id`)
- Ownership verification via company profile in status endpoint
- Role check (`session.user.role !== "COMPANY"`)

### React Patterns: PASS
- `"use client"` directive where needed
- `useCallback` for `handlePlay`, `handleEnded` in short-player.tsx
- `useCallback` for `fetchStatus` in publishing/page.tsx
- Hook dependencies complete

### Server Actions Pattern: PASS
- Auth check first
- Authorization (company ownership)
- Status check before operation
- Verification check (viesVerified)
- Credit check with transaction
- revalidatePath called

### Business Logic: PASS
- HLS profile correct (1080p/4500kbps, 720p/2500kbps, 480p/1000kbps)
- Inngest events match spec (`shorts/transcode.started`, `shorts/transcode.completed`)
- Credit deduction with transaction
- Email sending after transcode complete
- 30-day expiry calculation

---

## Summary

The implementation is well-structured and follows coding practices correctly. The only issue is the missing i18n translations for 4 out of 6 supported locales. This must be fixed before approval.

**Action Required:**
1. Add the missing translation keys to DE, ES, RU, UK locales
2. Commit the changes
3. Submit for re-review
