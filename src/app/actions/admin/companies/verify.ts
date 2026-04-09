"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getEmailText } from "@/lib/i18n/server"

const verifySchema = z.object({
  companyId: z.string().cuid(),
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
    // Update company + create audit log (transaction)
    const company = await prisma.$transaction(async (tx) => {
      // Check company exists first
      const existing = await tx.companyProfile.findUnique({
        where: { id: parsed.data.companyId }
      })

      if (!existing) {
        throw new Error("COMPANY_NOT_FOUND")
      }

      // Update company - set status to ACTIVE (admin approval)
      const updated = await tx.companyProfile.update({
        where: { id: parsed.data.companyId },
        data: {
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          status: "ACTIVE"
        },
        include: { user: true }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "VERIFY_COMPANY",
          targetType: "COMPANY",
          targetId: parsed.data.companyId,
          metadata: parsed.data.reason ? { reason: parsed.data.reason } : undefined
        }
      })

      return updated
    })

    // Send notification email (best-effort - don't fail if email fails)
    const emailVars = { companyName: company.companyName }
    try {
      await sendEmail({
        to: company.user.email,
        subject: await getEmailText("companyVerified.subject", null, emailVars),
        html: `
          <h1>${await getEmailText("companyVerified.title", null, emailVars)}</h1>
          <p>${await getEmailText("companyVerified.body", null, emailVars)}</p>
          <p>${await getEmailText("companyVerified.footer", null, emailVars)}</p>
        `
      })
    } catch (emailError) {
      console.warn("[ADMIN_VERIFY_COMPANY] Failed to send notification email:", emailError)
    }

    revalidatePath("/admin/companies")
    revalidatePath(`/companies/${company.slug}`)

    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_VERIFY_COMPANY]", {
      adminId: session.user.id,
      companyId: parsed.data.companyId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
      return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
    }

    return createError("admin.errors.verifyFailed", "VERIFY_FAILED")
  }
}
