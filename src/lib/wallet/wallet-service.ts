/**
 * Wallet Service — Core Engine
 *
 * Single entry point for all credit operations.
 * Implements dual-wallet system (PROMO/MAIN) with FIFO spending,
 * expiration management, and Premium Reset on top-up.
 */

import { prisma } from "@/lib/prisma"
import type { CreditActionType, CreditBatchType, WalletType, Prisma } from "@prisma/client"
import type { WalletBalanceResult, SpendResult, AddCreditsOptions, TransferTipResult } from "./wallet-types"
import { InsufficientCreditsError } from "./wallet-types"
import { getPrice } from "./pricing-service"
import {
  MAIN_EXPIRY_MONTHS,
  SPENDING_RESET_MONTHS,
  TOPUP_RESET_MONTHS,
  MAINTENANCE_INACTIVITY_MONTHS,
  PROMO_GRANT_AMOUNT,
  PROMO_EXPIRY_DAYS,
} from "./wallet-constants"

// ─────────────────────────────────────────────
// Helper: date arithmetic
// ─────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function diffInDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

// ─────────────────────────────────────────────
// getWalletBalance
// ─────────────────────────────────────────────

/**
 * Get full wallet balance for a user.
 * Returns separate PROMO and MAIN balances, active batches, and maintenance fee status.
 */
export async function getWalletBalance(userId: string): Promise<WalletBalanceResult> {
  const now = new Date()

  const batches = await prisma.creditBatch.findMany({
    where: {
      userId,
      currentBalance: { gt: 0 },
      expiresAt: { gt: now },
      isFrozen: false,
    },
    orderBy: { expiresAt: "asc" },
  })

  const promoBatches = batches.filter((b) => b.wallet === "PROMO")
  const mainBatches = batches.filter((b) => b.wallet === "MAIN")

  const promoBalance = promoBatches.reduce((sum, b) => sum + b.currentBalance, 0)
  const mainBalance = mainBatches.reduce((sum, b) => sum + b.currentBalance, 0)

  const promoEarliestExpiry = promoBatches.length > 0 ? promoBatches[0].expiresAt : null
  const mainEarliestExpiry = mainBatches.length > 0 ? mainBatches[0].expiresAt : null

  // Check maintenance fee status: any MAIN batch with lastActivityAt older than threshold
  const maintenanceThreshold = addMonths(now, -MAINTENANCE_INACTIVITY_MONTHS)
  // If user has ANY active MAIN batch, check the most recent activity across ALL MAIN batches
  let isMaintenanceFeeActive = false
  if (mainBatches.length > 0) {
    const allMainBatches = await prisma.creditBatch.findMany({
      where: { userId, wallet: "MAIN" },
      select: { lastActivityAt: true },
      orderBy: { lastActivityAt: "desc" },
      take: 1,
    })
    if (allMainBatches.length > 0 && allMainBatches[0].lastActivityAt < maintenanceThreshold) {
      isMaintenanceFeeActive = true
    }
  }

  return {
    promo: {
      balance: promoBalance,
      expiresAt: promoEarliestExpiry,
      daysRemaining: promoEarliestExpiry ? diffInDays(now, promoEarliestExpiry) : null,
    },
    main: {
      balance: mainBalance,
      expiresAt: mainEarliestExpiry,
      isMaintenanceFeeActive,
    },
    total: promoBalance + mainBalance,
    batches,
  }
}

// ─────────────────────────────────────────────
// spendCredits (Wallet-First FIFO)
// ─────────────────────────────────────────────

/**
 * Spend credits using Wallet-First FIFO algorithm.
 *
 * Order: PROMO batches first (oldest expiry), then MAIN (EARNED_TIP first, then oldest expiry).
 * Uses pessimistic locking (SELECT FOR UPDATE) to prevent concurrent spending issues.
 * Spending extends MAIN batch expiry by +6 months (if new date > current).
 */
