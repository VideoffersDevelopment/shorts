import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"
import { InsufficientCreditsError } from "@/lib/wallet/wallet-types"

const BOOST_DURATION_HOURS = 24

/**
 * POST /api/shorts/[id]/boost
 *
 * Boost a video for 24 hours. Creates a ShortBoost record
 * and charges the user's wallet.
 *
 * Validation:
 * - Short must be PUBLISHED
 * - User must own the short
 * - No active boost already exists
 *
 * Response:
 * - success: true + boost details
 * - error: string on failure
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params

    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Find the short and verify ownership
    const short = await prisma.short.findFirst({
      where: {
        id: shortId,
        company: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        companyId: true,
      },
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found" },
        { status: 404 }
      )
    }

    // 3. Validate status — only PUBLISHED can be boosted
    if (short.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only PUBLISHED shorts can be boosted" },
        { status: 400 }
      )
    }

    // 4. Check for existing active boost
    const existingBoost = await prisma.shortBoost.findFirst({
      where: {
        shortId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    })

    if (existingBoost) {
      return NextResponse.json(
        { error: "Short already has an active boost" },
        { status: 409 }
      )
    }

    // 5. Get boost cost and spend credits
    const cost = await getPrice("BOOST_STD")
    await spendCredits(session.user.id, cost, "BOOST_STD", shortId)

    // 6. Create ShortBoost record
    const now = new Date()
    const expiresAt = new Date(now.getTime() + BOOST_DURATION_HOURS * 60 * 60 * 1000)

    const boost = await prisma.shortBoost.create({
      data: {
        shortId,
        userId: session.user.id,
        type: "STANDARD",
        cost,
        startedAt: now,
        expiresAt,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({
      success: true,
      boostId: boost.id,
      expiresAt: expiresAt.toISOString(),
      cost,
    })
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: error.required,
          available: error.available,
        },
        { status: 402 }
      )
    }

    console.error("POST /api/shorts/[id]/boost error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
