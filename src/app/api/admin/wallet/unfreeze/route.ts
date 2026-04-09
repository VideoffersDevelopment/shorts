import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { unfreezeBatch } from "@/lib/wallet/wallet-service"

/**
 * POST /api/admin/wallet/unfreeze
 *
 * Unfreeze a previously frozen credit batch. Requires ADMIN role.
 * Body: { batchId: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { batchId } = body

    if (!batchId) {
      return NextResponse.json({ error: "Missing required field: batchId" }, { status: 400 })
    }

    await unfreezeBatch(batchId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }
    console.error("POST /api/admin/wallet/unfreeze error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
