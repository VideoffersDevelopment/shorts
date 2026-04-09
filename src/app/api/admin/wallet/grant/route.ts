import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addCredits } from "@/lib/wallet/wallet-service"
import type { WalletType, CreditBatchType } from "@prisma/client"

/**
 * POST /api/admin/wallet/grant
 *
 * Grant bonus credits to a user. Requires ADMIN role.
 * Body: { userId: string, wallet: "PROMO"|"MAIN", amount: number, reason: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, wallet, amount, reason } = body

    if (!userId || !wallet || !amount || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: userId, wallet, amount, reason" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    if (wallet !== "PROMO" && wallet !== "MAIN") {
      return NextResponse.json({ error: "Wallet must be PROMO or MAIN" }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const batchId = await addCredits(
      userId,
      wallet as WalletType,
      "BONUS" as CreditBatchType,
      amount,
      { metadata: { action: "admin_grant", adminId: session.user.id, reason } }
    )

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "WALLET_GRANT",
        targetType: "CreditBatch",
        targetId: batchId,
        metadata: { userId, wallet, amount, reason },
      },
    })

    return NextResponse.json({ success: true, batchId })
  } catch (error) {
    console.error("POST /api/admin/wallet/grant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
