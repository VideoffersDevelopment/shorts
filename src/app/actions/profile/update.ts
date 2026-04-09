"use server"

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { profileSchema } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

interface UpdateProfileResult {
  success?: boolean
  error?: string
}

export async function updateProfileAction(data: unknown): Promise<UpdateProfileResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = profileSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...parsed.data
      },
      update: parsed.data
    })

    revalidatePath('/panel/profile')
    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'Failed to update profile' }
  }
}
