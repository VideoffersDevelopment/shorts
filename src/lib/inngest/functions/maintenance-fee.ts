import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import { spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"
import { InsufficientCreditsError } from "@/lib/wallet/wallet-types"

/**
 * Inngest function: Charge Maintenance Fee
 *
 * Runs monthly on the 1st at 4 AM. Finds all users with MAIN wallet
 * balances who have been inactive for 12+ months (no lastActivityAt
 * on any MAIN batch in that period).
 *
 * Charges the MAINTENANCE_FEE (default 500 pts) from their MAIN wallet.
 * If the user has less than the fee, drains whatever remains.
 *
 * Cron: 0 4 1 * * (1st of month at 4 AM)
 */
export const chargeMaintenanceFee = inngest.createFunction(
  {
    id: "charge-maintenance-fee",
    name: "Charge Maintenance Fee",
    retries: 2,
  },
  { cron: "0 4 1 * *" },
  async ({ step }) => {
    const now = new Date()
    const inactivityThreshold = new Date(now)
    inactivityThreshold.setMonth(inactivityThreshold.getMonth() - 12)

    // Step 1: Find inactive users with MAIN balance
    const inactiveUsers = await step.run("find-inactive-users", async () => {
      // Find distinct userIds who:
      // 1. Have active MAIN batches with balance > 0
      // 2. Their most recent MAIN batch lastActivityAt is older than 12 months
      const users = await prisma.$queryRaw<
        Array<{ userId: string; totalBalance: number; lastActivity: Date }>
      >`
        SELECT
          "userId",
          SUM("currentBalance")::int AS "totalBalance",
          MAX("lastActivityAt") AS "lastActivity"
        FROM "CreditBatch"
        WHERE wallet = 'MAIN'
          AND "currentBalance" > 0
          AND "expiresAt" > ${now}
          AND "isFrozen" = false
        GROUP BY "userId"
        HAVING MAX("lastActivityAt") < ${inactivityThreshold}
      `

      return users
    })

    if (inactiveUsers.length === 0) {
      return {
        success: true,
        chargedCount: 0,
        message: "No inactive users found",
      }
    }

    // Step 2: Get maintenance fee cost from pricing config
    const fee = await step.run("get-fee-amount", async () => {
      return getPrice("MAINTENANCE_FEE")
    })

    // Step 3: Charge each inactive user
    const chargeResults = await step.run("charge-users", async () => {
      const results: {
        userId: string
        charged: number
        partial: boolean
        error?: string
      }[] = []

      for (const user of inactiveUsers) {
        try {
          // Try to charge full fee
          const chargeAmount = Math.min(fee, user.totalBalance)
          await spendCredits(user.userId, chargeAmount, "MAINTENANCE_FEE")

          results.push({
            userId: user.userId,
            charged: chargeAmount,
            partial: chargeAmount < fee,
          })
        } catch (error) {
          if (error instanceof InsufficientCreditsError) {
            // Should not happen since we already check, but handle gracefully
            results.push({
              userId: user.userId,
              charged: 0,
              partial: true,
              error: "Insufficient credits after balance check",
            })
          } else {
            results.push({
              userId: user.userId,
              charged: 0,
              partial: false,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
      }

      return results
    })

    // Step 4: Log results
    await step.run("log-results", async () => {
      const totalCharged = chargeResults.reduce((sum, r) => sum + r.charged, 0)
      const partialCount = chargeResults.filter((r) => r.partial).length
      const errorCount = chargeResults.filter((r) => r.error).length
      console.log(
        `[maintenance-fee] Charged ${chargeResults.length} users, ` +
        `total ${totalCharged} points, ${partialCount} partial, ${errorCount} errors`
      )
    })

    return {
      success: true,
      chargedCount: chargeResults.length,
      totalCharged: chargeResults.reduce((sum, r) => sum + r.charged, 0),
      details: chargeResults,
    }
  }
)
