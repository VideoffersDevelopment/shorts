import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { trackEvent, type StatsEventType } from "@/lib/shorts/stats"
import { prisma } from "@/lib/prisma"

/**
 * Stats tracking API endpoint
 *
 * POST /api/shorts/[id]/track
 * Body: { event: 'cta_click' | 'like' | 'share' }
 *
 * This is a public endpoint (no auth required) for tracking
 * user interactions with shorts.
 */

const trackEventSchema = z.object({
  event: z.enum(["cta_click", "like", "share"])
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const shortId = resolvedParams.id

    // Parse and validate body
    const body = await request.json()
    const result = trackEventSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      )
    }

    // Verify short exists and is accessible
    const short = await prisma.short.findUnique({
      where: { id: shortId },
      select: {
        id: true,
        status: true
      }
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found" },
        { status: 404 }
      )
    }

    // Only allow tracking for published or archived shorts
    if (short.status !== "PUBLISHED" && short.status !== "ARCHIVED") {
      return NextResponse.json(
        { error: "Short not accessible" },
        { status: 403 }
      )
    }

    // Track the event (fire and forget, but we wait for consistency)
    await trackEvent(shortId, result.data.event as StatsEventType)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[track] Error tracking event:", error)
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    )
  }
}
