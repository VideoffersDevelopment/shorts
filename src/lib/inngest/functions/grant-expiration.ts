import { inngest } from "../client"
import { prisma } from "@/lib/prisma"

/**
 * Inngest function: Expire PROMO Grant Batches
 *
 * Runs daily at 2 AM. Finds all PROMO batches that have passed
 * their expiresAt date but still have currentBalance > 0.
 * Zeros out the balance and creates a PROMO_EXPIRED transaction
 * for audit trail.
 *
 * PROMO credits have a 60-day lifespan and are non-renewable.
 *
 * Cron: 0 2 * * * (daily at 2 AM)
 */
export const expirePromoGrants = inngest.createFunction(
  {
    id: "expire-promo-grants",
    name: "Expire PROMO Grant Batches",
    retries: 2,
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const now = new Date()

    // Step 1: Find expired PROMO batches with remaining balance
    const expiredBatches = await step.run("find-expired-promo", async () => {
      return prisma.creditBatch.findMany({
        where: {
          wallet: "PROMO",
          expiresAt: { lte: now },
          currentBalance: { gt: 0 },
        },
        select: {
          id: true,
          userId: true,
          currentBalance: true,
          expiresAt: true,
        },
      })
    })

    if (expiredBatches.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        message: "No expired PROMO batches found",
      }
    }

    // Step 2: Zero out each batch and create transaction records
    const results = await step.run("zero-expired-batches", async () => {
      const processed: { batchId: string; userId: string; amount: number }[] = []

      for (const batch of expiredBatches) {
        await prisma.$transaction([
          prisma.creditBatch.update({
            where: { id: batch.id },
            data: { currentBalance: 0 },
          }),
          prisma.creditTransaction.create({
            data: {
              userId: batch.userId,
              batchId: batch.id,
              amount: -batch.currentBalance,
              actionType: "PROMO_EXPIRED",
            },
          }),
        ])

        processed.push({
          batchId: batch.id,
          userId: batch.userId,
          amount: batch.currentBalance,
        })
      }

      return processed
    })

    // Step 3: Log results
    await step.run("log-results", async () => {
      const totalExpired = results.reduce((sum, r) => sum + r.amount, 0)
      console.log(
        `[expire-promo] Expired ${results.length} batches, total ${totalExpired} points zeroed`
      )
    })

    return {
      success: true,
      expiredCount: results.length,
      totalPointsExpired: results.reduce((sum, r) => sum + r.amount, 0),
      details: results,
    }
  }
)
