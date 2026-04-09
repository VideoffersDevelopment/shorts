import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import { deleteVideoObject } from "@/lib/r2-video"

/**
 * Inngest function: Cleanup Raw Video
 *
 * Triggered after transcoding is completed successfully.
 * Deletes the raw video from R2 to save storage.
 *
 * Event: shorts/transcode.completed
 */
export const cleanupRawVideo = inngest.createFunction(
  {
    id: "cleanup-raw-video",
    name: "Cleanup Raw Video from R2",
    retries: 3
  },
  { event: "shorts/transcode.completed" },
  async ({ event, step }) => {
    const { shortId, success } = event.data

    // Only cleanup if transcoding was successful
    if (!success) {
      return {
        success: false,
        message: "Skipping cleanup - transcoding failed"
      }
    }

    // Step 1: Get the raw video key from the short
    const short = await step.run("get-short", async () => {
      return prisma.short.findUnique({
        where: { id: shortId },
        select: {
          id: true,
          rawVideoKey: true,
          status: true
        }
      })
    })

    if (!short) {
      return {
        success: false,
        message: `Short ${shortId} not found`
      }
    }

    if (!short.rawVideoKey) {
      return {
        success: true,
        message: "No raw video key to cleanup"
      }
    }

    // Step 2: Delete raw video from R2
    await step.run("delete-raw-video", async () => {
      await deleteVideoObject(short.rawVideoKey!)
    })

    // Step 3: Clear the rawVideoKey from the database
    await step.run("clear-raw-video-key", async () => {
      await prisma.short.update({
        where: { id: shortId },
        data: {
          rawVideoKey: null
        }
      })
    })

    return {
      success: true,
      shortId,
      deletedKey: short.rawVideoKey
    }
  }
)
