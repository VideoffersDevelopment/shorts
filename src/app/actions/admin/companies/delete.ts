"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getEmailText } from "@/lib/i18n/server"

const deleteSchema = z.object({
  companyId: z.string().cuid(),
})

export async function deleteCompanyAction(
  companyId: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Validate input
  const parsed = deleteSchema.safeParse({ companyId })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    const company = await prisma.$transaction(async (tx) => {
      // Check company exists first
      const existing = await tx.companyProfile.findUnique({
        where: { id: parsed.data.companyId },
        include: { user: true }
      })

      if (!existing) {
        throw new Error("COMPANY_NOT_FOUND")
      }

      // Delete company profile
      await tx.companyProfile.delete({
        where: { id: parsed.data.companyId }
      })

      // Revert user role to USER
      await tx.user.update({
        where: { id: existing.userId },
        data: { role: "USER" }
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "DELETE_COMPANY",
          targetType: "COMPANY",
          targetId: parsed.data.companyId,
          metadata: { companyName: existing.companyName }
        }
      })

      return existing
    })

    // Send deletion notification email
    const emailVars = { companyName: company.companyName }
    await sendEmail({
      to: company.user.email,
      subject: await getEmailText("companyDeleted.subject", null, emailVars),
      html: `
        <h1>${await getEmailText("companyDeleted.title", null, emailVars)}</h1>
        <p>${await getEmailText("companyDeleted.body", null, emailVars)}</p>
        <p>${await getEmailText("companyDeleted.footer", null, emailVars)}</p>
      `
    })

    revalidatePath("/admin/companies")

    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_DELETE_COMPANY]", {
      adminId: session.user.id,
      companyId: parsed.data.companyId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
      return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
    }

    return createError("admin.errors.deleteFailed", "DELETE_FAILED")
  }
}
