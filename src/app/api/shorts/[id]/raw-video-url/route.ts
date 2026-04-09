import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRawVideoPublicUrl } from "@/lib/r2-video"

interface RawVideoUrlResponse {
  rawVideoUrl: string
}

interface ErrorResponse {
  error: string
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shorts/[id]/raw-video-url
 *
 * Returns a public URL for accessing the raw (unprocessed) video.
 * Available for DRAFT and PROCESSING status for company owners.
 * Used as video preview before publishing and during QENCODE transcoding.
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse<RawVideoUrlResponse | ErrorResponse>> {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Get user's company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!companyProfile) {
      return NextResponse.json({ error: "No company profile" }, { status: 403 })
    }

    // Get the short and verify ownership
    const short = await prisma.short.findFirst({
      where: {
        id,
        companyId: companyProfile.id
      },
      select: {
        status: true,
        rawVideoKey: true
      }
    })

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 })
    }

    // Only allow raw video access for DRAFT and PROCESSING status
    // (before HLS is available)
    const allowedStatuses = ["DRAFT", "PROCESSING", "PENDING_PAYMENT"]
    if (!allowedStatuses.includes(short.status)) {
      return NextResponse.json(
        { error: "Raw video only available before publishing completes" },
        { status: 403 }
      )
    }

    // Verify raw video exists
    if (!short.rawVideoKey) {
      return NextResponse.json(
        { error: "Raw video not available" },
        { status: 404 }
      )
    }

    // Generate public URL for raw video
    const rawVideoUrl = getRawVideoPublicUrl(short.rawVideoKey)

    return NextResponse.json({ rawVideoUrl })
  } catch (error) {
    console.error("Raw video URL generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate video URL" },
      { status: 500 }
    )
  }
}
