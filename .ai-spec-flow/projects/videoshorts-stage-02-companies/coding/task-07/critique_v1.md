# Code Review: Task 07 - Iteration 1/3

**Commit:** 5126fb99b9e78ba758f1abb868824a3efc133453
**Verdict:** ❌ CHANGES REQUIRED

---

## Acceptance Criteria Check

| #   | Criterion                                          | Status  | Evidence                                   |
| --- | -------------------------------------------------- | ------- | ------------------------------------------ |
| 1   | Companies page shows all companies in table        | ✅ PASS | page.tsx fetches and displays companies    |
| 2   | Table columns: name, NIP, email, status, actions   | ✅ PASS | All columns present in CompaniesTable      |
| 3   | Search filters by company name or NIP              | ✅ PASS | OR filter in Prisma query                  |
| 4   | Status filter: all, verified, pending              | ✅ PASS | Filter UI and logic implemented            |
| 5   | Verified/Pending badges show correctly             | ✅ PASS | Badge components with proper conditions    |
| 6   | Verify/Reject buttons only for pending companies   | ✅ PASS | Conditional rendering based on viesVerified|
| 7   | Verify action updates company, audit log, email    | ✅ PASS | Transaction with all 3 operations          |
| 8   | Reject action reverts role, audit log, email       | ✅ PASS | Transaction with all 3 operations          |
| 9   | Loading state during actions                       | ✅ PASS | isLoading state tracked                    |
| 10  | Success/error toasts shown                         | ✅ PASS | Toast notifications present                |
| 11  | npm run build passes                               | ✅ PASS | Build completed successfully               |
| 12  | No TypeScript errors                               | ✅ PASS | Build passed type checking                 |

**Acceptance Criteria Result:** ✅ ALL CRITERIA MET (12/12)

---

## Code Quality Issues

Despite passing acceptance criteria, there are **CRITICAL** code quality violations that must be fixed:

### 1. BLOCKER: Missing Input Validation in Server Actions

**Files Affected:**
- `src/app/actions/admin/companies/verify.ts`
- `src/app/actions/admin/companies/reject.ts`

**Problem:** No validation for `companyId` parameter. Malicious input could cause database errors or security issues.

**Current Code:**
```typescript
export async function verifyCompanyAction(
  companyId: string,  // ❌ No validation
  reason?: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }
  // ... directly uses companyId
```

**Fix Required:**
Add Zod validation at the top of both actions:

```typescript
import { z } from "zod"

const verifySchema = z.object({
  companyId: z.string().cuid(), // or .uuid() depending on your Prisma schema
  reason: z.string().optional()
})

export async function verifyCompanyAction(
  companyId: string,
  reason?: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Validate input
  const parsed = verifySchema.safeParse({ companyId, reason })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    // Use parsed.data.companyId instead of raw companyId
    const company = await prisma.$transaction(async (tx) => {
      const updated = await tx.companyProfile.update({
        where: { id: parsed.data.companyId },
        // ... rest of code
```

Apply same pattern to `reject.ts` with:
```typescript
const rejectSchema = z.object({
  companyId: z.string().cuid(),
  reason: z.string().min(5, "Reason must be at least 5 characters")
})
```

---

### 2. BLOCKER: Email HTML Hardcoded (i18n Violation)

**Files Affected:**
- `src/app/actions/admin/companies/verify.ts:51-55`
- `src/app/actions/admin/companies/reject.ts:59-64`

**Problem:** Email content is hardcoded in English, violating i18n requirements. Per coding practices, **NO hardcoded UI text**.

**Current Code:**
```typescript
await sendEmail({
  to: company.user.email,
  subject: "Company Verified - VideoShorts",  // ❌ Hardcoded English
  html: `
    <h1>Company Verified</h1>
    <p>Your company <strong>${company.companyName}</strong> has been verified.</p>
    <p>You can now access all company features.</p>
  `
})
```

**Fix Required:**

1. Get user's locale from the database:
```typescript
const company = await prisma.$transaction(async (tx) => {
  const updated = await tx.companyProfile.update({
    where: { id: parsed.data.companyId },
    data: {
      viesVerified: true,
      verifiedAt: new Date(),
      verifiedBy: session.user.id
    },
    include: {
      user: {
        select: {
          email: true,
          locale: true  // ✅ Add locale
        }
      }
    }
  })
  // ... rest
```

