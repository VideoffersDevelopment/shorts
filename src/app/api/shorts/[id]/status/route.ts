import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ShortStatus } from "@prisma/client"

interface ShortStatusResponse {
  status: ShortStatus
  processingError?: string
  hlsPlaylistUrl?: string
  estimatedTimeRemaining?: number
}

interface ErrorResponse {
  error: string
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shorts/[id]/status
 *
 * Returns the current processing status of a short.
 * Used for polling on the publishing page.
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ShortStatusResponse | ErrorResponse>> {
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
        processingError: true,
        hlsPlaylistUrl: true,
        createdAt: true
      }
    })

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 })
    }

    // Calculate estimated time remaining for processing
    let estimatedTimeRemaining: number | undefined
    if (short.status === "PROCESSING") {
      // Average transcoding time is about 2-3 minutes
      // We estimate based on time since status changed to PROCESSING
      const processingStartTime = short.createdAt.getTime()
      const elapsedSeconds = Math.floor((Date.now() - processingStartTime) / 1000)
      const estimatedTotal = 180 // 3 minutes average
      estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsedSeconds)
    }

    const response: ShortStatusResponse = {
      status: short.status,
      processingError: short.processingError || undefined,
      hlsPlaylistUrl: short.hlsPlaylistUrl || undefined,
      estimatedTimeRemaining
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Short status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
