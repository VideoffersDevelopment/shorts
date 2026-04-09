import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"
import { InsufficientCreditsError } from "@/lib/wallet/wallet-types"
import type { PricingKey } from "@/lib/wallet/wallet-types"

/**
 * Extension period options with their pricing keys and durations in days
 */
const EXTENSION_PERIODS = {
  "30D": { pricingKey: "EXTENSION_30D" as PricingKey, days: 30 },
  "3M": { pricingKey: "EXTENSION_3M" as PricingKey, days: 90 },
  "6M": { pricingKey: "EXTENSION_6M" as PricingKey, days: 180 },
  "12M": { pricingKey: "EXTENSION_12M" as PricingKey, days: 365 },
} as const

type ExtensionPeriod = keyof typeof EXTENSION_PERIODS

const extendSchema = z.object({
  period: z.enum(["30D", "3M", "6M", "12M"]),
})

/**
 * POST /api/shorts/[id]/extend
 *
 * Extend a video's publication period.
 * Works for both PUBLISHED (extend before expiry) and EXPIRED (restore + extend) shorts.
 *
 * Request body:
 * - period: "30D" | "3M" | "6M" | "12M"
 *
 * Response:
 * - success: true + new expiresAt
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

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = extendSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e) => e.message)
        .join(", ")
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { period } = validationResult.data

    // 3. Find the short and verify ownership
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
        expiresAt: true,
        companyId: true,
      },
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found" },
        { status: 404 }
      )
    }

    // 4. Validate status — only PUBLISHED or EXPIRED can be extended
    if (short.status !== "PUBLISHED" && short.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "Only PUBLISHED or EXPIRED shorts can be extended" },
        { status: 400 }
      )
    }

    // 5. Get extension cost from pricing
    const extensionConfig = EXTENSION_PERIODS[period as ExtensionPeriod]
    const cost = await getPrice(extensionConfig.pricingKey)

    // 6. Spend credits
    await spendCredits(session.user.id, cost, "EXTENSION", shortId)

    // 7. Calculate new expiry
    // For PUBLISHED: extend from current expiresAt (or now if somehow null)
    // For EXPIRED: extend from now (restoring the video)
    const baseDate = short.status === "PUBLISHED" && short.expiresAt
      ? new Date(short.expiresAt)
      : new Date()
    const newExpiresAt = new Date(baseDate)
    newExpiresAt.setDate(newExpiresAt.getDate() + extensionConfig.days)

    // 8. Update short — set new expiry and restore to PUBLISHED if EXPIRED
    await prisma.short.update({
      where: { id: shortId },
      data: {
        expiresAt: newExpiresAt,
        status: "PUBLISHED",
      },
    })

    return NextResponse.json({
      success: true,
      expiresAt: newExpiresAt.toISOString(),
      period,
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

    console.error("POST /api/shorts/[id]/extend error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
