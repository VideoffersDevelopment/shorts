"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateShortSchema, shortIdSchema } from "@/lib/validation/shorts"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess, formatZodError } from "@/lib/types/action-result"
import type { Short } from "@prisma/client"

/**
 * Updates short metadata (title, description, tags, ctaLink)
 *
 * Flow:
 * 0. VALIDATE: Validate shortId format
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user owns the short via company
 * 3. STATUS CHECK: Short must be DRAFT or PUBLISHED
 * 4. VALIDATION: Validate input with Zod schema
 * 5. TRANSACTION: Update Short + handle tag changes
 * 6. revalidatePath
 */
export async function updateShortMetadataAction(
  shortId: string,
  data: unknown
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
  const existingShort = await prisma.short.findFirst({
    where: {
      id: shortId,
      companyId: companyProfile.id
    },
    select: {
      id: true,
      status: true
    }
  })

  if (!existingShort) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 3. STATUS CHECK: Allow editing in any status EXCEPT DELETED
  // Users should be able to update metadata (title, description, tags) at any time
  if (existingShort.status === "DELETED") {
    return createError("errors.shortDeleted", "SHORT_DELETED")
  }

  // 4. VALIDATION
  const parsed = updateShortSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const { title, description, tags, ctaLink } = parsed.data

  // 5. TRANSACTION: Update Short + handle tag changes
  try {
    const updatedShort = await prisma.$transaction(async (tx) => {
      // Update the short
      const short = await tx.short.update({
        where: { id: shortId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(ctaLink !== undefined && { ctaLink: ctaLink && ctaLink.trim() !== "" ? ctaLink : null })
        }
      })

      // Handle tags if provided
      if (tags !== undefined) {
        // Get current tags to decrement usage counts
        const currentTags = await tx.shortTag.findMany({
          where: { shortId },
          select: { tagId: true }
        })

        // Decrement usage counts for old tags
        if (currentTags.length > 0) {
          await Promise.all(
            currentTags.map((st) =>
              tx.tag.update({
                where: { id: st.tagId },
                data: { usageCount: { decrement: 1 } }
              })
            )
          )
        }

        // Delete all existing ShortTag relations
        await tx.shortTag.deleteMany({
          where: { shortId }
        })

        // Create new tags if provided
        if (tags.length > 0) {
          const tagRecords = await Promise.all(
            tags.map(async (tagName) => {
              const slug = tagName
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "")

              // Try to find existing tag
              let tag = await tx.tag.findUnique({
                where: { slug }
              })

              if (!tag) {
                // Create new tag
                tag = await tx.tag.create({
                  data: {
                    name: tagName,
                    slug,
                    usageCount: 0
                  }
                })
              }

              return tag
            })
          )

          // Create ShortTag relations and increment usage counts
          await Promise.all(
            tagRecords.map(async (tag) => {
              // Create relation
              await tx.shortTag.create({
                data: {
                  shortId,
                  tagId: tag.id
                }
              })

              // Increment usage count
              await tx.tag.update({
                where: { id: tag.id },
                data: { usageCount: { increment: 1 } }
              })
            })
          )
        }
      }

      return short
    })

    // 6. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")
    revalidatePath(`/[locale]/panel/shorts/${shortId}`, "page")

    return createSuccess<Short>(updatedShort)
  } catch (error) {
    console.error("Update short error:", error)
    return createError("errors.updateFailed", "UPDATE_FAILED")
  }
}
