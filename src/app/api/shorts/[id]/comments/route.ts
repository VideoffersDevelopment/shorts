import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { commentLimiter } from "@/lib/utils/rate-limiter"
import {
  createCommentSchema,
  commentQuerySchema,
} from "@/lib/validation/interactions"
import { checkToxicity } from "@/lib/services/perspective"
import type {
  CommentResponse,
  CommentsListResponse,
} from "@/lib/types/interactions"

interface CommentWithUser {
  id: string
  userId: string
  content: string
  status: string
  parentId: string | null
  createdAt: Date
  editedAt: Date | null
  user: {
    id: string
    profile: {
      displayName: string | null
      avatar: string | null
    } | null
  }
  replies?: CommentWithUser[]
}

function mapComment(comment: CommentWithUser): CommentResponse {
  return {
    id: comment.id,
    userId: comment.userId,
    content: comment.content,
    status: comment.status as CommentResponse["status"],
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    user: {
      id: comment.user.id,
      displayName: comment.user.profile?.displayName ?? null,
      avatar: comment.user.profile?.avatar ?? null,
    },
    replies: (comment.replies ?? []).map(mapComment),
  }
}

const userSelect = {
  select: {
    id: true,
    profile: { select: { displayName: true, avatar: true } },
  },
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = commentQuerySchema.safeParse(searchParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { sort, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const whereClause = {
      shortId,
      parentId: null,
      status: "APPROVED" as const,
    }

    const [totalCount, comments] = await Promise.all([
      prisma.comment.count({ where: whereClause }),
      prisma.comment.findMany({
        where: whereClause,
        orderBy:
          sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: userSelect,
          replies: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "asc" },
            include: {
              user: userSelect,
            },
          },
        },
      }),
    ])

    const response: CommentsListResponse = {
      comments: comments.map(mapComment),
      totalCount,
      page,
      hasMore: skip + comments.length < totalCount,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("GET /api/shorts/[id]/comments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const rateLimitResult = commentLimiter.check(userId)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many comments. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    const body: unknown = await request.json()
    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content, parentId } = parsed.data

    const short = await prisma.short.findUnique({
      where: { id: shortId },
      select: { id: true, status: true },
    })

    if (!short || short.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Short not found" }, { status: 404 })
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (
        !parentComment ||
        parentComment.status !== "APPROVED" ||
        parentComment.shortId !== shortId ||
        parentComment.parentId !== null
      ) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        )
      }
    }

    const { score, flagged } = await checkToxicity(content)
    const status = flagged ? "PENDING" : "APPROVED"

    const createdComment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          userId,
          shortId,
          parentId: parentId ?? null,
          content,
          status,
          toxicityScore: score,
        },
      })

      if (status === "APPROVED") {
        await tx.shortStats.upsert({
          where: { shortId },
          update: { comments: { increment: 1 } },
          create: { shortId, comments: 1 },
        })
      }

      return comment
    })

    const commentWithUser = await prisma.comment.findUniqueOrThrow({
      where: { id: createdComment.id },
      include: {
        user: userSelect,
        replies: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "asc" },
          include: {
            user: userSelect,
          },
        },
      },
    })

    return NextResponse.json(mapComment(commentWithUser), { status: 201 })
  } catch (error) {
    console.error("POST /api/shorts/[id]/comments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
