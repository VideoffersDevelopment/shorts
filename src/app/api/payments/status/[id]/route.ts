import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { PaymentStatus } from "@prisma/client"

/**
 * Payment status response
 */
interface PaymentStatusResponse {
  status: PaymentStatus
  credits?: number
  shortId?: string | null
  shortStatus?: string
  error?: string
}

interface ErrorResponse {
  error: string
}

/**
 * GET /api/payments/status/[id]
 *
 * Check payment status for polling during checkout flow
 *
 * Returns:
 * - status: PaymentStatus (PENDING | SUCCEEDED | FAILED)
 * - credits: number (if SUCCEEDED)
 * - shortId: string (if linked to a short)
 * - shortStatus: string (if linked to a short)
 * - error: string (if FAILED)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PaymentStatusResponse | ErrorResponse>> {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get payment ID from params
    const { id: paymentId } = await params

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 })
    }

    // 3. Fetch payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // 4. Verify ownership
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 5. Build response
    const response: PaymentStatusResponse = {
      status: payment.status
    }

    if (payment.status === "SUCCEEDED") {
      response.credits = payment.creditsGranted
    }

    // Extract shortId and shortStatus from metadata if available
    const metadata = payment.metadata as Record<string, unknown> | null
    if (metadata?.shortId) {
      response.shortId = metadata.shortId as string
      response.shortStatus = metadata.shortStatus as string | undefined
    }

    if (payment.status === "FAILED") {
      response.error = (metadata?.error as string) || "Payment failed"
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Payment status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
