"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createShortSchema } from "@/lib/validation/shorts"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess, formatZodError } from "@/lib/types/action-result"
import type { Short } from "@prisma/client"

const MAX_DRAFTS_PER_COMPANY = 10

interface CreateShortResult {
  shortId: string
}

/**
 * Creates a new short video draft
 *
 * Flow:
 * 1. AUTH: Verify user is logged in
 * 2. AUTHORIZATION: Verify user has company profile
 * 3. VALIDATION: Validate input with Zod schema
 * 4. LIMIT: Check max drafts per company (10)
 * 5. TRANSACTION: Create Short + Tags + ShortTags + ShortStats
 * 6. revalidatePath
 * 7. Return shortId
 */
export async function createShortAction(
  data: unknown
): Promise<ActionResult<CreateShortResult>> {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. AUTHORIZATION: User must have COMPANY role and active company profile
  if (session.user.role !== "COMPANY") {
    return createError("errors.unauthorized", "NOT_COMPANY")
  }

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true }
  })

  if (!companyProfile) {
    return createError("errors.unauthorized", "NO_COMPANY_PROFILE")
  }

  if (companyProfile.status !== "ACTIVE") {
    return createError("errors.unauthorized", "COMPANY_NOT_ACTIVE")
  }

  // 3. VALIDATION
  const parsed = createShortSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const {
    rawVideoKey,
    title,
    description,
    categoryId,
    tags,
    latitude,
    longitude,
    address,
    ctaLink,
    thumbnailUrl,
    customThumbnail,
    duration,
    aspectRatio
  } = parsed.data

  // 4. LIMIT: Check max drafts per company
  const draftCount = await prisma.short.count({
    where: {
      companyId: companyProfile.id,
      status: "DRAFT"
    }
  })

  if (draftCount >= MAX_DRAFTS_PER_COMPANY) {
    return createError("errors.createFailed", "MAX_DRAFTS_EXCEEDED")
  }

  // 5. TRANSACTION: Create Short + Tags + ShortTags + ShortStats
  try {
    const short = await prisma.$transaction(async (tx) => {
      // Create the short
      const newShort = await tx.short.create({
        data: {
          companyId: companyProfile.id,
          rawVideoKey,
          title,
          description: description ?? null,
          categoryId,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          address: address ?? null,
          ctaLink: ctaLink && ctaLink.trim() !== "" ? ctaLink : null,
          status: "DRAFT",
          thumbnailUrl: thumbnailUrl ?? null,
          customThumbnail: customThumbnail ?? false,
          duration: duration ?? null,
          aspectRatio: aspectRatio ?? null
        }
      })

      // Create ShortStats
      await tx.shortStats.create({
        data: {
          shortId: newShort.id
        }
      })

      // Handle tags if provided
      if (tags && tags.length > 0) {
        // Get or create tags
        const tagRecords = await Promise.all(
          tags.map(async (tagName) => {
            const slug = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

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
                shortId: newShort.id,
                tagId: tag.id
              }
            })

            // Increment usage count
            await tx.tag.update({
              where: { id: tag.id },
              data: {
                usageCount: { increment: 1 }
              }
            })
          })
        )
      }

      return newShort
    })

    // 6. revalidatePath
    revalidatePath("/[locale]/panel/shorts", "page")

    // 7. Return shortId
    return createSuccess<CreateShortResult>({
      shortId: short.id
    })
  } catch (error) {
    console.error("Create short error:", error)
    return createError("errors.createFailed", "CREATE_FAILED")
  }
}