export async function spendCredits(
  userId: string,
  amount: number,
  actionType: CreditActionType,
  relatedVideoId?: string
): Promise<SpendResult> {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date()

    // Fetch available batches with pessimistic lock
    const batches = await tx.$queryRaw<
      Array<{
        id: string
        wallet: WalletType
        type: CreditBatchType
        currentBalance: number
        expiresAt: Date
      }>
    >`
      SELECT id, wallet, type, "currentBalance", "expiresAt"
      FROM "CreditBatch"
      WHERE "userId" = ${userId}
        AND "currentBalance" > 0
        AND "expiresAt" > ${now}
        AND "isFrozen" = false
      ORDER BY
        CASE WHEN wallet = 'PROMO' THEN 0 ELSE 1 END,
        CASE WHEN wallet = 'MAIN' AND type = 'EARNED_TIP' THEN 0 ELSE 1 END,
        "expiresAt" ASC
      FOR UPDATE
    `

    const totalAvailable = batches.reduce((sum, b) => sum + b.currentBalance, 0)
    if (totalAvailable < amount) {
      throw new InsufficientCreditsError(amount, totalAvailable)
    }

    // Deduction loop
    let remaining = amount
    const transactionIds: string[] = []
    const batchesAffected: SpendResult["batchesAffected"] = []

    for (const batch of batches) {
      if (remaining <= 0) break

      const toDeduct = Math.min(batch.currentBalance, remaining)
      remaining -= toDeduct

      // Update batch balance and activity
      const updateData: Prisma.CreditBatchUpdateInput = {
        currentBalance: { decrement: toDeduct },
      }
      if (batch.wallet === "MAIN") {
        updateData.lastActivityAt = now
      }

      await tx.creditBatch.update({
        where: { id: batch.id },
        data: updateData,
      })

      // Create transaction record (one per batch touched)
      const txRecord = await tx.creditTransaction.create({
        data: {
          userId,
          batchId: batch.id,
          amount: -toDeduct,
          actionType,
          shortId: relatedVideoId ?? null,
        },
      })

      transactionIds.push(txRecord.id)
      batchesAffected.push({
        batchId: batch.id,
        amountDeducted: toDeduct,
        wallet: batch.wallet,
      })
    }

    // Spending reset: extend MAIN batches by +6 months (if new > current)
    const newExpiry = addMonths(now, SPENDING_RESET_MONTHS)
    const affectedMainBatchIds = batchesAffected
      .filter((b) => b.wallet === "MAIN")
      .map((b) => b.batchId)

    if (affectedMainBatchIds.length > 0) {
      // Only extend if new expiry is later than current
      await tx.$executeRaw`
        UPDATE "CreditBatch"
        SET "expiresAt" = ${newExpiry}
        WHERE id = ANY(${affectedMainBatchIds})
          AND "expiresAt" < ${newExpiry}
      `
    }

    return {
      success: true,
      totalSpent: amount,
      transactionIds,
      batchesAffected,
    }
  })
}

// ─────────────────────────────────────────────
// addCredits
// ─────────────────────────────────────────────

/**
 * Add credits to a user's wallet by creating a new batch.
 * Used for PROMO grants, admin bonuses, and tip receipts.
 * For purchases via payment gateway, use topUp() instead.
 */
export async function addCredits(
  userId: string,
  wallet: WalletType,
  type: CreditBatchType,
  amount: number,
  options?: AddCreditsOptions
): Promise<string> {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  const now = new Date()
  const defaultExpiry =
    wallet === "PROMO"
      ? addMonths(now, 2) // ~60 days
      : addMonths(now, MAIN_EXPIRY_MONTHS)

  const batch = await prisma.creditBatch.create({
    data: {
      userId,
      wallet,
      type,
      initialAmount: amount,
      currentBalance: amount,
      expiresAt: options?.expiresAt ?? defaultExpiry,
      lastActivityAt: now,
    },
  })

  // Create transaction record
  await prisma.creditTransaction.create({
    data: {
      userId,
      batchId: batch.id,
      amount,
      actionType: "ADMIN_GRANT",
      paymentId: options?.paymentId ?? null,
      metadata: (options?.metadata ?? null) as any,
    },
  })

  return batch.id
}