2. Add email translations to all 5 locale files (`src/lib/locales/*/emails.json`):
```json
{
  "companyVerified": {
    "subject": "Company Verified - VideoShorts",
    "title": "Company Verified",
    "body": "Your company {{companyName}} has been verified.",
    "footer": "You can now access all company features."
  },
  "companyRejected": {
    "subject": "Company Verification Rejected - VideoShorts",
    "title": "Company Verification Rejected",
    "body": "Your company {{companyName}} verification has been rejected.",
    "reason": "Reason: {{reason}}",
    "footer": "Please contact support if you have questions."
  }
}
```

3. Use translation helper in email:
```typescript
import { getText } from "@/lib/i18n/server"

const userLocale = company.user.locale || "en"

await sendEmail({
  to: company.user.email,
  subject: await getText("companyVerified.subject", "emails", userLocale),
  html: `
    <h1>${await getText("companyVerified.title", "emails", userLocale)}</h1>
    <p>${await getText("companyVerified.body", "emails", userLocale).replace("{{companyName}}", company.companyName)}</p>
    <p>${await getText("companyVerified.footer", "emails", userLocale)}</p>
  `
})
```

---

### 3. HIGH: Missing Ownership Check

**File:** `src/app/actions/admin/companies/reject.ts:26-33`

**Problem:** Before updating company, should verify it exists. Current code will throw uncaught error if company doesn't exist.

**Current Code:**
```typescript
const updated = await tx.companyProfile.update({
  where: { id: companyId },  // ❌ Throws if not found
  data: { viesVerified: false, verifiedAt: null },
  include: { user: true }
})
```

**Fix Required:**
Add existence check before update:

```typescript
const company = await prisma.$transaction(async (tx) => {
  // Check company exists first
  const existing = await tx.companyProfile.findUnique({
    where: { id: parsed.data.companyId }
  })

  if (!existing) {
    throw new Error("COMPANY_NOT_FOUND")
  }

  // Now safe to update
  const updated = await tx.companyProfile.update({
    where: { id: parsed.data.companyId },
    data: { viesVerified: false, verifiedAt: null },
    include: { user: true }
  })
  // ... rest
})
```

Then catch this in the outer try/catch:
```typescript
} catch (error) {
  console.error("Reject error:", error)
  if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
    return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
  }
  return createError("admin.errors.rejectFailed", "REJECT_FAILED")
}
```

Apply same pattern to `verify.ts`.

---

### 4. MEDIUM: Missing Translation Key in errors.json

**Problem:** Using `errors.unauthorized` but need to verify it exists in ALL locale files.

**Action Required:**
Verify `src/lib/locales/*/errors.json` contains:
```json
{
  "unauthorized": "Unauthorized access",
  "invalidInput": "Invalid input data"
}
```

For all 5 languages (pl, en, de, es, ru).

---

### 5. MEDIUM: Console.log Should Use Structured Logging

**Files Affected:**
- `verify.ts:63`
- `reject.ts:71`

**Current Code:**
```typescript
console.error("Verify error:", error)
```

**Fix Required:**
Use structured logging:
```typescript
console.error("[ADMIN_VERIFY_COMPANY]", {
  adminId: session.user.id,
  companyId: parsed.data.companyId,
  error: error instanceof Error ? error.message : String(error),
  timestamp: new Date().toISOString()
})
```

---

## Summary

**Critical Issues:** 2 BLOCKERS
- Missing input validation (security risk)
- Hardcoded email text (violates i18n requirement)

**High Priority:** 1
- Missing existence checks (error handling)

**Medium Priority:** 2
- Translation keys verification
- Structured logging

**Total Changes Required:** 5

---

## Next Steps

1. Add Zod validation to both server actions
2. Create `emails.json` translation files for all 5 languages
3. Update email sending to use translations with user's locale
4. Add existence checks before company updates
5. Replace console.error with structured logging
6. Test verification and rejection flows with invalid inputs

**Estimated Fix Time:** 30-45 minutes
