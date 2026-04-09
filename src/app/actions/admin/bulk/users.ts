"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import { Role } from "@prisma/client"
import { bulkIdsSchema, bulkChangeRoleSchema, type BulkActionResult } from "./types"

/**
 * Bulk block multiple users
 * Blocks all specified users except the current admin (self-protection)
 */
export async function bulkBlockUsersAction(
  ids: string[]
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkIdsSchema.safeParse({ ids })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const userId of parsed.data.ids) {
      // Self-protection: skip current admin
      if (userId === session.user.id) {
        result.failedIds.push(userId)
        result.errors[userId] = "CANNOT_BLOCK_SELF"
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, isBlocked: true, email: true },
          })

          if (!existing) {
            throw new Error("USER_NOT_FOUND")
          }

          if (existing.isBlocked) {
            throw new Error("ALREADY_BLOCKED")
          }

          await tx.user.update({
            where: { id: userId },
            data: { isBlocked: true },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_BLOCK_USER",
              targetType: "USER",
              targetId: userId,
              metadata: {
                bulkOperation: true,
                email: existing.email,
              },
            },
          })
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(userId)
        result.errors[userId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/users")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_BLOCK_USERS]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkBlockFailed", "BULK_BLOCK_FAILED")
  }
}

/**
 * Bulk unblock multiple users
 */
export async function bulkUnblockUsersAction(
  ids: string[]
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkIdsSchema.safeParse({ ids })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const userId of parsed.data.ids) {
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, isBlocked: true, email: true },
          })

          if (!existing) {
            throw new Error("USER_NOT_FOUND")
          }

          if (!existing.isBlocked) {
            throw new Error("NOT_BLOCKED")
          }

          await tx.user.update({
            where: { id: userId },
            data: { isBlocked: false },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_UNBLOCK_USER",
              targetType: "USER",
              targetId: userId,
              metadata: {
                bulkOperation: true,
                email: existing.email,
              },
            },
          })
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(userId)
        result.errors[userId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/users")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_UNBLOCK_USERS]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkUnblockFailed", "BULK_UNBLOCK_FAILED")
  }
}

/**
 * Bulk change role for multiple users
 * Changes all specified users to the provided role (except self)
 */
export async function bulkChangeRoleAction(
  ids: string[],
  role: Role
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkChangeRoleSchema.safeParse({ ids, role })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const userId of parsed.data.ids) {
      // Self-protection: skip current admin
      if (userId === session.user.id) {
        result.failedIds.push(userId)
        result.errors[userId] = "CANNOT_CHANGE_OWN_ROLE"
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, email: true },
          })

          if (!existing) {
            throw new Error("USER_NOT_FOUND")
          }

          if (existing.role === parsed.data.role) {
            throw new Error("ROLE_UNCHANGED")
          }

          const previousRole = existing.role

          await tx.user.update({
            where: { id: userId },
            data: { role: parsed.data.role },
          })

          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_CHANGE_ROLE",
              targetType: "USER",
              targetId: userId,
              metadata: {
                bulkOperation: true,
                email: existing.email,
                previousRole,
                newRole: parsed.data.role,
              },
            },
          })
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(userId)
        result.errors[userId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/users")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_CHANGE_ROLE]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      role: parsed.data.role,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkRoleChangeFailed", "BULK_ROLE_CHANGE_FAILED")
  }
}

/**
 * Bulk delete multiple users
 * Permanently deletes users with cascade (profile, company, sessions, accounts)
 * Cannot delete self
 */
export async function bulkDeleteUsersAction(
  ids: string[]
): Promise<ActionResult<BulkActionResult>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = bulkIdsSchema.safeParse({ ids })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  const result: BulkActionResult = {
    processedCount: 0,
    failedIds: [],
    errors: {},
  }

  try {
    for (const userId of parsed.data.ids) {
      // Self-protection: skip current admin
      if (userId === session.user.id) {
        result.failedIds.push(userId)
        result.errors[userId] = "CANNOT_DELETE_SELF"
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              role: true,
              profile: { select: { displayName: true } },
              companyProfile: { select: { companyName: true } },
            },
          })

          if (!existing) {
            throw new Error("USER_NOT_FOUND")
          }

          // Store user data for audit before deletion
          const userData = {
            email: existing.email,
            role: existing.role,
            displayName: existing.profile?.displayName,
            companyName: existing.companyProfile?.companyName,
          }

          // Delete user (cascade will handle related records)
          await tx.user.delete({
            where: { id: userId },
          })

          // Create audit log with preserved user data
          await tx.auditLog.create({
            data: {
              adminId: session.user.id,
              action: "BULK_DELETE_USER",
              targetType: "USER",
              targetId: userId,
              metadata: {
                bulkOperation: true,
                deletedUserData: userData,
              },
            },
          })
        })

        result.processedCount++
      } catch (error) {
        result.failedIds.push(userId)
        result.errors[userId] =
          error instanceof Error ? error.message : "Unknown error"
      }
    }

    revalidatePath("/admin/users")

    return createSuccess(result)
  } catch (error) {
    console.error("[BULK_DELETE_USERS]", {
      adminId: session.user.id,
      ids: parsed.data.ids,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return createError("admin.errors.bulkDeleteFailed", "BULK_DELETE_FAILED")
  }
}
