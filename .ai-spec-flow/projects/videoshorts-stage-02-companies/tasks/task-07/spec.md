# Task 07: Admin Companies Management

## Overview

**Priority:** HIGH
**Dependencies:** task-06
**Complexity:** Medium (9 files, ~9k tokens)
**Status:** pending

## What to Build

Create the admin companies management interface with table view, filters, search, and verify/reject actions. Includes audit logging for all admin actions.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(admin)/[locale]/admin/companies/page.tsx` | Create | Companies management page |
| `src/components/admin/companies-table.tsx` | Create | Companies data table |
| `src/app/actions/admin/companies/verify.ts` | Create | Verify company action |
| `src/app/actions/admin/companies/reject.ts` | Create | Reject company action |

## Files to Modify

| File | Changes |
|------|---------|
| None | All new files |

## Companies Management Page

```typescript
// src/app/(admin)/[locale]/admin/companies/page.tsx
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompaniesTable } from "@/components/admin/companies-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"

interface PageProps {
  searchParams: {
    status?: "all" | "verified" | "pending"
    search?: string
  }
}

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const t = await getTranslations("admin.companies")

  const companies = await prisma.companyProfile.findMany({
    where: {
      ...(searchParams.status === "verified" && { viesVerified: true }),
      ...(searchParams.status === "pending" && { viesVerified: false }),
      ...(searchParams.search && {
        OR: [
          { companyName: { contains: searchParams.search, mode: "insensitive" } },
          { nip: { contains: searchParams.search } }
        ]
      })
    },
    include: {
      user: { select: { email: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder={t("search.placeholder")}
          defaultValue={searchParams.search}
          className="max-w-sm"
        />

        <Select defaultValue={searchParams.status || "all"}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.all")}</SelectItem>
            <SelectItem value="verified">{t("filter.verified")}</SelectItem>
            <SelectItem value="pending">{t("filter.pending")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CompaniesTable companies={companies} />
    </div>
  )
}
```

## Companies Table Component

```typescript
// src/components/admin/companies-table.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Eye } from "lucide-react"
import { verifyCompanyAction } from "@/app/actions/admin/companies/verify"
import { rejectCompanyAction } from "@/app/actions/admin/companies/reject"
import { toast } from "sonner"

interface CompaniesTableProps {
  companies: Array<{
    id: string
    companyName: string
    nip: string
    viesVerified: boolean
    createdAt: Date
    user: { email: string }
  }>
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const t = useTranslations("admin.companies")
  const tError = useTranslations("errors")
  const [isLoading, setIsLoading] = useState<string | null>(null)

  async function handleVerify(companyId: string) {
    setIsLoading(companyId)
    const result = await verifyCompanyAction(companyId)

    if (!result.success) {
      toast.error(t(result.error) || tError(result.error))
    } else {
      toast.success(t("verify.success"))
    }

    setIsLoading(null)
  }

  async function handleReject(companyId: string) {
    const reason = prompt(t("reject.reasonPrompt"))
    if (!reason) return

    setIsLoading(companyId)
    const result = await rejectCompanyAction(companyId, reason)

    if (!result.success) {
      toast.error(t(result.error) || tError(result.error))
    } else {
      toast.success(t("reject.success"))
    }

    setIsLoading(null)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.name")}</TableHead>
          <TableHead>{t("table.nip")}</TableHead>
          <TableHead>{t("table.email")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map(company => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">
              {company.companyName}
            </TableCell>
            <TableCell>{company.nip}</TableCell>
            <TableCell>{company.user.email}</TableCell>
            <TableCell>
              {company.viesVerified ? (
                <Badge variant="default">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("status.verified")}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="mr-1 h-3 w-3" />
                  {t("status.pending")}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {!company.viesVerified && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleVerify(company.id)}
                      disabled={isLoading === company.id}
                    >
                      {t("actions.verify")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(company.id)}
                      disabled={isLoading === company.id}
                    >
                      {t("actions.reject")}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## Verify Company Action

```typescript
// src/app/actions/admin/companies/verify.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import type { ActionResult } from "@/lib/types/action-result"
import { createError } from "@/lib/types/action-result"

export async function verifyCompanyAction(
  companyId: string,
  reason?: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  try {
    // Update company + create audit log (transaction)
    const company = await prisma.$transaction(async (tx) => {
      // Update company
      const updated = await tx.companyProfile.update({
        where: { id: companyId },
        data: {
          viesVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id
        },
        include: { user: true }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "VERIFY_COMPANY",
          targetType: "COMPANY",
          targetId: companyId,
          metadata: { reason }
        }
      })

      return updated
    })

    // Send notification email
    await sendEmail({
      to: company.user.email,
      template: "CompanyVerified",
      data: { companyName: company.companyName }
    })

    revalidatePath("/admin/companies")
    revalidatePath(`/companies/${company.slug}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Verify error:", error)
    return createError("admin.errors.verifyFailed", "VERIFY_FAILED")
  }
}
```

## Reject Company Action

```typescript
// src/app/actions/admin/companies/reject.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import type { ActionResult } from "@/lib/types/action-result"
import { createError } from "@/lib/types/action-result"

export async function rejectCompanyAction(
  companyId: string,
  reason: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  if (!reason) {
    return createError("admin.errors.reasonRequired", "REASON_REQUIRED")
  }

  try {
    const company = await prisma.$transaction(async (tx) => {
      // Soft delete company (can be restored later)
      const updated = await tx.companyProfile.update({
        where: { id: companyId },
        data: {
          viesVerified: false,
          verifiedAt: null
        },
        include: { user: true }
      })

      // Revert user role to USER
      await tx.user.update({
        where: { id: updated.userId },
        data: { role: "USER" }
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "REJECT_COMPANY",
          targetType: "COMPANY",
          targetId: companyId,
          metadata: { reason }
        }
      })

      return updated
    })

    // Send rejection email
    await sendEmail({
      to: company.user.email,
      template: "CompanyRejected",
      data: {
        companyName: company.companyName,
        reason
      }
    })

    revalidatePath("/admin/companies")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Reject error:", error)
    return createError("admin.errors.rejectFailed", "REJECT_FAILED")
  }
}
```

## Acceptance Criteria

- [ ] Companies page shows all companies in table
- [ ] Table columns: name, NIP, email, status, actions
- [ ] Search filters by company name or NIP
- [ ] Status filter: all, verified, pending
- [ ] Verified badge shows for verified companies
- [ ] Pending badge shows for unverified companies
- [ ] Verify button only shows for pending companies
- [ ] Reject button only shows for pending companies
- [ ] Verify action updates company, creates audit log, sends email
- [ ] Reject action reverts to USER role, creates audit log, sends email
- [ ] Loading state during actions
- [ ] Success/error toasts shown
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test admin: Login as ADMIN
- Test companies: Create pending companies via upgrade flow

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to companies | Page loads with table | `/admin/companies` |
| 2 | Verify table data | Shows company name, NIP, email, status | `table` |
| 3 | Filter by pending | Shows only pending companies | `.select-trigger` |
| 4 | Search by name | Filters results | `input[placeholder*="Search"]` |
| 5 | Click Verify | Confirmation, success toast | `button:has-text("Verify")` |
| 6 | Check status | Badge changes to "Verified" | `.badge` |
| 7 | Check audit log | New entry in database | Database |
| 8 | Click Reject | Prompt for reason, success toast | `button:has-text("Reject")` |

### Screenshot Checkpoints
- `01-companies-table.png` - Full companies table
- `02-pending-filter.png` - Filtered to pending only
- `03-verify-action.png` - Verify button highlighted
- `04-verified-badge.png` - Verified badge after action

## Notes

- **Audit Log:** All admin actions recorded
- **Email Notifications:** CompanyVerified / CompanyRejected templates
- **Transaction:** Company update + audit log atomic
- **Soft Delete:** Rejection doesn't delete profile (can restore)
- **Role Reversion:** Rejected companies revert to USER role
