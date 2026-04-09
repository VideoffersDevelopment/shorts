"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getWalletBalance, spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"

const renewShortSchema = z.object({
  shortId: z.string().cuid()
})

interface RenewShortResult {
  processing?: boolean
  needsPayment?: boolean
  renewedUntil?: string
}

/**
 * Renew an archived short
 *
 * Flow:
 * 1. VALIDATION: Validate shortId with Zod
 * 2. AUTH: Verify user is logged in
 * 3. AUTHORIZATION: Verify user owns the short via company
 * 4. STATUS CHECK: Short must be in ARCHIVED status
 * 5. CREDIT CHECK:
 *    - If credits available: deduct and renew
 *    - If no credits: return needsPayment
 * 6. RENEWAL: Update short status to PUBLISHED
 * 7. revalidatePath
 */
export async function renewShortAction(
  shortId: string
): Promise<ActionResult<RenewShortResult>> {
  // 1. VALIDATION
  const parsed = renewShortSchema.safeParse({ shortId })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }
  const validatedId = parsed.data.shortId

  // 2. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 3. AUTHORIZATION: Get company profile and verify ownership
  if (session.user.role !== "COMPANY") {
    return createError("errors.unauthorized", "NOT_COMPANY")
  }

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true
    }
  })

  if (!companyProfile) {
    return createError("errors.unauthorized", "NO_COMPANY_PROFILE")
  }

  // Get the short and verify ownership
  const short = await prisma.short.findFirst({
    where: {
      id: validatedId,
      companyId: companyProfile.id
    },
    select: {
      id: true,
      status: true,
      title: true
    }
  })

  if (!short) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 4. STATUS CHECK: Must be ARCHIVED
  if (short.status !== "ARCHIVED") {
    return createError("errors.invalidStatus", "NOT_ARCHIVED")
  }

  // 5. CREDIT CHECK: Get price and check wallet balance
  const extensionCost = await getPrice("EXTENSION_30D")
  const wallet = await getWalletBalance(session.user.id)

  if (wallet.total < extensionCost) {
    return createSuccess<RenewShortResult>({
      needsPayment: true
    })
  }

  // 6. RENEWAL: Spend credits and renew short
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

  try {
    // Spend credits from wallet
    await spendCredits(session.user.id, extensionCost, "EXTENSION", short.id)

    // Update short status to PUBLISHED
    await prisma.short.update({
      where: { id: short.id },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        expiresAt: expiresAt,
        archivedAt: null
      }
    })

    // 7. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")
    revalidatePath(`/[locale]/panel/shorts/${validatedId}`, "page")
    revalidatePath(`/[locale]/shorts/${validatedId}`, "page")

    return createSuccess<RenewShortResult>({
      processing: true,
      renewedUntil: expiresAt.toISOString()
    })
  } catch (error) {
    console.error("Renew short error:", error)
    return createError("errors.renewFailed", "RENEW_FAILED")
  }
}
