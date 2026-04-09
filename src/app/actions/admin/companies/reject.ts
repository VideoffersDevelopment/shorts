"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getEmailText } from "@/lib/i18n/server"

const rejectSchema = z.object({
  companyId: z.string().cuid(),
  reason: z.string().min(5, "Reason must be at least 5 characters")
})

export async function rejectCompanyAction(
  companyId: string,
  reason: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Validate input
  const parsed = rejectSchema.safeParse({ companyId, reason })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    const company = await prisma.$transaction(async (tx) => {
      // Check company exists first
      const existing = await tx.companyProfile.findUnique({
        where: { id: parsed.data.companyId }
      })

      if (!existing) {
        throw new Error("COMPANY_NOT_FOUND")
      }

      // Suspend company - admin rejection
      const updated = await tx.companyProfile.update({
        where: { id: parsed.data.companyId },
        data: {
          status: "SUSPENDED"
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
          targetId: parsed.data.companyId,
          metadata: { reason: parsed.data.reason }
        }
      })

      return updated
    })

    // Send rejection email (best-effort - don't fail if email fails)
    const emailVars = { companyName: company.companyName, reason: parsed.data.reason }
    try {
      await sendEmail({
        to: company.user.email,
        subject: await getEmailText("companyRejected.subject", null, emailVars),
        html: `
          <h1>${await getEmailText("companyRejected.title", null, emailVars)}</h1>
          <p>${await getEmailText("companyRejected.body", null, emailVars)}</p>
          <p><strong>${await getEmailText("companyRejected.reason", null, emailVars)}</strong></p>
          <p>${await getEmailText("companyRejected.footer", null, emailVars)}</p>
        `
      })
    } catch (emailError) {
      console.warn("[ADMIN_REJECT_COMPANY] Failed to send notification email:", emailError)
    }

    revalidatePath("/admin/companies")

    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_REJECT_COMPANY]", {
      adminId: session.user.id,
      companyId: parsed.data.companyId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
      return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
    }

    return createError("admin.errors.rejectFailed", "REJECT_FAILED")
  }
}
