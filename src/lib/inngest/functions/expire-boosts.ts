import { inngest } from "../client"
import { prisma } from "@/lib/prisma"

/**
 * Inngest function: Expire Active Boosts
 *
 * Runs hourly to find all ACTIVE boosts that have expired
 * and mark them as COMPLETED.
 *
 * Cron: 0 * * * * (Every hour at :00)
 */
export const expireActiveBoosts = inngest.createFunction(
  {
    id: "expire-active-boosts",
    name: "Expire Active Boosts",
    retries: 2,
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const now = new Date()

    const result = await step.run("expire-boosts", async () => {
      const updated = await prisma.shortBoost.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            lte: now,
          },
        },
        data: {
          status: "COMPLETED",
        },
      })

      return { count: updated.count }
    })

    return {
      success: true,
      completedCount: result.count,
    }
  }
)
