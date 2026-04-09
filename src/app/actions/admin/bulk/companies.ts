"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getEmailText } from "@/lib/i18n/server"
import { bulkIdsSchema, bulkRejectSchema, type BulkActionResult } from "./types"

/**
 * Bulk verify multiple companies
 */
export async function bulkVerifyCompaniesAction(
  ids: string[]
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkIdsSchema.safeParse({ ids })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    // Process each company in a transaction
    for (const companyId of parsed.data.ids) {
      try {
        const company = await prisma.$transaction(async (tx) => {
          const existing = await tx.companyProfile.findUnique({
            where: { id: companyId },
            include: { user: true },
          })

          if (!existing) {
            throw new Error("COMPANY_NOT_FOUND")
          }

          // Admin can verify any company regardless of VIES status
          const updated = await tx.companyProfile.update({
            where: { id: companyId },
            data: {
              verifiedAt: new Date(),
              verifiedBy: session.user.id,
              status: "ACTIVE"
            },
            include: { user: true },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_VERIFY_COMPANY",
              targetType: "COMPANY",
              targetId: companyId,
              metadata: { bulkOperation: true },
            },
          })

          return updated
        })

        // Send notification email
        const emailVars = { companyName: company.companyName }
        await sendEmail({
          to: company.user.email,
          subject: await getEmailText("companyVerified.subject", null, emailVars),
          html: `
            <h1>${await getEmailText("companyVerified.title", null, emailVars)}</h1>
            <p>${await getEmailText("companyVerified.body", null, emailVars)}</p>
            <p>${await getEmailText("companyVerified.footer", null, emailVars)}</p>
          `,
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(companyId)
        result.errors[companyId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/companies")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_VERIFY_COMPANIES]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkVerifyFailed", "BULK_VERIFY_FAILED")
  }
}

/**
 * Bulk reject multiple companies
 */
export async function bulkRejectCompaniesAction(
  ids: string[],
  reason: string
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkRejectSchema.safeParse({ ids, reason })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const companyId of parsed.data.ids) {
      try {
        const company = await prisma.$transaction(async (tx) => {
          const existing = await tx.companyProfile.findUnique({
            where: { id: companyId },
            include: { user: true },
          })

          if (!existing) {
            throw new Error("COMPANY_NOT_FOUND")
          }

          // Admin rejection - suspend company (doesn't change VIES status)
          const updated = await tx.companyProfile.update({
            where: { id: companyId },
            data: {
              status: "SUSPENDED"
            },
            include: { user: true },
          })

          // Revert user role to USER
          await tx.user.update({
            where: { id: existing.userId },
            data: { role: "USER" },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_REJECT_COMPANY",
              targetType: "COMPANY",
              targetId: companyId,
              metadata: { reason: parsed.data.reason, bulkOperation: true },
            },
          })

          return updated
        })

        // Send rejection email
        const emailVars = {
          companyName: company.companyName,
          reason: parsed.data.reason,
        }
        await sendEmail({
          to: company.user.email,
          subject: await getEmailText("companyRejected.subject", null, emailVars),
          html: `
            <h1>${await getEmailText("companyRejected.title", null, emailVars)}</h1>
            <p>${await getEmailText("companyRejected.body", null, emailVars)}</p>
            <p><strong>${await getEmailText("companyRejected.reason", null, emailVars)}:</strong> ${parsed.data.reason}</p>
            <p>${await getEmailText("companyRejected.footer", null, emailVars)}</p>
          `,
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(companyId)
        result.errors[companyId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/companies")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_REJECT_COMPANIES]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      reason: parsed.data.reason,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkRejectFailed", "BULK_REJECT_FAILED")
  }
}

/**
 * Bulk delete multiple companies
 */
export async function bulkDeleteCompaniesAction(
  ids: string[]
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkIdsSchema.safeParse({ ids })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const companyId of parsed.data.ids) {
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.companyProfile.findUnique({
            where: { id: companyId },
            include: { user: true },
          })

          if (!existing) {
            throw new Error("COMPANY_NOT_FOUND")
          }

          // Delete company profile
          await tx.companyProfile.delete({
            where: { id: companyId },
          })

          // Revert user role to USER
          await tx.user.update({
            where: { id: existing.userId },
            data: { role: "USER" },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_DELETE_COMPANY",
              targetType: "COMPANY",
              targetId: companyId,
              metadata: {
                bulkOperation: true,
                companyName: existing.companyName,
                nip: existing.nip,
              },
            },
          })
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(companyId)
        result.errors[companyId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/companies")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_DELETE_COMPANIES]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkDeleteFailed", "BULK_DELETE_FAILED")
  }
}
