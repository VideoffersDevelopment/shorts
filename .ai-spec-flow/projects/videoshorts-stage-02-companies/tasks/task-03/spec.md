# Task 03: Company Upgrade Flow

## Overview

**Priority:** HIGH
**Dependencies:** task-01, task-02
**Complexity:** Medium (12 files, ~12k tokens)
**Status:** pending

## What to Build

Implement the complete flow for users to upgrade their account to a company account. This includes the upgrade form, Server Actions for company creation with VIES verification, and the upgrade page.

This is the core entry point for companies to join the platform.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/actions/companies/upgrade.ts` | Create | Server Action for company upgrade |
| `src/app/actions/companies/update.ts` | Create | Server Action for company profile updates |
| `src/app/(main)/[locale]/settings/upgrade/page.tsx` | Create | Upgrade to company page |
| `src/components/companies/company-upgrade-form.tsx` | Create | Company upgrade form component |
| `src/components/companies/vies-status-badge.tsx` | Create | VIES verification status badge |

## Files to Modify

| File | Changes |
|------|---------|
| None | All new files |

## Server Action: Upgrade to Company

```typescript
// src/app/actions/companies/upgrade.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyUpgradeSchema } from "@/lib/validation"
import { checkVATWithRetry } from "@/lib/vies"
import { generateSlug } from "@/lib/utils/slug"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError } from "@/lib/types/action-result"

export async function upgradeToCompanyAction(
  data: unknown
): Promise<ActionResult<{ company: any; viesStatus: string }>> {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. CHECK: Already a company?
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })
  if (existing) {
    return createError("companies.errors.alreadyCompany", "ALREADY_COMPANY")
  }

  // 3. VALIDATION
  const parsed = companyUpgradeSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const { companyName, nip, address, contactEmail, phone } = parsed.data

  // 4. CHECK: NIP unique?
  const nipExists = await prisma.companyProfile.findUnique({
    where: { nip }
  })
  if (nipExists) {
    return createError("companies.errors.nipExists", "NIP_EXISTS", "nip")
  }

  // 5. VIES VERIFICATION
  let viesVerified = false
  let verifiedAt = null
  try {
    const viesResult = await checkVATWithRetry("PL", nip)
    viesVerified = viesResult.valid
    verifiedAt = viesVerified ? new Date() : null
  } catch (error) {
    console.error("VIES API error:", error)
    // Fallback: manual verification required
    viesVerified = false
  }

  // 6. GENERATE SLUG
  const slug = await generateSlug(companyName, prisma.companyProfile)

  // 7. CREATE COMPANY PROFILE
  try {
    const company = await prisma.$transaction(async (tx) => {
      // Update user role
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "COMPANY" }
      })

      // Create company profile
      return await tx.companyProfile.create({
        data: {
          userId: session.user.id,
          companyName,
          slug,
          nip,
          viesVerified,
          verifiedAt,
          address,
          phone
        }
      })
    })

    // 8. REVALIDATE
    revalidatePath(`/companies/${slug}`)
    revalidatePath("/panel/company")

    return {
      success: true,
      data: {
        company,
        viesStatus: viesVerified ? "verified" : "pending_manual_review"
      }
    }
  } catch (error) {
    console.error("Company upgrade error:", error)
    return createError("companies.errors.createFailed", "CREATE_FAILED")
  }
}
```

## Company Upgrade Form Component

```typescript
// src/components/companies/company-upgrade-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { upgradeToCompanyAction } from "@/app/actions/companies/upgrade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { toast } from "sonner"

export function CompanyUpgradeForm() {
  const t = useTranslations("companies")
  const tError = useTranslations("errors")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = await upgradeToCompanyAction(data)

    if (!result.success) {
      setError(t(result.error) || tError(result.error))
      setIsLoading(false)
    } else {
      toast.success(
        result.data.viesStatus === "verified"
          ? t("upgrade.success.verified")
          : t("upgrade.success.pending")
      )
      router.push("/panel/company/profile")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upgrade.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="companyName">{t("upgrade.fields.companyName")}</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              minLength={2}
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="nip">{t("upgrade.fields.nip")}</Label>
            <Input
              id="nip"
              name="nip"
              required
              pattern="\d{10}|\d{2}-\d{3}-\d{3}-\d{2}"
              placeholder="1234567890 or 12-345-678-90"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="address">{t("upgrade.fields.address")}</Label>
            <Input
              id="address"
              name="address"
              required
              minLength={5}
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="contactEmail">{t("upgrade.fields.contactEmail")}</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t("upgrade.fields.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {t("upgrade.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

## Upgrade Page

```typescript
// src/app/(main)/[locale]/settings/upgrade/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyUpgradeForm } from "@/components/companies/company-upgrade-form"

export default async function UpgradeToCompanyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Check if already a company
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (existing) redirect("/panel/company/profile")

  const t = await getTranslations("companies")

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("upgrade.heading")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("upgrade.description")}
        </p>
      </div>
      <CompanyUpgradeForm />
    </div>
  )
}
```

## Acceptance Criteria

- [ ] Upgrade form displays all required fields
- [ ] NIP validation works (both formats accepted)
- [ ] Form validates required fields client-side
- [ ] Server Action validates with Zod
- [ ] VIES API called with retry logic
- [ ] CompanyProfile created with correct data
- [ ] User role updated to COMPANY
- [ ] Slug generated uniquely
- [ ] Success: redirect to company profile page
- [ ] Error: display clear message
- [ ] Loading state shown during VIES check
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: Login with regular USER account

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to upgrade page | Page loads | `/settings/upgrade` |
| 2 | Fill company name | Field accepts input | `#companyName` |
| 3 | Fill NIP (valid format) | Field accepts input | `#nip` |
| 4 | Fill address | Field accepts input | `#address` |
| 5 | Fill contact email | Field accepts input | `#contactEmail` |
| 6 | Submit form | Loading spinner appears | `button[type="submit"]` |
| 7 | Wait for VIES check | Success toast shown | `.toast-success` |
| 8 | Check redirect | Redirected to `/panel/company/profile` | - |

### Screenshot Checkpoints
- `01-upgrade-form.png` - Empty upgrade form
- `02-form-filled.png` - Form with data filled
- `03-loading.png` - Loading state during VIES check
- `04-success.png` - Success toast message

## Notes

- **VIES Verification:** May take 5-10 seconds, show loading state
- **Error Handling:** Graceful fallback if VIES API unavailable
- **NIP Uniqueness:** Database constraint ensures no duplicates
- **Slug Generation:** Auto-generated from company name
- **Transaction:** User role and company profile created atomically
