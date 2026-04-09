import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { transferTip } from "@/lib/wallet/wallet-service"
import { InsufficientCreditsError } from "@/lib/wallet/wallet-types"

/**
 * POST /api/shorts/[id]/super-like
 *
 * Send a Super Like (tip) for a video. Transfers credits
 * from the sender's MAIN wallet to the video owner's MAIN wallet.
 *
 * Validation:
 * - Short must be PUBLISHED
 * - User cannot tip their own video
 * - Sender must have sufficient MAIN credits
 *
 * Response:
 * - success: true + tip cost
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

    // 2. Find the short and get owner info
    const short = await prisma.short.findFirst({
      where: {
        id: shortId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        status: true,
        company: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found or not published" },
        { status: 404 }
      )
    }

    // 3. Validate: cannot tip yourself
    if (short.company.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot tip your own video" },
        { status: 400 }
      )
    }

    // 4. Transfer tip (spend from sender MAIN → add to receiver MAIN)
    const result = await transferTip(
      session.user.id,
      short.company.userId,
      shortId
    )

    return NextResponse.json({
      success: true,
      cost: result.cost,
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

    console.error("POST /api/shorts/[id]/super-like error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
