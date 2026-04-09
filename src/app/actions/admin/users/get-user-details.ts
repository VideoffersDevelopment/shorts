"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"

const getUserDetailsSchema = z.object({
  userId: z.string().cuid()
})

export interface UserDetails {
  id: string
  email: string
  role: string
  isBlocked: boolean
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  profile: {
    displayName: string | null
    avatar: string | null
    bio: string | null
    location: string | null
  } | null
  companyProfile: {
    id: string
    companyName: string
    slug: string
    nip: string
    viesVerified: boolean
    verifiedAt: Date | null
  } | null
}

export async function getUserDetailsAction(
  userId: string
): Promise<ActionResult<UserDetails>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // Validate input
  const parsed = getUserDetailsSchema.safeParse({ userId })
  if (!parsed.success) {
    return createError("errors.invalidInput", "INVALID_INPUT")
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            displayName: true,
            avatar: true,
            bio: true,
            location: true
          }
        },
        companyProfile: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            nip: true,
            viesVerified: true,
            verifiedAt: true
          }
        }
      }
    })

    if (!user) {
      return createError("admin.errors.userNotFound", "USER_NOT_FOUND")
    }

    return createSuccess(user)
  } catch (error) {
    console.error("[ADMIN_GET_USER_DETAILS]", {
      adminId: session.user.id,
      userId: parsed.data.userId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    return createError("admin.errors.userNotFound", "USER_NOT_FOUND")
  }
}
