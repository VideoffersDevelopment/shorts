"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { shortIdSchema } from "@/lib/validation/shorts"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"
import type { Short } from "@prisma/client"

/**
 * Archives a published short
 *
 * Flow:
 * 0. VALIDATE: Validate shortId format
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user owns the short via company
 * 3. STATUS CHECK: Short must be PUBLISHED
 * 4. UPDATE: Set status to ARCHIVED, archivedAt = now()
 * 5. revalidatePath
 */
export async function archiveShortAction(
  shortId: string
): Promise<ActionResult<Short>> {
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
      status: true
    }
  })

  if (!short) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 3. STATUS CHECK: Must be PUBLISHED
  if (short.status !== "PUBLISHED") {
    return createError("errors.invalidStatus", "NOT_PUBLISHED")
  }

  try {
    // 4. UPDATE: Set status to ARCHIVED
    const archivedShort = await prisma.short.update({
      where: { id: shortId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date()
      }
    })

    // 5. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")
    revalidatePath(`/[locale]/panel/shorts/${shortId}`, "page")

    return createSuccess<Short>(archivedShort)
  } catch (error) {
    console.error("Archive short error:", error)
    return createError("errors.archiveFailed", "ARCHIVE_FAILED")
  }
}
