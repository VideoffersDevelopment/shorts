# Code Review: Task 07 - Iteration 2/3

**Commit:** 41de91c5ffb4dff8154ac9b5d98505631ade4b5c
**Verdict:** ❌ CHANGES REQUIRED (1 REMAINING ISSUE)

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

## Code Quality Issues - FIXED ✅

### ✅ FIXED: Issue #1 - Input Validation
**Status:** RESOLVED

Both `verify.ts` and `reject.ts` now have proper Zod validation:
- `verifySchema` with `z.string().cuid()` for companyId
- `rejectSchema` with `z.string().cuid()` and `z.string().min(5)` for reason
- Proper error handling with `errors.invalidInput` translation key

### ✅ FIXED: Issue #2 - Company Existence Check
**Status:** RESOLVED

Both actions now check for company existence before update:
```typescript
const existing = await tx.companyProfile.findUnique({
  where: { id: parsed.data.companyId }
})

if (!existing) {
  throw new Error("COMPANY_NOT_FOUND")
}
```

### ✅ FIXED: Issue #3 - Translation Keys
**Status:** RESOLVED

All required translation keys added to ALL 5 locales (pl, en, de, es, ru):
- `common.json`: `errors.unauthorized`, `errors.invalidInput`
- `admin.json`: `errors.companyNotFound`

### ✅ FIXED: Issue #4 - Structured Logging
**Status:** RESOLVED

Console errors now use structured logging:
```typescript
console.error("[ADMIN_VERIFY_COMPANY]", {
  adminId: session.user.id,
  companyId: parsed.data.companyId,
  error: error instanceof Error ? error.message : String(error),
  timestamp: new Date().toISOString()
})
```

---

## Code Quality Issues - REMAINING ❌

### 1. HIGH: Email HTML Still Hardcoded (i18n Violation)

**Files Affected:**
- `src/app/actions/admin/companies/verify.ts:69-77`
- `src/app/actions/admin/companies/reject.ts:73-82`

**Problem:** Email content remains hardcoded in English, violating i18n requirement. Per coding practices Section 🌍, **NO hardcoded UI text**.

**Current Code (verify.ts:69-77):**
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

**Current Code (reject.ts:73-82):**
```typescript
await sendEmail({
  to: company.user.email,
  subject: "Company Verification Rejected - VideoShorts",  // ❌ Hardcoded English
  html: `
    <h1>Company Verification Rejected</h1>
    <p>Your company <strong>${company.companyName}</strong> verification has been rejected.</p>
    <p><strong>Reason:</strong> ${parsed.data.reason}</p>
    <p>Please contact support if you have questions.</p>
  `
})
```

**Fix Required:**

#### Step 1: Add locale to user query

In both actions, modify the Prisma query to fetch user locale:

```typescript
// verify.ts:44-52
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
        locale: true  // ✅ Add this
      }
    }
  }
})
```

```typescript
// reject.ts:43-50
const updated = await tx.companyProfile.update({
  where: { id: parsed.data.companyId },
  data: {
    viesVerified: false,
    verifiedAt: null
  },
  include: {
    user: {
      select: {
        email: true,
        locale: true  // ✅ Add this
      }
    }
  }
})
```

#### Step 2: Create email translation files

Create new file for all 5 locales: `src/lib/locales/{locale}/emails.json`

**pl/emails.json:**
```json
{
  "companyVerified": {
    "subject": "Firma Zweryfikowana - VideoShorts",
    "title": "Firma Zweryfikowana",
    "body": "Twoja firma {{companyName}} została zweryfikowana.",
    "footer": "Możesz teraz korzystać ze wszystkich funkcji firmowych."
  },
  "companyRejected": {
    "subject": "Weryfikacja Firmy Odrzucona - VideoShorts",
    "title": "Weryfikacja Firmy Odrzucona",
    "body": "Weryfikacja Twojej firmy {{companyName}} została odrzucona.",
    "reason": "Powód: {{reason}}",
    "footer": "Skontaktuj się z pomocą techniczną, jeśli masz pytania."
  }
}
```

**en/emails.json:**
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

