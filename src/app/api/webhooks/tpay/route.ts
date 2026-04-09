import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifyTpaySignature,
  parseTpayStatus,
  type TpayWebhookData
} from "@/lib/payments/tpay"
import { addCreditsFromPayment } from "@/lib/publication/publication-controller"

/**
 * POST /api/webhooks/tpay
 *
 * Handles Tpay payment notifications
 *
 * Flow:
 * 1. Parse form data
 * 2. Verify signature
 * 3. Find payment by sessionId (tr_crc)
 * 4. Update payment status
 * 5. If SUCCEEDED: Add credits, trigger publication if linked to short
 * 6. Return TRUE (Tpay expects "TRUE" response)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Parse form data (Tpay sends application/x-www-form-urlencoded)
    const formData = await request.formData()

    const webhookData: TpayWebhookData = {
      id: formData.get("id") as string,
      tr_id: formData.get("tr_id") as string,
      tr_date: formData.get("tr_date") as string,
      tr_crc: formData.get("tr_crc") as string, // This is our sessionId
      tr_amount: formData.get("tr_amount") as string,
      tr_paid: formData.get("tr_paid") as string,
      tr_desc: formData.get("tr_desc") as string,
      tr_status: formData.get("tr_status") as string,
      tr_error: formData.get("tr_error") as string,
      tr_email: formData.get("tr_email") as string,
      md5sum: formData.get("md5sum") as string,
      test_mode: formData.get("test_mode") as string || undefined
    }

    // 2. Verify signature
    if (!verifyTpaySignature(webhookData)) {
      console.error("Tpay webhook: Invalid signature")
      return new NextResponse("FALSE", { status: 401 })
    }

    // 3. Find payment by sessionId (tr_crc)
    const payment = await prisma.payment.findFirst({
      where: {
        providerSessionId: webhookData.tr_crc,
        provider: "TPAY"
      }
    })

    if (!payment) {
      console.error(`Tpay webhook: Payment not found for session ${webhookData.tr_crc}`)
      return new NextResponse("FALSE", { status: 404 })
    }

    // Skip if already processed
    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      console.log(`Tpay webhook: Payment ${payment.id} already processed`)
      return new NextResponse("TRUE")
    }

    // 4. Parse status
    const status = parseTpayStatus(webhookData.tr_status)

    // Convert webhookData to plain JSON object for Prisma metadata
    const webhookDataJson = {
      id: webhookData.id,
      tr_id: webhookData.tr_id,
      tr_date: webhookData.tr_date,
      tr_crc: webhookData.tr_crc,
      tr_amount: webhookData.tr_amount,
      tr_paid: webhookData.tr_paid,
      tr_desc: webhookData.tr_desc,
      tr_status: webhookData.tr_status,
      tr_error: webhookData.tr_error,
      tr_email: webhookData.tr_email,
      test_mode: webhookData.test_mode
    }

    if (status === "FAILED") {
      // Update payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(payment.metadata as Record<string, unknown> || {}),
            error: webhookData.tr_error || "Payment failed",
            webhookData: webhookDataJson,
            processedAt: new Date().toISOString()
          }
        }
      })

      return new NextResponse("TRUE")
    }

    if (status === "PENDING") {
      // Still pending, just acknowledge
      return new NextResponse("TRUE")
    }

    // 5. Update payment status to SUCCEEDED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        providerPaymentId: webhookData.tr_id,
        metadata: {
          ...(payment.metadata as Record<string, unknown> || {}),
          webhookData: webhookDataJson,
          processedAt: new Date().toISOString()
        }
      }
    })

    // 6. Add credits to user
    await addCreditsFromPayment(
      payment.userId,
      payment.creditsGranted,
      payment.id
    )

    // Tpay expects "TRUE" as response
    return new NextResponse("TRUE")
  } catch (error) {
    console.error("Tpay webhook error:", error)
    return new NextResponse("FALSE", { status: 500 })
  }
}
