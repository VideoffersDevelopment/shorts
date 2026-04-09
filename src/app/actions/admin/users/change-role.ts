"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { Role } from "@prisma/client"

const changeRoleSchema = z.object({
  userId: z.string().cuid(),
  newRole: z.nativeEnum(Role)
})

export async function changeRoleAction(
  userId: string,
  newRole: Role
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Prevent changing own role
  if (session.user.id === userId) {
    return createError("admin.errors.cannotChangeOwnRole", "CANNOT_CHANGE_OWN_ROLE")
  }

  // Validate input
  const parsed = changeRoleSchema.safeParse({ userId, newRole })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Check user exists
      const existing = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, role: true }
      })

      if (!existing) {
        throw new Error("USER_NOT_FOUND")
      }

      const previousRole = existing.role

      // Update user role
      await tx.user.update({
        where: { id: parsed.data.userId },
        data: { role: parsed.data.newRole }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "CHANGE_USER_ROLE",
          targetType: "USER",
          targetId: parsed.data.userId,
          metadata: {
            previousRole,
            newRole: parsed.data.newRole
          }
        }
      })
    })

    revalidatePath("/admin/users")

    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_CHANGE_ROLE]", {
      adminId: session.user.id,
      userId: parsed.data.userId,
      newRole: parsed.data.newRole,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return createError("admin.errors.userNotFound", "USER_NOT_FOUND")
    }

    return createError("admin.errors.roleChangeFailed", "ROLE_CHANGE_FAILED")
  }
}
