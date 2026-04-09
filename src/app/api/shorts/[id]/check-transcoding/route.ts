import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { checkQencodeJobStatus } from "@/lib/qencode"
import { getHlsPublicUrl, getThumbnailPublicUrl } from "@/lib/r2-video"
import { sendProcessingCompleteEmail } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Manual transcoding status check endpoint
 *
 * This endpoint allows checking the status of a Qencode transcoding job
 * directly via the Qencode API. Useful when webhooks don't work (e.g., localhost).
 *
 * If the job is completed, it updates the short to PUBLISHED status
 * (same logic as the webhook handler).
 *
 * POST /api/shorts/[id]/check-transcoding
 */
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get the short with company info
    const short = await prisma.short.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "Short not found" }, { status: 404 })
    }

    // 3. Authorization - user must own the short
    if (short.company.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 4. Validate status - must be PROCESSING
    if (short.status !== "PROCESSING") {
      return NextResponse.json({
        error: "Short is not being processed",
        currentStatus: short.status
      }, { status: 400 })
    }

    // 5. Check if we have a Qencode task ID
    if (!short.qencodeTaskId) {
      return NextResponse.json({
        error: "No Qencode task ID found. Transcoding may not have started yet.",
        hint: "Wait a few seconds and try again, or check the Inngest dashboard."
      }, { status: 400 })
    }

    // 6. Check status via Qencode API
    const qencodeStatus = await checkQencodeJobStatus(short.qencodeTaskId)

    // 7. Handle based on Qencode status
    if (qencodeStatus.status === "completed") {
      // Get the HLS playlist URL
      const outputPath = `shorts/${short.companyId}/${short.id}/playlist.m3u8`
      const hlsPlaylistUrl = getHlsPublicUrl(outputPath)

      // Get duration from output
      const hlsOutput = qencodeStatus.videos?.find(
        (v) => v.type === "hls" || v.url?.includes(".m3u8")
      )
      const duration = hlsOutput?.duration || short.duration

      // Construct thumbnail URL directly
      // Qencode saves thumbnail with the same path as HLS directory (no extension)
      // Example: shorts/{companyId}/{shortId} (without trailing slash)
      const thumbnailUrl = getThumbnailPublicUrl(short.companyId, short.id)

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
          qencodeTaskId: short.qencodeTaskId,
          hlsPlaylistUrl,
          thumbnailUrl,
          duration: duration || 0,
          success: true
        }
      })

      // Send processing complete email
      if (short.company.user.email) {
        try {
          await sendProcessingCompleteEmail({
            to: short.company.user.email,
            shortTitle: short.title,
            shortId: short.id,
            publicUrl: `${APP_URL}/shorts/${short.id}`
          })
        } catch (emailError) {
          console.error("Failed to send processing complete email:", emailError)
        }
      }

      return NextResponse.json({
        success: true,
        status: "PUBLISHED",
        message: "Transcoding completed! Short is now published.",
        hlsPlaylistUrl
      })
    }

    if (qencodeStatus.status === "error") {
      // Update short with error
      await prisma.short.update({
        where: { id: short.id },
        data: {
          processingError: qencodeStatus.error_message || "Transcoding failed",
          retryCount: { increment: 1 }
        }
      })

      return NextResponse.json({
        success: false,
        status: "ERROR",
        message: qencodeStatus.error_message || "Transcoding failed",
        qencodeStatus: qencodeStatus.status
      })
    }

    // Still processing
    return NextResponse.json({
      success: true,
      status: "PROCESSING",
      message: `Transcoding in progress (${qencodeStatus.percent || 0}%)`,
      percent: qencodeStatus.percent || 0,
      qencodeStatus: qencodeStatus.status
    })
  } catch (error) {
    console.error("Check transcoding error:", error)
    return NextResponse.json(
      { error: "Failed to check transcoding status" },
      { status: 500 }
    )
  }
}
