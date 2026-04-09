import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import {
  validateQencodePayload,
  parseQencodeWebhookPayload,
  type QencodeWebhookPayload
} from "@/lib/qencode"
import { getHlsPublicUrl, getThumbnailPublicUrl } from "@/lib/r2-video"
import { sendProcessingCompleteEmail } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Qencode Webhook Handler
 *
 * Receives transcoding status updates from Qencode:
 * - On completion: Update short with HLS URL, set PUBLISHED status
 * - On error: Increment retry count, optionally refund credit
 *
 * POST /api/webhooks/qencode
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get raw body and parse payload
    const rawBody = await request.text()

    // Parse the webhook payload
    let payload: QencodeWebhookPayload
    try {
      payload = parseQencodeWebhookPayload(rawBody)
    } catch {
      console.error("Qencode webhook: Invalid JSON payload")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Validate payload structure
    // NOTE: Qencode does NOT support HMAC signatures, so we validate:
    // 1. Payload has required fields (task_token, status)
    // 2. task_token exists in our database (below)
    if (!validateQencodePayload(payload)) {
      console.error("Qencode webhook: Invalid payload structure")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { task_token, status } = payload

    // Find the short by Qencode task token
    // This serves as authentication - only valid task tokens from Qencode will match
    const short = await prisma.short.findFirst({
      where: { qencodeTaskId: task_token },
      include: {
        company: {
          include: {
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

    if (!short) {
      console.error(`Qencode webhook: Short not found for task ${task_token}`)
      return NextResponse.json({ error: "Short not found" }, { status: 404 })
    }

    // Handle different statuses
    if (status === "completed") {
      // Extract HLS playlist URL from the output
      const hlsOutput = payload.videos?.find((v) => v.type === "hls" || v.url?.includes(".m3u8"))

      if (!hlsOutput) {
        console.error(`Qencode webhook: No HLS output found for task ${task_token}`)
        return NextResponse.json({ error: "No HLS output" }, { status: 400 })
      }

      // Get the HLS playlist URL
      // Qencode outputs to our R2 bucket, so we construct the public URL
      const outputPath = `shorts/${short.companyId}/${short.id}/master.m3u8`
      const hlsPlaylistUrl = getHlsPublicUrl(outputPath)

      // Construct thumbnail URL directly
      // Qencode saves thumbnail with the same path as HLS directory (no extension)
      // Example: shorts/{companyId}/{shortId} (without trailing slash)
      const thumbnailUrl = getThumbnailPublicUrl(short.companyId, short.id)

      // Get duration from output
      const duration = hlsOutput.duration || short.duration

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Update the short to PUBLISHED status
      await prisma.short.update({
        where: { id: short.id },
        data: {
          hlsPlaylistUrl,
          thumbnailUrl,
          duration: duration ? Math.round(duration) : null,
          status: "PUBLISHED",
          publishedAt: new Date(),
          expiresAt,
          processingError: null
        }
      })

      // Send Inngest event to cleanup raw video
      await inngest.send({
        name: "shorts/transcode.completed",
        data: {
          shortId: short.id,
          qencodeTaskId: task_token,
          hlsPlaylistUrl,
          thumbnailUrl,
          duration: duration || 0,
          success: true
        }
      })

      // Send processing complete email to company owner
      if (short.company.user.email) {
        try {
          await sendProcessingCompleteEmail({
            to: short.company.user.email,
            shortTitle: short.title,
            shortId: short.id,
            publicUrl: `${APP_URL}/shorts/${short.id}`
          })
        } catch (emailError) {
          // Log but don't fail the webhook
          console.error("Failed to send processing complete email:", emailError)
        }
      }

      return NextResponse.json({ success: true, status: "published" })
    }

    if (status === "error") {
      const errorMessage = payload.error_message || "Transcoding failed"

      // Increment retry count
      const updatedShort = await prisma.short.update({
        where: { id: short.id },
        data: {
          retryCount: { increment: 1 },
          processingError: errorMessage
        }
      })

      // Check if we should retry or refund
      if (updatedShort.retryCount < 3) {
        // Retry transcoding
        await inngest.send({
          name: "shorts/transcode.started",
          data: {
            shortId: short.id,
            rawVideoKey: short.rawVideoKey || "",
            userId: short.company.userId
          }
        })

        return NextResponse.json({ success: true, status: "retrying" })
      } else {
        // Max retries reached - refund credit to exact source batch
        const { refundCredit } = await import("@/lib/publication/publication-controller")
        await refundCredit(short.company.userId, short.id)

        // Update short status back to draft
        await prisma.short.update({
          where: { id: short.id },
          data: {
            status: "DRAFT",
            processingError: `Transcoding failed after 3 attempts: ${errorMessage}`
          }
        })

        // Send error notification (TODO: implement error email)
        return NextResponse.json({ success: true, status: "refunded" })
      }
    }

    // For other statuses (encoding, pending), just acknowledge
    return NextResponse.json({ success: true, status: status })
  } catch (error) {
    console.error("Qencode webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
