import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateShortMetadataAction } from "@/app/actions/shorts/update"
import { deleteShortAction } from "@/app/actions/shorts/delete"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shorts/[id]
 *
 * Get a single short by ID (owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "COMPANY") {
      return NextResponse.json(
        { error: "Not a company" },
        { status: 403 }
      )
    }

    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!companyProfile) {
      return NextResponse.json(
        { error: "Company profile not found" },
        { status: 404 }
      )
    }

    const short = await prisma.short.findFirst({
      where: {
        id,
        companyId: companyProfile.id
      },
      include: {
        stats: true,
        tags: {
          include: {
            tag: true
          }
        },
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(short)
  } catch (error) {
    console.error("GET /api/shorts/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/shorts/[id]
 *
 * Update short metadata
 * Body: { title?, description?, tags?, ctaLink? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json() as unknown

    const result = await updateShortMetadataAction(id, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === "UNAUTHORIZED" ? 401 : result.code === "SHORT_NOT_FOUND" ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("PATCH /api/shorts/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shorts/[id]
 *
 * Delete a draft short (DRAFT only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const result = await deleteShortAction(id)

    if (!result.success) {
      const statusCode = result.code === "UNAUTHORIZED" ? 401
        : result.code === "SHORT_NOT_FOUND" ? 404
        : result.code === "CANNOT_DELETE_NON_DRAFT" ? 400
        : 500

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusCode }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/shorts/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
