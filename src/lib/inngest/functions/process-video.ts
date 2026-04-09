import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import { getVideoDownloadUrl } from "@/lib/r2-video"
import { startQencodeJob } from "@/lib/qencode"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const HLS_BUCKET = process.env.R2_VIDEO_HLS_BUCKET!

/**
 * Inngest function: Start Video Transcoding
 *
 * Triggered when a short is published and needs transcoding.
 * Gets presigned URL for raw video and starts Qencode job.
 *
 * Event: shorts/transcode.started
 */
export const startTranscoding = inngest.createFunction(
  {
    id: "start-transcoding",
    name: "Start Video Transcoding",
    retries: 3
  },
  { event: "shorts/transcode.started" },
  async ({ event, step }) => {
    const { shortId, rawVideoKey, userId } = event.data

    console.log("[Inngest:Transcode] ========== TRANSCODING JOB STARTED ==========")
    console.log("[Inngest:Transcode] ShortId:", shortId)
    console.log("[Inngest:Transcode] RawVideoKey:", rawVideoKey)
    console.log("[Inngest:Transcode] UserId:", userId)
    console.log("[Inngest:Transcode] APP_URL:", APP_URL)
    console.log("[Inngest:Transcode] HLS_BUCKET:", HLS_BUCKET)

    // Step 1: Verify the short exists and is in PROCESSING status
    const short = await step.run("verify-short", async () => {
      console.log("[Inngest:Transcode] Step 1: Verifying short...")
      const shortRecord = await prisma.short.findUnique({
        where: { id: shortId },
        select: {
          id: true,
          status: true,
          rawVideoKey: true,
          companyId: true
        }
      })

      if (!shortRecord) {
        console.error("[Inngest:Transcode] ❌ Short not found:", shortId)
        throw new Error(`Short ${shortId} not found`)
      }

      console.log("[Inngest:Transcode] Short found:", {
        id: shortRecord.id,
        status: shortRecord.status,
        rawVideoKey: shortRecord.rawVideoKey,
        companyId: shortRecord.companyId
      })

      if (shortRecord.status !== "PROCESSING") {
        console.error("[Inngest:Transcode] ❌ Short not in PROCESSING status:", shortRecord.status)
        throw new Error(
          `Short ${shortId} is not in PROCESSING status (current: ${shortRecord.status})`
        )
      }

      console.log("[Inngest:Transcode] ✅ Step 1 completed - short verified")
      return shortRecord
    })

    // Step 2: Get presigned download URL for raw video
    const downloadUrl = await step.run("get-download-url", async () => {
      console.log("[Inngest:Transcode] Step 2: Getting download URL...")
      const key = rawVideoKey || short.rawVideoKey
      if (!key) {
        console.error("[Inngest:Transcode] ❌ No raw video key!")
        throw new Error(`No raw video key for short ${shortId}`)
      }

      console.log("[Inngest:Transcode] Raw video key:", key)
      console.log("[Inngest:Transcode] R2_ENDPOINT:", process.env.R2_ENDPOINT)

      const url = await getVideoDownloadUrl({
        key,
        expiresIn: 3600 // 1 hour
      })

      console.log("[Inngest:Transcode] ✅ Step 2 completed - download URL generated")
      console.log("[Inngest:Transcode] Download URL (first 100 chars):", url.substring(0, 100) + "...")
      return url
    })

    // Step 3: Start Qencode transcoding job
    const qencodeResult = await step.run("start-qencode-job", async () => {
      console.log("[Inngest:Transcode] Step 3: Starting Qencode job...")
      const outputPath = `shorts/${short.companyId}/${shortId}`
      const webhookUrl = `${APP_URL}/api/webhooks/qencode`

      console.log("[Inngest:Transcode] Output path:", outputPath)
      console.log("[Inngest:Transcode] Webhook URL:", webhookUrl)
      console.log("[Inngest:Transcode] QENCODE_API_KEY set:", !!process.env.QENCODE_API_KEY)

      try {
        const result = await startQencodeJob({
          inputUrl: downloadUrl,
          outputBucket: HLS_BUCKET,
          outputPath,
          webhookUrl
        })
        console.log("[Inngest:Transcode] ✅ Step 3 completed - Qencode job started")
        console.log("[Inngest:Transcode] Task token:", result.taskToken)
        console.log("[Inngest:Transcode] Status URL:", result.statusUrl)
        return result
      } catch (qencodeError) {
        console.error("[Inngest:Transcode] ❌ Qencode job failed:", qencodeError)
        throw qencodeError
      }
    })

    // Step 4: Update short with Qencode task ID
    await step.run("update-short-task-id", async () => {
      console.log("[Inngest:Transcode] Step 4: Updating short with task ID...")
      await prisma.short.update({
        where: { id: shortId },
        data: {
          qencodeTaskId: qencodeResult.taskToken
        }
      })
      console.log("[Inngest:Transcode] ✅ Step 4 completed - task ID saved")
    })

    console.log("[Inngest:Transcode] ========== TRANSCODING JOB COMPLETED ==========")

    return {
      success: true,
      shortId,
      taskToken: qencodeResult.taskToken,
      statusUrl: qencodeResult.statusUrl
    }
  }
)
