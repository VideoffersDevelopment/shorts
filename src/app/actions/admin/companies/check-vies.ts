"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { checkVATWithRetry, type VIESResponse } from "@/lib/vies"

const checkViesSchema = z.object({
  companyId: z.string().cuid()
})

export interface CheckViesResult {
  valid: boolean
  name: string
  address: string
}

export async function checkViesAction(
  companyId: string
): Promise<ActionResult<CheckViesResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Validate input
  const parsed = checkViesSchema.safeParse({ companyId })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    // Get company with NIP
    const company = await prisma.companyProfile.findUnique({
      where: { id: parsed.data.companyId }
    })

    if (!company) {
      return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
    }

    // Polish NIP - use PL country code
    const countryCode = "PL"
    const vatNumber = company.nip

    // Call VIES API
    let viesResult: VIESResponse
    try {
      viesResult = await checkVATWithRetry(countryCode, vatNumber)
    } catch (error) {
      console.error("[VIES_API_ERROR]", {
        companyId: parsed.data.companyId,
        nip: vatNumber,
        error: error instanceof Error ? error.message : String(error)
      })
      return createError("admin.errors.viesUnavailable", "VIES_UNAVAILABLE")
    }

    // Update company viesVerified status
    await prisma.$transaction(async (tx) => {
      await tx.companyProfile.update({
        where: { id: parsed.data.companyId },
        data: {
          viesVerified: viesResult.valid
        }
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "CHECK_VIES",
          targetType: "COMPANY",
          targetId: parsed.data.companyId,
          metadata: {
            valid: viesResult.valid,
            name: viesResult.name,
            address: viesResult.address
          }
        }
      })
    })

    revalidatePath("/admin/companies")

    return createSuccess({
      valid: viesResult.valid,
      name: viesResult.name,
      address: viesResult.address
    })
  } catch (error) {
    console.error("[ADMIN_CHECK_VIES]", {
      adminId: session.user.id,
      companyId: parsed.data.companyId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    return createError("admin.errors.viesCheckFailed", "VIES_CHECK_FAILED")
  }
}
