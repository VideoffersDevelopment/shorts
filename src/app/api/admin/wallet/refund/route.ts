import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { refundToExactBatch } from "@/lib/wallet/wallet-service"

/**
 * POST /api/admin/wallet/refund
 *
 * Refund credits to a specific batch. Requires ADMIN role.
 * Body: { userId: string, batchId: string, amount: number, reason: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, batchId, amount, reason } = body

    if (!userId || !batchId || !amount || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: userId, batchId, amount, reason" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    // Verify batch belongs to user
    const batch = await prisma.creditBatch.findFirst({
      where: { id: batchId, userId },
    })

    if (!batch) {
      return NextResponse.json({ error: "Batch not found for this user" }, { status: 404 })
    }

    await refundToExactBatch(userId, batchId, amount)

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "WALLET_REFUND",
        targetType: "CreditBatch",
        targetId: batchId,
        metadata: { userId, amount, reason },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/admin/wallet/refund error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
