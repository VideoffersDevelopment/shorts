import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CommentStatus } from "@prisma/client"
import { updateCommentSchema } from "@/lib/validation/interactions"
import { checkToxicity } from "@/lib/services/perspective"
import type { CommentResponse } from "@/lib/types/interactions"

const EDIT_WINDOW_MS = 15 * 60 * 1000

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Edit time expired" },
        { status: 400 }
      )
    }

    const body: unknown = await request.json()
    const parsed = updateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content } = parsed.data

    const { score, flagged } = await checkToxicity(content)

    const statusChange: { status?: CommentStatus } = {}
    if (flagged && comment.status === "APPROVED") {
      statusChange.status = CommentStatus.PENDING
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: {
          content,
          editedAt: new Date(),
          toxicityScore: score,
          ...statusChange,
        },
      })

      if (statusChange.status === "PENDING") {
        await tx.shortStats.update({
          where: { shortId: comment.shortId },
          data: { comments: { decrement: 1 } },
        })
      }
    })

    const updatedComment = await prisma.comment.findUniqueOrThrow({
      where: { id },
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

    return NextResponse.json(mapComment(updatedComment))
  } catch (error) {
    console.error("PATCH /api/comments/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const isOwner = comment.userId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: { status: "DELETED" },
      })

      if (comment.status === "APPROVED") {
        await tx.shortStats.update({
          where: { shortId: comment.shortId },
          data: { comments: { decrement: 1 } },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
