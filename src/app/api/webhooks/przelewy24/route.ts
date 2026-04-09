import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifyPrzelewy24Signature,
  verifyPrzelewy24Transaction,
  type Przelewy24WebhookData
} from "@/lib/payments/przelewy24"
import { addCreditsFromPayment } from "@/lib/publication/publication-controller"

/**
 * POST /api/webhooks/przelewy24
 *
 * Handles Przelewy24 payment notifications
 *
 * Flow:
 * 1. Parse form data
 * 2. Verify signature
 * 3. Find payment by sessionId
 * 4. Verify transaction with P24 API
 * 5. Update payment status
 * 6. If SUCCEEDED: Add credits, trigger publication if linked to short
 * 7. Return 200 OK
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Parse form data (P24 sends application/x-www-form-urlencoded)
    const formData = await request.formData()

    const webhookData: Przelewy24WebhookData = {
      merchantId: parseInt(formData.get("merchantId") as string, 10),
      posId: parseInt(formData.get("posId") as string, 10),
      sessionId: formData.get("sessionId") as string,
      amount: parseInt(formData.get("amount") as string, 10),
      originAmount: parseInt(formData.get("originAmount") as string, 10),
      currency: formData.get("currency") as string,
      orderId: parseInt(formData.get("orderId") as string, 10),
      methodId: parseInt(formData.get("methodId") as string, 10),
      statement: formData.get("statement") as string,
      sign: formData.get("sign") as string
    }

    // 2. Verify signature
    if (!verifyPrzelewy24Signature(webhookData)) {
      console.error("Przelewy24 webhook: Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // 3. Find payment by sessionId
    const payment = await prisma.payment.findFirst({
      where: {
        providerSessionId: webhookData.sessionId,
        provider: "PRZELEWY24"
      }
    })

    if (!payment) {
      console.error(`Przelewy24 webhook: Payment not found for session ${webhookData.sessionId}`)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Skip if already processed
    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      console.log(`Przelewy24 webhook: Payment ${payment.id} already processed`)
      return NextResponse.json({ success: true, status: "already_processed" })
    }

    // 4. Verify transaction with P24 API
    const isValid = await verifyPrzelewy24Transaction(
      webhookData.sessionId,
      webhookData.orderId,
      webhookData.amount,
      webhookData.currency
    )

    // Convert webhookData to plain JSON object for Prisma metadata
    const webhookDataJson = {
      merchantId: webhookData.merchantId,
      posId: webhookData.posId,
      sessionId: webhookData.sessionId,
      amount: webhookData.amount,
      originAmount: webhookData.originAmount,
      currency: webhookData.currency,
      orderId: webhookData.orderId,
      methodId: webhookData.methodId,
      statement: webhookData.statement
    }

    if (!isValid) {
      // Update payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(payment.metadata as Record<string, unknown> || {}),
            error: "Transaction verification failed",
            webhookData: webhookDataJson,
            verifiedAt: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({ success: true, status: "failed" })
    }

    // 5. Update payment status to SUCCEEDED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        providerPaymentId: webhookData.orderId.toString(),
        metadata: {
          ...(payment.metadata as Record<string, unknown> || {}),
          webhookData: webhookDataJson,
          verifiedAt: new Date().toISOString()
        }
      }
    })

    // 6. Add credits to user
    await addCreditsFromPayment(
      payment.userId,
      payment.creditsGranted,
      payment.id
    )

    return NextResponse.json({ success: true, status: "succeeded" })
  } catch (error) {
    console.error("Przelewy24 webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
