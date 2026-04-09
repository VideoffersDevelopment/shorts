import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"
import { InsufficientCreditsError } from "@/lib/wallet/wallet-types"
import type { PricingKey } from "@/lib/wallet/wallet-types"

/**
 * Allowed spending actions that map to PricingConfig keys.
 * PUBLICATION is handled by publish action, not this endpoint.
 */
const SPENDABLE_ACTIONS = [
  "BOOST_STD",
  "EXTENSION_30D",
  "EXTENSION_3M",
  "EXTENSION_6M",
  "EXTENSION_12M",
  "SUPER_LIKE",
] as const

type SpendableAction = typeof SPENDABLE_ACTIONS[number]

/**
 * Map spend actions to CreditActionType enum values.
 * Extensions all map to EXTENSION, boosts to BOOST_STD, etc.
 */
const ACTION_TYPE_MAP: Record<SpendableAction, string> = {
  BOOST_STD: "BOOST_STD",
  EXTENSION_30D: "EXTENSION",
  EXTENSION_3M: "EXTENSION",
  EXTENSION_6M: "EXTENSION",
  EXTENSION_12M: "EXTENSION",
  SUPER_LIKE: "SUPER_LIKE",
}

const spendSchema = z.object({
  action: z.enum(SPENDABLE_ACTIONS),
  shortId: z.string().optional(),
})

/**
 * POST /api/wallet/spend
 *
 * Generic wallet spend endpoint for boosts, extensions, super likes, etc.
 * Publication is handled separately by the publish action.
 *
 * Request body:
 * - action: SpendableAction (e.g., "BOOST_STD", "EXTENSION_30D")
 * - shortId?: string (required for video-related actions)
 *
 * Response:
 * - success: true + spend result details
 * - error: string on failure
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = spendSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e) => e.message)
        .join(", ")
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { action, shortId } = validationResult.data

    // 3. Get price for the action
    const cost = await getPrice(action as PricingKey)

    // 4. Map to CreditActionType
    const actionType = ACTION_TYPE_MAP[action] as Parameters<typeof spendCredits>[2]

    // 5. Spend credits
    const result = await spendCredits(
      session.user.id,
      cost,
      actionType,
      shortId
    )

    return NextResponse.json({
      success: true,
      totalSpent: result.totalSpent,
      transactionIds: result.transactionIds,
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

    console.error("POST /api/wallet/spend error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
