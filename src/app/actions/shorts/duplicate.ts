"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { shortIdSchema } from "@/lib/validation/shorts"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"

const MAX_DRAFTS_PER_COMPANY = 10

interface DuplicateShortResult {
  shortId: string
}

/**
 * Duplicates a short
 *
 * Flow:
 * 0. VALIDATE: Validate shortId format
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user owns the short via company
 * 3. LIMIT: Check draft limit (max 10)
 * 4. COPY: Based on status:
 *    - DRAFT: Copy rawVideoKey (reference, no file copy), all metadata, tags
 *    - PUBLISHED/ARCHIVED: DO NOT copy rawVideoKey/hlsPlaylistUrl, only metadata + tags
 * 5. Set qencodeTaskId = null, hlsPlaylistUrl = null on new short
 * 6. Create new ShortStats record (zeroed)
 * 7. revalidatePath
 */
export async function duplicateShortAction(
  shortId: string
): Promise<ActionResult<DuplicateShortResult>> {
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
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!short) {
    return createError("errors.notFound", "SHORT_NOT_FOUND")
  }

  // 3. LIMIT: Check max drafts per company
  const draftCount = await prisma.short.count({
    where: {
      companyId: companyProfile.id,
      status: "DRAFT"
    }
  })

  if (draftCount >= MAX_DRAFTS_PER_COMPANY) {
    return createError("duplicate.limitReached", "MAX_DRAFTS_EXCEEDED")
  }

  try {
    const duplicatedShort = await prisma.$transaction(async (tx) => {
      // Determine what to copy based on status
      const isDraft = short.status === "DRAFT"

      // 4. & 5. Create the new short
      const newShort = await tx.short.create({
        data: {
          companyId: companyProfile.id,
          // Only copy rawVideoKey for DRAFT shorts
          rawVideoKey: isDraft ? short.rawVideoKey : null,
          // Never copy transcoding-related fields
          qencodeTaskId: null,
          hlsPlaylistUrl: null,
          // Copy all metadata
          title: `${short.title} (copy)`,
          description: short.description,
          categoryId: short.categoryId,
          latitude: short.latitude,
          longitude: short.longitude,
          address: short.address,
          ctaLink: short.ctaLink,
          // Set status to DRAFT
          status: "DRAFT",
          thumbnailUrl: short.thumbnailUrl,
          customThumbnail: short.customThumbnail,
          duration: short.duration,
          aspectRatio: short.aspectRatio
        }
      })

      // 6. Create ShortStats record
      await tx.shortStats.create({
        data: {
          shortId: newShort.id
        }
      })

      // Copy tags
      if (short.tags.length > 0) {
        await Promise.all(
          short.tags.map(async (shortTag) => {
            // Create ShortTag relation
            await tx.shortTag.create({
              data: {
                shortId: newShort.id,
                tagId: shortTag.tagId
              }
            })

            // Increment usage count
            await tx.tag.update({
              where: { id: shortTag.tagId },
              data: { usageCount: { increment: 1 } }
            })
          })
        )
      }

      return newShort
    })

    // 7. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")

    return createSuccess<DuplicateShortResult>({
      shortId: duplicatedShort.id
    })
  } catch (error) {
    console.error("Duplicate short error:", error)
    return createError("duplicate.error", "DUPLICATE_FAILED")
  }
}
