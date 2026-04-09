"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyUpgradeSchema } from "@/lib/validation"
import { checkVATWithRetry } from "@/lib/vies"
import { generateSlug } from "@/lib/utils/slug"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"
import { grantPromoCredits } from "@/lib/wallet/wallet-service"
import type { CompanyProfile } from "@prisma/client"

interface UpgradeResult {
  company: CompanyProfile
  viesStatus: "verified" | "pending_manual_review"
}

export async function upgradeToCompanyAction(
  data: unknown
): Promise<ActionResult<UpgradeResult>> {
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
    return createError("errors.alreadyCompany", "ALREADY_COMPANY")
  }

  // 3. VALIDATION
  const parsed = companyUpgradeSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const { companyName, nip, address, phone } = parsed.data

  // Parse address into street field (simplified for upgrade form)
  // Full address management is done in company profile form
  const street = address

  // 4. CHECK: NIP unique?
  const nipExists = await prisma.companyProfile.findUnique({
    where: { nip }
  })
  if (nipExists) {
    return createError("errors.nipExists", "NIP_EXISTS", "nip")
  }

  // 5. VIES VERIFICATION
  let viesVerified = false
  let verifiedAt: Date | null = null
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
          street,
          phone
        }
      })
    })

    // 8. PROMO GRANT (fire-and-forget, non-blocking)
    grantPromoCredits(session.user.id).catch((err) =>
      console.error("PROMO grant failed:", err)
    )

    // 9. REVALIDATE
    // Note: Don't revalidate /settings/upgrade to avoid triggering re-render
    // which could cause redirect loop during session update
    revalidatePath(`/companies/${slug}`)
    revalidatePath("/panel/company")

    return createSuccess<UpgradeResult>({
      company,
      viesStatus: viesVerified ? "verified" : "pending_manual_review"
    })
  } catch (error) {
    console.error("Company upgrade error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: session.user.id,
      companyName,
      slug,
      nip
    })
    return createError("errors.createFailed", "CREATE_FAILED")
  }
}
