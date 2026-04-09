import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addCreditsFromPayment } from "@/lib/publication/publication-controller"

const simulateSchema = z.object({
  paymentId: z.string().min(1),
  result: z.enum(["success", "failure"])
})

/**
 * POST /api/payments/testing/simulate
 *
 * Simulates a payment gateway response for testing purposes.
 * Only works for payments created with provider OTHER.
 *
 * - result: "success" → marks payment SUCCEEDED, grants credits
 * - result: "failure" → marks payment FAILED
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = simulateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { paymentId, result } = validation.data

    // Find the payment - must belong to current user and be OTHER provider
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        provider: "OTHER",
        status: "PENDING"
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found or already processed" },
        { status: 404 }
      )
    }

    if (result === "success") {
      // Simulate successful payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          metadata: {
            ...(payment.metadata as Record<string, unknown> || {}),
            testingGate: true,
            simulatedResult: "success",
            simulatedAt: new Date().toISOString()
          }
        }
      })

      // Grant credits — same as real webhook handlers
      await addCreditsFromPayment(
        payment.userId,
        payment.creditsGranted,
        payment.id
      )

      return NextResponse.json({
        success: true,
        status: "succeeded",
        creditsGranted: payment.creditsGranted
      })
    } else {
      // Simulate failed payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(payment.metadata as Record<string, unknown> || {}),
            testingGate: true,
            simulatedResult: "failure",
            simulatedAt: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        success: true,
        status: "failed",
        creditsGranted: 0
      })
    }
  } catch (error) {
    console.error("Testing simulate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
