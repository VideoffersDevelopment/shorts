import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidatePricingCache, getAllPricing } from "@/lib/wallet/pricing-service"

/**
 * GET /api/admin/pricing
 *
 * List all pricing configs. Requires ADMIN role.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const pricing = await getAllPricing()
    return NextResponse.json({ pricing })
  } catch (error) {
    console.error("GET /api/admin/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/pricing
 *
 * Update a pricing config entry. Requires ADMIN role.
 * Body: { key: string, cost: number, enabled?: boolean }
 *
 * Invalidates the pricing cache after update.
 * Logs action to AuditLog.
 */
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { key, cost, enabled } = body

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 })
    }

    if (cost !== undefined && (typeof cost !== "number" || cost < 0)) {
      return NextResponse.json({ error: "Cost must be a non-negative number" }, { status: 400 })
    }

    // Find existing config
    const existing = await prisma.pricingConfig.findUnique({
      where: { key },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pricing config not found" }, { status: 404 })
    }

    // Build update data
    const updateData: { cost?: number; enabled?: boolean } = {}
    if (cost !== undefined) updateData.cost = cost
    if (enabled !== undefined) updateData.enabled = enabled

    // Update pricing and log
    const [updated] = await prisma.$transaction([
      prisma.pricingConfig.update({
        where: { key },
        data: updateData,
      }),
      prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "PRICING_UPDATE",
          targetType: "PricingConfig",
          targetId: key,
          metadata: {
            previousCost: existing.cost,
            newCost: cost ?? existing.cost,
            previousEnabled: existing.enabled,
            newEnabled: enabled ?? existing.enabled,
          },
        },
      }),
    ])

    // Invalidate cache so new prices take effect immediately
    invalidatePricingCache()

    return NextResponse.json({ success: true, pricing: updated })
  } catch (error) {
    console.error("PUT /api/admin/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