// ─────────────────────────────────────────────
// grantPromoCredits (One-time COMPANY onboarding)
// ─────────────────────────────────────────────

/**
 * Grant one-time PROMO credits to a new COMPANY account.
 * Idempotent: returns false if user already received a PROMO_GRANT.
 *
 * @returns batchId if granted, null if already received
 */
export async function grantPromoCredits(userId: string): Promise<string | null> {
  // Guardrail: check if user already has a PROMO_GRANT batch
  const existing = await prisma.creditBatch.findFirst({
    where: {
      userId,
      type: "PROMO_GRANT",
    },
  })

  if (existing) {
    return null
  }

  const expiresAt = new Date(Date.now() + PROMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  return await addCredits(userId, "PROMO", "PROMO_GRANT", PROMO_GRANT_AMOUNT, { expiresAt })
}

// ─────────────────────────────────────────────
// topUp (Purchase via payment gateway)
// ─────────────────────────────────────────────

/**
 * Top up user's wallet after successful payment.
 * Creates new MAIN/PURCHASED batch AND triggers Premium Reset
 * (extends expiresAt of ALL MAIN batches by +12 months).
 */
export async function topUp(
  userId: string,
  amount: number,
  paymentId: string
): Promise<string> {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  const now = new Date()
  const newExpiry = addMonths(now, TOPUP_RESET_MONTHS)

  return await prisma.$transaction(async (tx) => {
    // 1. Create new PURCHASED batch
    const batch = await tx.creditBatch.create({
      data: {
        userId,
        wallet: "MAIN",
        type: "PURCHASED",
        initialAmount: amount,
        currentBalance: amount,
        expiresAt: newExpiry,
        lastActivityAt: now,
      },
    })

    // 2. Premium Reset: extend ALL active MAIN batches to +12 months
    await tx.creditBatch.updateMany({
      where: {
        userId,
        wallet: "MAIN",
        currentBalance: { gt: 0 },
        id: { not: batch.id }, // skip the one we just created
      },
      data: {
        expiresAt: newExpiry,
        lastActivityAt: now,
      },
    })

    // No CreditTransaction needed — the CreditBatch record (type: PURCHASED)
    // combined with the Payment record provides full audit trail.

    return batch.id
  })
}

// ─────────────────────────────────────────────
// refundToExactBatch
// ─────────────────────────────────────────────

/**
 * Refund credits to a specific batch.
 * Used when video processing fails — returns points to the exact batch they came from.
 * Works even if the batch has expired (refund overrides expiration).
 */
export async function refundToExactBatch(
  userId: string,
  batchId: string,
  amount: number
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  await prisma.$transaction([
    prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        currentBalance: { increment: amount },
      },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        batchId,
        amount,
        actionType: "REFUND",
      },
    }),
  ])
}

// ─────────────────────────────────────────────
// transferTip (Super Like — MAIN-only)
// ─────────────────────────────────────────────

/**
 * Transfer tip (Super Like) from one user to another.
 *
 * Spends from sender's MAIN wallet only (PROMO excluded for tips).
 * Adds EARNED_TIP batch to receiver's MAIN wallet.
 * Amount is determined by PricingConfig SUPER_LIKE key.
 *
 * All operations happen atomically in a single transaction.
 */
