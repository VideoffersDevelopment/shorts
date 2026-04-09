import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import { sendExpiryReminderEmail } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Inngest function: Send Expiry Reminder Emails
 *
 * Runs daily at 9 AM to find all PUBLISHED shorts
 * expiring in 7 days and send reminder emails.
 *
 * Cron: 0 9 * * * (Daily at 9 AM)
 */
export const sendExpiryReminders = inngest.createFunction(
  {
    id: "send-expiry-reminders",
    name: "Send 7-Day Expiry Reminders",
    retries: 2
  },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const now = new Date()

    // Calculate 7 days from now (start and end of that day)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(0, 0, 0, 0)

    const sevenDaysFromNowEnd = new Date(sevenDaysFromNow)
    sevenDaysFromNowEnd.setHours(23, 59, 59, 999)

    // Step 1: Find all shorts expiring in 7 days
    const expiringShorts = await step.run("find-expiring-shorts", async () => {
      return prisma.short.findMany({
        where: {
          status: "PUBLISHED",
          expiresAt: {
            gte: sevenDaysFromNow,
            lte: sevenDaysFromNowEnd
          }
        },
        select: {
          id: true,
          title: true,
          expiresAt: true,
          company: {
            select: {
              id: true,
              companyName: true,
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })

    if (expiringShorts.length === 0) {
      return {
        success: true,
        remindersSent: 0,
        message: "No shorts expiring in 7 days"
      }
    }

    // Step 2: Send reminder emails
    const reminderResults = await step.run("send-reminder-emails", async () => {
      const results: Array<{ shortId: string; email: string; success: boolean; error?: string }> = []

      for (const short of expiringShorts) {
        const renewUrl = `${APP_URL}/panel/shorts/${short.id}?action=renew`
        // Convert back to Date (step.run serializes dates as strings)
        const expiresAtDate = short.expiresAt ? new Date(short.expiresAt) : new Date()

        try {
          await sendExpiryReminderEmail({
            to: short.company.user.email,
            shortTitle: short.title,
            shortId: short.id,
            expiresAt: expiresAtDate,
            renewUrl
          })

          results.push({
            shortId: short.id,
            email: short.company.user.email,
            success: true
          })

          console.log(`[expiry-reminder] Sent reminder for ${short.id} to ${short.company.user.email}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          results.push({
            shortId: short.id,
            email: short.company.user.email,
            success: false,
            error: errorMessage
          })

          console.error(`[expiry-reminder] Failed to send reminder for ${short.id}:`, error)
        }
      }

      return results
    })

    const successCount = reminderResults.filter((r) => r.success).length
    const failedCount = reminderResults.filter((r) => !r.success).length

    return {
      success: true,
      remindersSent: successCount,
      remindersFailed: failedCount,
      details: reminderResults
    }
  }
)
