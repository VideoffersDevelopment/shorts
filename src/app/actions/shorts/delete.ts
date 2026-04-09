"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2"
import { shortIdSchema } from "@/lib/validation/shorts"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"

interface DeleteShortResult {
  success: boolean
}

/**
 * Deletes a draft short
 *
 * Flow:
 * 0. VALIDATE: Validate shortId format
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user owns the short via company
 * 3. STATUS CHECK: Short must be DRAFT (cannot delete published)
 * 4. DELETE: Delete short (cascade deletes tags, stats)
 * 5. CLEANUP: Delete raw video from R2 if rawVideoKey exists
 * 6. revalidatePath
 */
export async function deleteShortAction(
  shortId: string
): Promise<ActionResult<DeleteShortResult>> {
  // 0. VALIDATE shortId
  const parsedId = shortIdSchema.safeParse({ shortId })
  if (!parsedId.success) {
    return createError("errors.invalidId", "INVALID_ID")
  }

  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. AUTHORIZATION: Get company profile and verify ownership
  if (session.user.role !== "COMPANY") {
    return createError("errors.unauthorized", "NOT_COMPANY")
  }

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (!companyProfile) {
    return createError("errors.unauthorized", "NO_COMPANY_PROFILE")
  }

  // Get the short and verify ownership
  const short = await prisma.short.findFirst({
    where: {
      id: shortId,
      companyId: companyProfile.id
    },
    select: {
      id: true,
      status: true,
      rawVideoKey: true
    }
  })

  if (!short) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 3. STATUS CHECK: Must be DRAFT
  if (short.status !== "DRAFT") {
    return createError("errors.invalidStatus", "CANNOT_DELETE_NON_DRAFT")
  }

  try {
    // 4. DELETE: Delete short (cascade deletes ShortTag, ShortStats)
    await prisma.short.delete({
      where: { id: shortId }
    })

    // 5. CLEANUP: Delete raw video from R2 if rawVideoKey exists
    if (short.rawVideoKey) {
      try {
        await deleteObject(short.rawVideoKey)
      } catch (r2Error) {
        // Log but don't fail - the short is already deleted
        console.error("Failed to delete raw video from R2:", r2Error)
      }
    }

    // 6. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")

    return createSuccess<DeleteShortResult>({
      success: true
    })
  } catch (error) {
    console.error("Delete short error:", error)
    return createError("errors.deleteFailed", "DELETE_FAILED")
  }
}
