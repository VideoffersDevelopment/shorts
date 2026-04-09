# Code Review: Task-07 - Iteration 1/3

**Commit Reviewed:** 3baa7843d62335949c70bddbf9246205625976ca
**Commit Message:** feat(task-07): add lifecycle management and public view - iteration v1

**Verdict:** CHANGES REQUIRED

## Summary

The implementation covers all major requirements from the task spec: Inngest cron jobs for auto-archiving and expiry reminders, email templates, renew action, public short view page with OG image, and various public view components. The build passes successfully. However, there are several issues that need to be addressed before this can be approved.

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Auto-archive cron runs daily at 3 AM | PASS | `archive-expired.ts` with `cron: "0 3 * * *"` |
| 2 | Expiry reminder cron runs daily at 9 AM | PASS | `expiry-reminder.ts` with `cron: "0 9 * * *"` |
| 3 | Email templates created | PASS | `expiry-reminder.tsx`, `short-published.tsx` |
| 4 | Renew dialog works for archived shorts | PASS | `renew-dialog.tsx` with proper logic |
| 5 | Public page displays short correctly | PASS | `/shorts/[id]/page.tsx` with metadata |
| 6 | OpenGraph image generates correctly | PASS | `/shorts/[id]/opengraph-image.tsx` |
| 7 | Stats tracking implemented | PASS | `stats.ts` and `/api/shorts/[id]/track` |
| 8 | All 6 locales have translations | PASS | All locale files updated |
| 9 | `npm run build` passes | PASS | Build completed successfully |

**Acceptance Criteria Result:** All criteria met, but code quality issues exist.

---

## Issues Found

### ISSUE 1: BLOCKER - Missing Zod Validation in renewShortAction

**File:** `a:\wamp64\www\shorts\src\app\actions\shorts\renew.ts:28-30`

**Problem:** The `shortId` parameter is not validated with Zod schema. Per FIX-04 in coding-practices.md, every Server Action MUST have Zod validation.

**Current Code:**
```typescript
export async function renewShortAction(
  shortId: string
): Promise<ActionResult<RenewShortResult>>
```

**Fix Required:**
```typescript
import { z } from "zod"

const renewShortSchema = z.object({
  shortId: z.string().uuid()
})

export async function renewShortAction(
  shortId: string
): Promise<ActionResult<RenewShortResult>> {
  // 1. VALIDATION
  const parsed = renewShortSchema.safeParse({ shortId })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  // Then use parsed.data.shortId
  // ...
}
```

---

### ISSUE 2: HIGH - CTA Link Not Validated Before URL Construction

**File:** `a:\wamp64\www\shorts\src\components\shorts\short-cta-button.tsx:35`

**Problem:** The `ctaLink` is used directly in `new URL(ctaLink)` without validation. If ctaLink is malformed, this will throw an error. Per FIX-02, all user-generated URLs must be validated before use.

**Current Code:**
```typescript
const handleClick = useCallback(() => {
  // ...
  const url = new URL(ctaLink)  // Will throw if ctaLink is invalid
```

**Fix Required:**
```typescript
import { isValidHttpUrl } from "@/lib/utils/url"

const handleClick = useCallback(() => {
  if (!isValidHttpUrl(ctaLink)) {
    console.error("Invalid CTA link:", ctaLink)
    return
  }

  // Track CTA click (fire-and-forget)
  fetch(`/api/shorts/${shortId}/track`, {
    // ...
  })

  const url = new URL(ctaLink)
  // ...
})
```

---

### ISSUE 3: HIGH - Hardcoded UI Text (i18n Violation)

Multiple components have hardcoded English strings instead of using i18n translations:

**File:** `a:\wamp64\www\shorts\src\components\shorts\short-location-map.tsx:67`
```typescript
Open in Google Maps  // Should use translation
```

**File:** `a:\wamp64\www\shorts\src\components\shorts\short-share-button.tsx`
- Line 53: `"Link copied!"`
- Line 54: `"The link has been copied to your clipboard."`
- Line 60: `"Failed to copy"`
- Line 61: `"Please copy the link manually."`
- Line 116: `{copied ? "Copied!" : "Copy link"}`
- Line 125: `"Open in new tab"`

**File:** `a:\wamp64\www\shorts\src\components\shorts\public-short-view.tsx:73`
```typescript
<p className="text-muted-foreground">Video not available</p>
```

**Fix Required:** Add these keys to the translations and pass them via props or useTranslations hook.

Example for short-location-map.tsx:
```typescript
interface ShortLocationMapProps {
  latitude: number
  longitude: number
  address?: string
  openInMapsLabel: string  // Add prop
}

// In component:
<Button onClick={handleOpenMaps} variant="outline" size="sm" className="w-full">
  <Navigation className="mr-2 h-4 w-4" />
  {openInMapsLabel}
</Button>
```

---

### ISSUE 4: MEDIUM - console.log Statements Should Be Removed or Made Conditional

**Files with console.log:**
- `a:\wamp64\www\shorts\src\lib\inngest\functions\archive-expired.ts:70-73` - Logging in production
- `a:\wamp64\www\shorts\src\lib\inngest\functions\expiry-reminder.ts:95,105` - Logging in production

While logging in Inngest functions may be acceptable for debugging, consider using a proper logging service or environment-based logging.

---

### ISSUE 5: MEDIUM - Missing Error Translation Key in renew-dialog.tsx

**File:** `a:\wamp64\www\shorts\src\components\shorts\renew-dialog.tsx:69`

**Problem:** Using `t("errors.renewFailed")` but this key doesn't exist in the translations. The actual key in shorts.json appears to be just at `errors.renewFailed` level, but the code references `shorts.errors.renewFailed`.

**Verify:** Check if `errors.renewFailed` exists in shorts.json - it does NOT. Need to add it.

**Fix Required:** Add to all locale files under shorts.json:
```json
"errors": {
  // existing keys...
  "renewFailed": "Failed to renew short"
}
```

---

## Code Quality Assessment

### Positive Observations

1. **Inngest Functions:** Properly use `step.run()` for durability as required
2. **Server Action Pattern:** Auth check, ownership verification, and revalidatePath are all present in renewShortAction
3. **Email Templates:** Follow React Email patterns correctly with proper translations for all 6 locales
4. **Stats Tracking:** Uses upsert pattern correctly for tracking views/clicks
5. **API Route:** Proper Zod validation and error handling in track endpoint
6. **SEO Metadata:** generateMetadata properly implemented with OpenGraph and Twitter cards
7. **React Patterns:** Proper use of useCallback with correct dependency arrays

### TypeScript Type Safety
- No `any` types found
- Proper interface definitions for all props
- Correct use of type imports

### Security
- Auth check in renew action is complete
- Ownership verification via companyId check
- Track endpoint validates short status before tracking

---

## Required Changes Summary

| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| BLOCKER | Missing Zod validation | renew.ts | Add Zod schema validation for shortId |
| HIGH | CTA link not validated | short-cta-button.tsx | Add isValidHttpUrl check |
| HIGH | Hardcoded i18n strings | multiple files | Add translations and pass via props |
| MEDIUM | Missing translation key | shorts.json | Add errors.renewFailed |

---

## Verdict

**CHANGES REQUIRED**

The implementation is solid overall but has a BLOCKER issue (missing Zod validation) and HIGH priority i18n issues that must be fixed before approval. Please address the issues above and create a new commit for review iteration 2.
