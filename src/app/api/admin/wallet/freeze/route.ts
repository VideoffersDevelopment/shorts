import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { freezeBatch } from "@/lib/wallet/wallet-service"

/**
 * POST /api/admin/wallet/freeze
 *
 * Freeze a credit batch (e.g., chargeback). Requires ADMIN role.
 * Body: { batchId: string, reason: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { batchId, reason } = body

    if (!batchId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: batchId, reason" },
        { status: 400 }
      )
    }

    await freezeBatch(batchId, session.user.id, reason)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }
    console.error("POST /api/admin/wallet/freeze error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
