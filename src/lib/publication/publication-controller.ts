/**
 * Publication Controller
 *
 * Manages credit-based video publication:
 * - Check and deduct credits
 * - Track credit transactions
 * - Handle payment-based publication
 */

import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { getWalletBalance, spendCredits, addCredits, topUp, refundToExactBatch } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"

/**
 * Result of publication initiation
 */
export interface PublicationResult {
  success: boolean
  requiresPayment: boolean
  requiresVerification?: boolean
  processing?: boolean
  redirectUrl?: string
  error?: string
}

/**
 * Initiate short publication
 *
 * Flow:
 * 1. Check company verification status
 * 2. Check available credits
 * 3. If credits available: deduct and start processing
 * 4. If no credits: return requiresPayment
 */
export async function initiatePublication(
  userId: string,
  shortId: string,
  companyId: string
): Promise<PublicationResult> {
  // Get company and wallet data
  const [company, wallet, publicationCost, short] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { id: companyId },
      select: { viesVerified: true }
    }),
    getWalletBalance(userId),
    getPrice("PUBLICATION"),
    prisma.short.findFirst({
      where: {
        id: shortId,
        companyId
      },
      select: {
        id: true,
        status: true,
        rawVideoKey: true,
        title: true
      }
    })
  ])

  if (!company) {
    return {
      success: false,
      requiresPayment: false,
      error: "Company not found"
    }
  }

  if (!short) {
    return {
      success: false,
      requiresPayment: false,
      error: "Short not found"
    }
  }

  // Check short status
  if (short.status !== "DRAFT") {
    return {
      success: false,
      requiresPayment: false,
      error: "Short must be in DRAFT status"
    }
  }

  if (!short.rawVideoKey) {
    return {
      success: false,
      requiresPayment: false,
      error: "No video uploaded"
    }
  }

  // Check company verification
  if (!company.viesVerified) {
    return {
      success: false,
      requiresPayment: false,
      requiresVerification: true,
      error: "Company must be verified first"
    }
  }

  // Check credits
  if (wallet.total < publicationCost) {
    return {
      success: true,
      requiresPayment: true
    }
  }

  // Deduct credit and start processing
  const success = await deductCredit(userId, shortId)

  if (!success) {
    return {
      success: false,
      requiresPayment: false,
      error: "Failed to deduct credit"
    }
  }

  // Start transcoding
  await inngest.send({
    name: "shorts/transcode.started",
    data: {
      shortId: short.id,
      rawVideoKey: short.rawVideoKey,
      userId
    }
  })

  return {
    success: true,
    requiresPayment: false,
    processing: true,
    redirectUrl: `/panel/shorts/${shortId}`
  }
}

/**
 * Add credits with payment reference
 */
export async function addCreditsFromPayment(
  userId: string,
  amount: number,
  paymentId: string
): Promise<void> {
  await topUp(userId, amount, paymentId)
}

/**
 * Deduct 1 credit from user and create transaction
 *
 * @returns true if credit was successfully deducted
 */
export async function deductCredit(
  userId: string,
  shortId: string
): Promise<boolean> {
  try {
    const cost = await getPrice("PUBLICATION")
    await spendCredits(userId, cost, "PUBLICATION", shortId)
    return true
  } catch {
    return false
  }
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const wallet = await getWalletBalance(userId)
  return wallet.total
}

/**
 * Refund credit for failed publication
 *
 * Finds the original spend transactions for the shortId and refunds
 * each one to its exact source batch (FIFO-accurate refund).
 * Falls back to creating a new MAIN/BONUS batch if no transactions found.
 */
export async function refundCredit(
  userId: string,
  shortId: string
): Promise<void> {
  // Find the original spend transactions for this publication
  const spendTransactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      shortId,
      amount: { lt: 0 },
      actionType: "PUBLICATION",
    },
  })

  if (spendTransactions.length > 0) {
    // Refund to exact batches
    for (const tx of spendTransactions) {
      if (tx.batchId) {
        await refundToExactBatch(userId, tx.batchId, Math.abs(tx.amount))
      }
    }
  } else {
    // Fallback: create new batch if no original transactions found
    const cost = await getPrice("PUBLICATION")
    await addCredits(userId, "MAIN", "BONUS", cost, {
      metadata: { action: "refund", shortId },
    })
  }
}
