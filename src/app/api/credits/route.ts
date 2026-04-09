import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getWalletBalance } from "@/lib/wallet/wallet-service"

/**
 * GET /api/credits
 *
 * Get user's credit balance and transaction history
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's credit balance
    const wallet = await getWalletBalance(session.user.id)

    // Get transaction history ordered by createdAt DESC
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      include: {
        short: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculate running balance for each transaction
    let runningBalance = wallet.total
    const transactionsWithBalance = transactions.map((tx) => {
      const balanceAfter = runningBalance
      runningBalance -= tx.amount // Go backwards to get balance before
      return {
        ...tx,
        balanceAfter
      }
    })

    return NextResponse.json({
      credits: wallet.total,
      promo: wallet.promo,
      main: wallet.main,
      transactions: transactionsWithBalance
    })
  } catch (error) {
    console.error("GET /api/credits error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
