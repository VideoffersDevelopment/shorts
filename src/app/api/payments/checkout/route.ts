import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import {
  getPointPackage,
  createPrzelewy24Checkout,
  createTpayCheckout
} from "@/lib/payments"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Checkout request schema — point package purchase
 */
const checkoutRequestSchema = z.object({
  provider: z.enum(["PRZELEWY24", "TPAY"]),
  packageId: z.enum(["starter", "standard", "premium", "business"]),
  returnUrl: z.string().url().optional(),
  locale: z.string().default("pl")
})

/**
 * Response types
 */
interface CheckoutResponse {
  checkoutUrl: string
  paymentId: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/payments/checkout
 *
 * Create a payment checkout session for a point package
 *
 * Request body:
 * - provider: "PRZELEWY24" | "TPAY"
 * - packageId: "starter" | "standard" | "premium" | "business"
 * - returnUrl?: string (optional, defaults to credits page)
 * - locale: string (for redirect URLs)
 *
 * Response:
 * - checkoutUrl: string (redirect user here)
 * - paymentId: string (for status polling)
 */
export async function POST(
  request: Request
): Promise<NextResponse<CheckoutResponse | ErrorResponse>> {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = checkoutRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e) => e.message)
        .join(", ")
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { provider, packageId, returnUrl, locale } = validationResult.data

    // 3. Resolve point package
    const pkg = getPointPackage(packageId)
    if (!pkg) {
      return NextResponse.json(
        { error: "Invalid point package" },
        { status: 400 }
      )
    }

    // 4. Get user email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // 5. Generate unique session ID
    const sessionId = nanoid(32)

    // 6. Create Payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        provider,
        providerPaymentId: sessionId,
        amount: pkg.pricePLN / 100, // Convert grosze to PLN for Decimal field
        currency: "PLN",
        status: "PENDING",
        creditsGranted: pkg.points,
        metadata: {
          packageId,
          points: pkg.points,
          pricePLN: pkg.pricePLN,
          locale,
          createdAt: new Date().toISOString()
        }
      }
    })

    // 7. Build URLs
    const baseReturnUrl = returnUrl || `${APP_URL}/${locale}/panel/credits`
    const finalReturnUrl = `${baseReturnUrl}?paymentId=${payment.id}&status=completed`
    const notifyUrl = `${APP_URL}/api/webhooks/${provider.toLowerCase()}`

    // 8. Create checkout with provider
    let checkoutUrl: string

    const checkoutOptions = {
      sessionId,
      amount: pkg.pricePLN,
      currency: "PLN",
      description: `${pkg.label} - VideoShorts`,
      email: user.email,
      returnUrl: finalReturnUrl,
      notifyUrl
    }

    try {
      if (provider === "PRZELEWY24") {
        checkoutUrl = await createPrzelewy24Checkout(checkoutOptions)
      } else {
        checkoutUrl = await createTpayCheckout(checkoutOptions)
      }
    } catch (providerError) {
      console.error(`${provider} checkout error:`, providerError)

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      })

      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }

    // 9. Update Payment with provider session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerSessionId: sessionId
      }
    })

    // 10. Return checkout URL
    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
