"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2"
import { revalidatePath } from "next/cache"

export async function deleteAvatarAction(): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Get current avatar URL from DB
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { avatar: true }
    })

    if (profile?.avatar) {
      // Extract R2 key from public URL
      // URL format: https://{domain}/avatars/{userId}/{timestamp}.{ext}
      const url = new URL(profile.avatar)
      const key = url.pathname.substring(1) // Remove leading "/"

      // Delete from R2
      await deleteObject(key)
    }

    // Update DB - set avatar to NULL
    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: { avatar: null }
    })

    revalidatePath("/panel/profile")
    return { success: true }
  } catch (error) {
    console.error("Delete avatar error:", error)
    return { error: "Failed to delete avatar" }
  }
}