**de/emails.json:**
```json
{
  "companyVerified": {
    "subject": "Firma Verifiziert - VideoShorts",
    "title": "Firma Verifiziert",
    "body": "Ihre Firma {{companyName}} wurde verifiziert.",
    "footer": "Sie können jetzt alle Unternehmensfunktionen nutzen."
  },
  "companyRejected": {
    "subject": "Firmenverifizierung Abgelehnt - VideoShorts",
    "title": "Firmenverifizierung Abgelehnt",
    "body": "Die Verifizierung Ihrer Firma {{companyName}} wurde abgelehnt.",
    "reason": "Grund: {{reason}}",
    "footer": "Bitte kontaktieren Sie den Support, wenn Sie Fragen haben."
  }
}
```

**es/emails.json:**
```json
{
  "companyVerified": {
    "subject": "Empresa Verificada - VideoShorts",
    "title": "Empresa Verificada",
    "body": "Su empresa {{companyName}} ha sido verificada.",
    "footer": "Ahora puede acceder a todas las funciones empresariales."
  },
  "companyRejected": {
    "subject": "Verificación de Empresa Rechazada - VideoShorts",
    "title": "Verificación de Empresa Rechazada",
    "body": "La verificación de su empresa {{companyName}} ha sido rechazada.",
    "reason": "Razón: {{reason}}",
    "footer": "Póngase en contacto con soporte si tiene preguntas."
  }
}
```

**ru/emails.json:**
```json
{
  "companyVerified": {
    "subject": "Компания Верифицирована - VideoShorts",
    "title": "Компания Верифицирована",
    "body": "Ваша компания {{companyName}} была верифицирована.",
    "footer": "Теперь вы можете использовать все корпоративные функции."
  },
  "companyRejected": {
    "subject": "Верификация Компании Отклонена - VideoShorts",
    "title": "Верификация Компании Отклонена",
    "body": "Верификация вашей компании {{companyName}} была отклонена.",
    "reason": "Причина: {{reason}}",
    "footer": "Пожалуйста, свяжитесь с поддержкой, если у вас есть вопросы."
  }
}
```

#### Step 3: Update email sending logic

Import translation helper and use user's locale:

**verify.ts:**
```typescript
import { getText } from "@/lib/i18n/server"

// ... inside try block after transaction ...

const userLocale = company.user.locale || "en"

await sendEmail({
  to: company.user.email,
  subject: await getText("companyVerified.subject", "emails", userLocale),
  html: `
    <h1>${await getText("companyVerified.title", "emails", userLocale)}</h1>
    <p>${(await getText("companyVerified.body", "emails", userLocale)).replace("{{companyName}}", company.companyName)}</p>
    <p>${await getText("companyVerified.footer", "emails", userLocale)}</p>
  `
})
```

**reject.ts:**
```typescript
import { getText } from "@/lib/i18n/server"

// ... inside try block after transaction ...

const userLocale = company.user.locale || "en"

await sendEmail({
  to: company.user.email,
  subject: await getText("companyRejected.subject", "emails", userLocale),
  html: `
    <h1>${await getText("companyRejected.title", "emails", userLocale)}</h1>
    <p>${(await getText("companyRejected.body", "emails", userLocale)).replace("{{companyName}}", company.companyName)}</p>
    <p>${(await getText("companyRejected.reason", "emails", userLocale)).replace("{{reason}}", parsed.data.reason)}</p>
    <p>${await getText("companyRejected.footer", "emails", userLocale)}</p>
  `
})
```

---

## Summary

**Progress:** 4/5 issues fixed (80% complete)

**Fixed Issues:**
- ✅ Input validation with Zod schemas
- ✅ Company existence checks
- ✅ Translation keys for errors
- ✅ Structured logging

**Remaining Issues:**
- ❌ Hardcoded email content (i18n violation)

**Total Changes Required:** 1

**Severity:** HIGH (i18n is mandatory per coding practices)

---

## Next Steps

1. Add `locale: true` to user select in both Prisma queries
2. Create `emails.json` translation files for all 5 locales (pl, en, de, es, ru)
3. Import `getText` from `@/lib/i18n/server`
4. Update email sending to use translations with user's locale
5. Test email sending with different locale users
6. Verify build still passes: `npm run build`

**Estimated Fix Time:** 15-20 minutes

---

## Build Status

✅ **Build Passed:** `npm run build` completed successfully with no errors

**Warnings:** None related to this task (existing image optimization warnings in other files)
