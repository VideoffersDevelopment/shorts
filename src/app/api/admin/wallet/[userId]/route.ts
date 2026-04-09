import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getWalletBalance } from "@/lib/wallet/wallet-service"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/wallet/[userId]
 *
 * Get full wallet details for a user. Requires ADMIN role.
 * Returns balances, batches, and recent transactions.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get wallet balance
    const wallet = await getWalletBalance(userId)

    // Get recent transactions
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        batchId: true,
        amount: true,
        actionType: true,
        shortId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      user,
      wallet,
      transactions,
    })
  } catch (error) {
    console.error("GET /api/admin/wallet/[userId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
