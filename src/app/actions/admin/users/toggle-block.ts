"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"

const toggleBlockSchema = z.object({
  userId: z.string().cuid(),
  block: z.boolean()
})

export async function toggleBlockAction(
  userId: string,
  block: boolean
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Prevent blocking self
  if (session.user.id === userId) {
    return createError("admin.errors.cannotBlockSelf", "CANNOT_BLOCK_SELF")
  }

  // Validate input
  const parsed = toggleBlockSchema.safeParse({ userId, block })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Check user exists and get their company profile if any
      const existing = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: {
          id: true,
          isBlocked: true,
          companyProfile: {
            select: { id: true, status: true }
          }
        }
      })

      if (!existing) {
        throw new Error("USER_NOT_FOUND")
      }

      // Update user blocked status
      await tx.user.update({
        where: { id: parsed.data.userId },
        data: { isBlocked: parsed.data.block }
      })

      // If blocking user, invalidate all their sessions for immediate effect
      if (parsed.data.block) {
        await tx.session.deleteMany({
          where: { userId: parsed.data.userId }
        })
      }

      // Sync company profile status with user blocked status
      if (existing.companyProfile) {
        if (parsed.data.block) {
          // Blocking user -> suspend company
          await tx.companyProfile.update({
            where: { id: existing.companyProfile.id },
            data: { status: "SUSPENDED" }
          })
        } else {
          // Unblocking user -> reactivate company (set to ACTIVE)
          await tx.companyProfile.update({
            where: { id: existing.companyProfile.id },
            data: { status: "ACTIVE" }
          })
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: parsed.data.block ? "BLOCK_USER" : "UNBLOCK_USER",
          targetType: "USER",
          targetId: parsed.data.userId,
          metadata: {
            previousBlocked: existing.isBlocked,
            newBlocked: parsed.data.block,
            companyProfileId: existing.companyProfile?.id,
            companyStatusChanged: existing.companyProfile ? true : false
          }
        }
      })
    })

    revalidatePath("/admin/users")

    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_TOGGLE_BLOCK]", {
      adminId: session.user.id,
      userId: parsed.data.userId,
      block: parsed.data.block,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return createError("admin.errors.userNotFound", "USER_NOT_FOUND")
    }

    return createError("admin.errors.blockFailed", "BLOCK_FAILED")
  }
}
