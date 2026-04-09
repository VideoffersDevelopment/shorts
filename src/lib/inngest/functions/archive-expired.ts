import { inngest } from "../client"
import { prisma } from "@/lib/prisma"

/**
 * Inngest function: Expire Published Shorts
 *
 * Phase 1 of the video lifecycle.
 * Runs daily at 3 AM to find all PUBLISHED shorts
 * with expired expiresAt dates and mark them as EXPIRED.
 *
 * EXPIRED shorts disappear from public feed/search but
 * their files remain on R2. Owners can extend to restore.
 *
 * Cron: 0 3 * * * (Daily at 3 AM)
 */
export const expirePublishedShorts = inngest.createFunction(
  {
    id: "expire-published-shorts",
    name: "Expire Published Shorts",
    retries: 2,
  },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const now = new Date()

    // Step 1: Find all expired PUBLISHED shorts
    const expiredShorts = await step.run("find-expired-shorts", async () => {
      return prisma.short.findMany({
        where: {
          status: "PUBLISHED",
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          title: true,
          expiresAt: true,
        },
      })
    })

    if (expiredShorts.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        message: "No expired shorts found",
      }
    }

    // Step 2: Mark as EXPIRED (not ARCHIVED — files stay on R2)
    const result = await step.run("expire-shorts", async () => {
      const updated = await prisma.short.updateMany({
        where: {
          id: {
            in: expiredShorts.map((s) => s.id),
          },
          status: "PUBLISHED",
        },
        data: {
          status: "EXPIRED",
        },
      })

      return {
        count: updated.count,
        ids: expiredShorts.map((s) => s.id),
      }
    })

    // Step 3: Log results
    await step.run("log-results", async () => {
      console.log(`[expire-shorts] Expired ${result.count} shorts`)
      expiredShorts.forEach((s) => {
        console.log(`  - ${s.id}: "${s.title}" (expired: ${s.expiresAt})`)
      })
    })

    return {
      success: true,
      expiredCount: result.count,
      expiredIds: result.ids,
    }
  }
)
