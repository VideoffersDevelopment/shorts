import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import {
  sendCreditExpiry30dEmail,
  sendCreditExpiry7dEmail,
  sendCreditExpiry1dEmail,
  sendReachLossWarningEmail,
  sendMaintenanceFeeNoticeEmail,
} from "@/lib/email"
import { getPrice } from "@/lib/wallet/pricing-service"
import { pointsToApproxPLN } from "@/lib/wallet/wallet-constants"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://videoffers.com"

/**
 * Inngest function: Retention Notifier
 *
 * Daily cron at 9 AM. Sends retention emails for:
 * - MAIN credits expiring in 30/7/1 days
 * - PROMO credits expiring in 7 days (users without MAIN purchases)
 * - Proactive maintenance fee warning (11 months inactivity)
 *
 * Anti-spam: Uses NotificationLog with @@unique([userId, triggerType, batchId])
 * to prevent duplicate notifications.
 *
 * Cron: 0 9 * * * (daily at 9 AM)
 */
export const sendRetentionNotifications = inngest.createFunction(
  {
    id: "send-retention-notifications",
    name: "Send Retention Notifications",
    retries: 1,
  },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const now = new Date()
    let totalSent = 0

    // ─── Step 1: MAIN credits expiring in 29-31 days ───
    const sent30d = await step.run("warn-30d", async () => {
      const from30 = new Date(now)
      from30.setDate(from30.getDate() + 29)
      const to30 = new Date(now)
      to30.setDate(to30.getDate() + 31)

      const batches = await prisma.creditBatch.findMany({
        where: {
          wallet: "MAIN",
          currentBalance: { gt: 0 },
          isFrozen: false,
          expiresAt: { gte: from30, lte: to30 },
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      })

      let sent = 0
      for (const batch of batches) {
        if (!batch.user.email) continue

        const alreadySent = await prisma.notificationLog.findUnique({
          where: {
            userId_triggerType_batchId: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_30D",
              batchId: batch.id,
            },
          },
        })
        if (alreadySent) continue

        try {
          await sendCreditExpiry30dEmail({
            to: batch.user.email,
            points: batch.currentBalance,
            valuePLN: pointsToApproxPLN(batch.currentBalance),
            expiresAt: batch.expiresAt,
            topUpUrl: `${APP_URL}/en/panel/wallet`,
          })

          await prisma.notificationLog.create({
            data: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_30D",
              batchId: batch.id,
              channel: "email",
            },
          })
          sent++
        } catch (err) {
          console.error(`[retention] 30d email failed for ${batch.userId}:`, err)
        }
      }
      return sent
    })
    totalSent += sent30d

    // ─── Step 2: MAIN credits expiring in 6-8 days ───
    const sent7d = await step.run("warn-7d", async () => {
      const from7 = new Date(now)
      from7.setDate(from7.getDate() + 6)
      const to7 = new Date(now)
      to7.setDate(to7.getDate() + 8)

      const batches = await prisma.creditBatch.findMany({
        where: {
          wallet: "MAIN",
          currentBalance: { gt: 0 },
          isFrozen: false,
          expiresAt: { gte: from7, lte: to7 },
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      })

      let sent = 0
      for (const batch of batches) {
        if (!batch.user.email) continue

        const alreadySent = await prisma.notificationLog.findUnique({
          where: {
            userId_triggerType_batchId: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_7D",
              batchId: batch.id,
            },
          },
        })
        if (alreadySent) continue

        try {
          await sendCreditExpiry7dEmail({
            to: batch.user.email,
            points: batch.currentBalance,
            expiresAt: batch.expiresAt,
            topUpUrl: `${APP_URL}/en/panel/wallet`,
          })

          await prisma.notificationLog.create({
            data: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_7D",
              batchId: batch.id,
              channel: "email",
            },
          })
          sent++
        } catch (err) {
          console.error(`[retention] 7d email failed for ${batch.userId}:`, err)
        }
      }
      return sent
    })
    totalSent += sent7d

    // ─── Step 3: MAIN credits expiring in 0-2 days ───
    const sent1d = await step.run("warn-1d", async () => {
      const from1 = new Date(now)
      const to1 = new Date(now)
      to1.setDate(to1.getDate() + 2)

      const batches = await prisma.creditBatch.findMany({
        where: {
          wallet: "MAIN",
          currentBalance: { gt: 0 },
          isFrozen: false,
          expiresAt: { gte: from1, lte: to1 },
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      })

      let sent = 0
      for (const batch of batches) {
        if (!batch.user.email) continue

        const alreadySent = await prisma.notificationLog.findUnique({
          where: {
            userId_triggerType_batchId: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_1D",
              batchId: batch.id,
            },
          },
        })
        if (alreadySent) continue

        try {
          await sendCreditExpiry1dEmail({
            to: batch.user.email,
            points: batch.currentBalance,
            expiresAt: batch.expiresAt,
            topUpUrl: `${APP_URL}/en/panel/wallet`,
          })

          await prisma.notificationLog.create({
            data: {
              userId: batch.userId,
              triggerType: "EXPIRY_WARN_1D",
              batchId: batch.id,
              channel: "email",
            },
          })
          sent++
        } catch (err) {
          console.error(`[retention] 1d email failed for ${batch.userId}:`, err)
        }
      }
      return sent
    })
    totalSent += sent1d

    // ─── Step 4: PROMO expiring in 7 days (users without MAIN purchases) ───
    const sentPromo = await step.run("warn-promo-expiry", async () => {
      const from7 = new Date(now)
      from7.setDate(from7.getDate() + 6)
      const to7 = new Date(now)
      to7.setDate(to7.getDate() + 8)

      const promoBatches = await prisma.creditBatch.findMany({
        where: {
          wallet: "PROMO",
          currentBalance: { gt: 0 },
          expiresAt: { gte: from7, lte: to7 },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              creditBatches: {
                where: { wallet: "MAIN", type: "PURCHASED" },
                take: 1,
                select: { id: true },
              },
            },
          },
        },
      })

      let sent = 0
      for (const batch of promoBatches) {
        if (!batch.user.email) continue
        // Only warn users who haven't purchased MAIN credits
        if (batch.user.creditBatches.length > 0) continue

        const alreadySent = await prisma.notificationLog.findUnique({
          where: {
            userId_triggerType_batchId: {
              userId: batch.userId,
              triggerType: "REACH_LOSS_WARN",
              batchId: batch.id,
            },
          },
        })
        if (alreadySent) continue

        // Get total views for user's shorts
        const viewStats = await prisma.shortStats.aggregate({
          where: {
            short: {
              company: { userId: batch.userId },
            },
          },
          _sum: { views: true },
        })

        try {
          await sendReachLossWarningEmail({
            to: batch.user.email,
            views: viewStats._sum.views || 0,
            promoExpiresAt: batch.expiresAt,
            topUpUrl: `${APP_URL}/en/panel/wallet`,
          })

          await prisma.notificationLog.create({
            data: {
              userId: batch.userId,
              triggerType: "REACH_LOSS_WARN",
              batchId: batch.id,
              channel: "email",
            },
          })
          sent++
        } catch (err) {
          console.error(`[retention] promo-expiry email failed for ${batch.userId}:`, err)
        }
      }
      return sent
    })
    totalSent += sentPromo

    // ─── Step 5: Proactive maintenance fee warning (11+ months inactive) ───
    const sentMaintenance = await step.run("warn-maintenance-fee", async () => {
      const threshold11m = new Date(now)
      threshold11m.setMonth(threshold11m.getMonth() - 11)

      const inactiveUsers = await prisma.$queryRaw<
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
        HAVING MAX("lastActivityAt") < ${threshold11m}
      `

      const fee = await getPrice("MAINTENANCE_FEE")
      let sent = 0

      for (const user of inactiveUsers) {
        const alreadySent = await prisma.notificationLog.findFirst({
          where: {
            userId: user.userId,
            triggerType: "MAINTENANCE_FEE_WARN",
            batchId: null,
          },
        })
        if (alreadySent) continue

        const userData = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { email: true },
        })
        if (!userData?.email) continue

        try {
          await sendMaintenanceFeeNoticeEmail({
            to: userData.email,
            amount: fee,
            remainingBalance: user.totalBalance,
            topUpUrl: `${APP_URL}/en/panel/wallet`,
          })

          await prisma.notificationLog.create({
            data: {
              userId: user.userId,
              triggerType: "MAINTENANCE_FEE_WARN",
              batchId: null,
              channel: "email",
            },
          })
          sent++
        } catch (err) {
          console.error(`[retention] maintenance-fee email failed for ${user.userId}:`, err)
        }
      }
      return sent
    })
    totalSent += sentMaintenance

    return {
      success: true,
      totalSent,
      breakdown: {
        expiry30d: sent30d,
        expiry7d: sent7d,
        expiry1d: sent1d,
        promoReachLoss: sentPromo,
        maintenanceFee: sentMaintenance,
      },
    }
  }
)
