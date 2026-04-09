"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { getWalletBalance, spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"

interface PublishShortResult {
  redirectUrl?: string
  processing?: boolean
  requiresPayment?: boolean
  requiresVerification?: boolean
}

/**
 * Publish a short video
 *
 * Flow:
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user owns the short via company
 * 3. STATUS CHECK: Short must be in DRAFT status
 * 4. VERIFICATION CHECK: Company must be viesVerified
 * 5. CREDIT CHECK:
 *    - If credits available: deduct and start transcoding
 *    - If no credits: return requiresPayment
 * 6. TRANSCODING: Send Inngest event to start transcoding
 * 7. revalidatePath
 */
export async function publishShortAction(
  shortId: string
): Promise<ActionResult<PublishShortResult>> {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. AUTHORIZATION: Get company profile and verify ownership
  if (session.user.role !== "COMPANY") {
    return createError("errors.unauthorized", "NOT_COMPANY")
  }

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      viesVerified: true
    }
  })

  if (!companyProfile) {
    return createError("errors.unauthorized", "NO_COMPANY_PROFILE")
  }

  // Get the short and verify ownership
  const short = await prisma.short.findFirst({
    where: {
      id: shortId,
      companyId: companyProfile.id
    },
    select: {
      id: true,
      status: true,
      rawVideoKey: true,
      title: true
    }
  })

  if (!short) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 3. STATUS CHECK: Must be DRAFT
  if (short.status !== "DRAFT") {
    return createError("errors.invalidStatus", "NOT_DRAFT")
  }

  // Check if raw video exists
  if (!short.rawVideoKey) {
    return createError("errors.noVideo", "NO_RAW_VIDEO")
  }

  // 4. VERIFICATION CHECK: Company must be VIES verified
  if (!companyProfile.viesVerified) {
    return createSuccess<PublishShortResult>({
      requiresVerification: true
    })
  }

  // 5. CREDIT CHECK: Get price and check wallet balance
  const publicationCost = await getPrice("PUBLICATION")
  const wallet = await getWalletBalance(session.user.id)

  if (wallet.total < publicationCost) {
    return createSuccess<PublishShortResult>({
      requiresPayment: true
    })
  }

  // 6. PROCESS: Spend credits and start transcoding
  try {
    console.log("[Publish] ========== STARTING PUBLISH FLOW ==========")
    console.log("[Publish] ShortId:", short.id)
    console.log("[Publish] UserId:", session.user.id)
    console.log("[Publish] RawVideoKey:", short.rawVideoKey)
    console.log("[Publish] Wallet balance:", wallet.total, "Cost:", publicationCost)

    // Spend credits from wallet (FIFO order)
    await spendCredits(session.user.id, publicationCost, "PUBLICATION", short.id)

    // Update short status to PROCESSING
    await prisma.short.update({
      where: { id: short.id },
      data: {
        status: "PROCESSING",
        processingError: null,
        retryCount: 0
      }
    })
    console.log("[Publish] ✅ Credits spent and status set to PROCESSING")

    // Send Inngest event to start transcoding
    console.log("[Publish] Preparing Inngest event...")
    console.log("[Publish] INNGEST_EVENT_KEY set:", !!process.env.INNGEST_EVENT_KEY)
    console.log("[Publish] ⚠️  NOTE: On localhost, run 'npx inngest-cli@latest dev' to process events")

    const eventPayload = {
      name: "shorts/transcode.started" as const,
      data: {
        shortId: short.id,
        rawVideoKey: short.rawVideoKey,
        userId: session.user.id
      }
    }
    console.log("[Publish] Event payload:", JSON.stringify(eventPayload, null, 2))

    try {
      const sendResult = await inngest.send(eventPayload)
      console.log("[Publish] ✅ Inngest event sent successfully")
      console.log("[Publish] Inngest result:", JSON.stringify(sendResult, null, 2))
    } catch (inngestError) {
      console.error("[Publish] ❌ Inngest send FAILED:", inngestError)
      throw inngestError
    }

    // 7. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")
    revalidatePath(`/[locale]/panel/shorts/${shortId}`, "page")

    console.log("[Publish] ========== PUBLISH FLOW COMPLETED ==========")

    return createSuccess<PublishShortResult>({
      processing: true,
      redirectUrl: `/panel/shorts/${shortId}`
    })
  } catch (error) {
    console.error("[Publish] ❌ PUBLISH FAILED:", error)
    return createError("errors.publishFailed", "PUBLISH_FAILED")
  }
}
