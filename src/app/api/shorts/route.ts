import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { ShortStatus } from "@prisma/client"

interface ShortsQueryParams {
  status?: ShortStatus
  search?: string
  page?: number
  limit?: number
}

/**
 * GET /api/shorts
 *
 * Query shorts for the authenticated user's company
 *
 * Query params:
 * - status: Filter by status (DRAFT, PUBLISHED, ARCHIVED)
 * - search: Search by title
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const params: ShortsQueryParams = {
      status: searchParams.get("status") as ShortStatus | undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page") as string, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit") as string, 10) : 20
    }

    // Validate status
    const validStatuses: ShortStatus[] = ["DRAFT", "PENDING_PAYMENT", "PROCESSING", "PUBLISHED", "ARCHIVED"]
    if (params.status && !validStatuses.includes(params.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Build where clause
    const where = {
      companyId: companyProfile.id,
      status: params.status
        ? params.status
        : { not: "DELETED" as ShortStatus },
      ...(params.search && {
        title: {
          contains: params.search,
          mode: "insensitive" as const
        }
      })
    }

    // Get total count
    const total = await prisma.short.count({ where })

    // Get shorts with pagination
    const shorts = await prisma.short.findMany({
      where,
      include: {
        stats: true,
        tags: {
          include: {
            tag: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: ((params.page ?? 1) - 1) * (params.limit ?? 20),
      take: params.limit ?? 20
    })

    return NextResponse.json({
      shorts,
      total,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      totalPages: Math.ceil(total / (params.limit ?? 20))
    })
  } catch (error) {
    console.error("GET /api/shorts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
