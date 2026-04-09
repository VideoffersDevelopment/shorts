"use server"

import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteAccountSchema } from "@/lib/validation"

interface DeleteAccountResult {
  success?: boolean
  error?: string
}

export async function deleteAccountAction(data: unknown): Promise<DeleteAccountResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = deleteAccountSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Soft delete: set emailVerified to null
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailVerified: null }
  })

  // Delete all sessions
  await prisma.session.deleteMany({
    where: { userId: session.user.id }
  })

  await signOut({ redirect: false })

  return { success: true }
}