export async function transferTip(
  fromUserId: string,
  toUserId: string,
  shortId: string
): Promise<TransferTipResult> {
  if (fromUserId === toUserId) {
    throw new Error("Cannot tip yourself")
  }

  const cost = await getPrice("SUPER_LIKE")

  return await prisma.$transaction(async (tx) => {
    const now = new Date()

    // 1. Fetch sender's MAIN batches only (no PROMO for tips)
    const batches = await tx.$queryRaw<
      Array<{
        id: string
        wallet: WalletType
        type: CreditBatchType
        currentBalance: number
        expiresAt: Date
      }>
    >`
      SELECT id, wallet, type, "currentBalance", "expiresAt"
      FROM "CreditBatch"
      WHERE "userId" = ${fromUserId}
        AND "currentBalance" > 0
        AND "expiresAt" > ${now}
        AND "isFrozen" = false
        AND wallet = 'MAIN'
      ORDER BY
        CASE WHEN type = 'EARNED_TIP' THEN 0 ELSE 1 END,
        "expiresAt" ASC
      FOR UPDATE
    `

    const totalAvailable = batches.reduce((sum, b) => sum + b.currentBalance, 0)
    if (totalAvailable < cost) {
      throw new InsufficientCreditsError(cost, totalAvailable)
    }

    // 2. Deduct from sender (FIFO within MAIN only)
    let remaining = cost
    const senderTransactionIds: string[] = []

    for (const batch of batches) {
      if (remaining <= 0) break

      const toDeduct = Math.min(batch.currentBalance, remaining)
      remaining -= toDeduct

      await tx.creditBatch.update({
        where: { id: batch.id },
        data: {
          currentBalance: { decrement: toDeduct },
          lastActivityAt: now,
        },
      })

      const txRecord = await tx.creditTransaction.create({
        data: {
          userId: fromUserId,
          batchId: batch.id,
          amount: -toDeduct,
          actionType: "SUPER_LIKE",
          shortId,
        },
      })

      senderTransactionIds.push(txRecord.id)
    }

    // Spending reset: extend touched MAIN batches
    const newExpiry = addMonths(now, SPENDING_RESET_MONTHS)
    const affectedBatchIds = batches
      .filter((b) => b.currentBalance > 0 || batches.indexOf(b) < batches.length)
      .slice(0, senderTransactionIds.length)
      .map((b) => b.id)

    if (affectedBatchIds.length > 0) {
      await tx.$executeRaw`
        UPDATE "CreditBatch"
        SET "expiresAt" = ${newExpiry}
        WHERE id = ANY(${affectedBatchIds})
          AND "expiresAt" < ${newExpiry}
      `
    }

    // 3. Add EARNED_TIP to receiver's MAIN wallet
    const receiverBatch = await tx.creditBatch.create({
      data: {
        userId: toUserId,
        wallet: "MAIN",
        type: "EARNED_TIP",
        initialAmount: cost,
        currentBalance: cost,
        expiresAt: addMonths(now, MAIN_EXPIRY_MONTHS),
        lastActivityAt: now,
      },
    })

    const receiverTx = await tx.creditTransaction.create({
      data: {
        userId: toUserId,
        batchId: receiverBatch.id,
        amount: cost,
        actionType: "SUPER_LIKE",
        shortId,
      },
    })

    return {
      success: true,
      cost,
      senderTransactionIds,
      receiverTransactionId: receiverTx.id,
      receiverBatchId: receiverBatch.id,
    }
  })
}

// ─────────────────────────────────────────────
// Admin operations
// ─────────────────────────────────────────────

/**
 * Freeze a batch (e.g., chargeback from P24/Tpay).
 * Frozen batches are excluded from FIFO spending.
 */
export async function freezeBatch(
  batchId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const batch = await prisma.creditBatch.findUniqueOrThrow({
    where: { id: batchId },
    select: { userId: true },
  })

  await prisma.$transaction([
    prisma.creditBatch.update({
      where: { id: batchId },
      data: { isFrozen: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: batch.userId,
        batchId,
        amount: 0,
        actionType: "ADMIN_GRANT",
        metadata: { action: "freeze", adminId, reason },
      },
    }),
  ])
}

/**
 * Unfreeze a previously frozen batch.
 */
export async function unfreezeBatch(
  batchId: string,
  adminId: string
): Promise<void> {
  const batch = await prisma.creditBatch.findUniqueOrThrow({
    where: { id: batchId },
    select: { userId: true },
  })

  await prisma.$transaction([
    prisma.creditBatch.update({
      where: { id: batchId },
      data: { isFrozen: false },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: batch.userId,
        batchId,
        amount: 0,
        actionType: "ADMIN_GRANT",
        metadata: { action: "unfreeze", adminId },
      },
    }),
  ])
}
