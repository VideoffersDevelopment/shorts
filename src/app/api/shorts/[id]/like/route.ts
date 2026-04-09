import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reactionLimiter } from "@/lib/utils/rate-limiter"
import { likeSchema } from "@/lib/validation/interactions"
import type { LikeResponse } from "@/lib/types/interactions"
import { LikeType } from "@prisma/client"

/**
 * Build a LikeResponse from grouped counts and optional user reaction.
 * DISLIKE counts are excluded from the response (private).
 */
function buildLikeResponse(
  userLike: { type: LikeType } | null,
  groupedCounts: { type: LikeType; _count: number }[]
): LikeResponse {
  const counts: Partial<Record<LikeType, number>> = {}
  let totalLikes = 0

  for (const group of groupedCounts) {
    if (group.type === LikeType.DISLIKE) continue
    counts[group.type] = group._count
    if (group.type === LikeType.LIKE) {
      totalLikes = group._count
    }
  }

  return {
    liked: userLike !== null,
    type: userLike?.type ?? null,
    counts,
    totalLikes,
  }
}

/**
 * POST /api/shorts/[id]/like
 *
 * Toggle a reaction (like, dislike, emoji) on a short.
 * - Same type as existing reaction: removes it (toggle off)
 * - Different type: switches to new type
 * - No existing reaction: creates one
 *
 * Only LIKE type affects ShortStats.likes counter.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params

    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Rate limit
    const rateResult = reactionLimiter.check(userId)
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rateResult.retryAfter },
        { status: 429 }
      )
    }

    // 3. Parse and validate body
    const body: unknown = await request.json()
    const parsed = likeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { type: newType } = parsed.data

    // 4. Check short exists and is published
    const short = await prisma.short.findFirst({
      where: { id: shortId, status: "PUBLISHED" },
      select: { id: true },
    })

    if (!short) {
      return NextResponse.json(
        { error: "Short not found or not published" },
        { status: 404 }
      )
    }

    // 5. Transaction: toggle/switch/create reaction
    await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_shortId: { userId, shortId } },
      })

      if (existing) {
        if (existing.type === newType) {
          // Same type → toggle off (delete)
          await tx.like.delete({
            where: { userId_shortId: { userId, shortId } },
          })

          if (existing.type === LikeType.LIKE) {
            await tx.shortStats.upsert({
              where: { shortId },
              update: { likes: { decrement: 1 } },
              create: { shortId, likes: 0 },
            })
          }
        } else {
          // Different type → switch
          await tx.like.update({
            where: { userId_shortId: { userId, shortId } },
            data: { type: newType },
          })

          // Adjust ShortStats.likes counter
          if (existing.type === LikeType.LIKE) {
            // Was LIKE, switching away → decrement
            await tx.shortStats.upsert({
              where: { shortId },
              update: { likes: { decrement: 1 } },
              create: { shortId, likes: 0 },
            })
          }

          if (newType === LikeType.LIKE) {
            // Switching to LIKE → increment
            await tx.shortStats.upsert({
              where: { shortId },
              update: { likes: { increment: 1 } },
              create: { shortId, likes: 1 },
            })
          }
        }
      } else {
        // No existing → create
        await tx.like.create({
          data: { userId, shortId, type: newType },
        })

        if (newType === LikeType.LIKE) {
          await tx.shortStats.upsert({
            where: { shortId },
            update: { likes: { increment: 1 } },
            create: { shortId, likes: 1 },
          })
        }
      }
    })

    // 6. Get fresh counts
    const [userLike, groupedCounts] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_shortId: { userId, shortId } },
        select: { type: true },
      }),
      prisma.like.groupBy({
        by: ["type"],
        where: { shortId },
        _count: true,
      }),
    ])

    // 7. Return response
    const response: LikeResponse = buildLikeResponse(
      userLike,
      groupedCounts.map((g) => ({ type: g.type, _count: g._count }))
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("POST /api/shorts/[id]/like error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shorts/[id]/like
 *
 * Get the current user's reaction status and public reaction counts.
 * Auth is optional — unauthenticated users get counts only.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params

    // 1. Optional auth
    const session = await auth()
    const userId = session?.user?.id ?? null

    // 2. Get user's reaction (if authenticated) and counts in parallel
    const [userLike, groupedCounts] = await Promise.all([
      userId
        ? prisma.like.findUnique({
            where: { userId_shortId: { userId, shortId } },
            select: { type: true },
          })
        : Promise.resolve(null),
      prisma.like.groupBy({
        by: ["type"],
        where: { shortId },
        _count: true,
      }),
    ])

    // 3. Return response
    const response: LikeResponse = buildLikeResponse(
      userLike,
      groupedCounts.map((g) => ({ type: g.type, _count: g._count }))
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("GET /api/shorts/[id]/like error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
