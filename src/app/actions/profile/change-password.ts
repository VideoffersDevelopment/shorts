"use server"

import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { passwordChangeSchema } from "@/lib/validation"
import bcrypt from "bcryptjs"

interface ChangePasswordResult {
  success?: boolean
  error?: string
}

export async function changePasswordAction(data: unknown): Promise<ChangePasswordResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = passwordChangeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  })

  if (!user?.passwordHash) {
    return { error: "Account created with OAuth" }
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return { error: "Wrong current password" }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newPasswordHash }
  })

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId: session.user.id }
  })

  await signOut({ redirect: false })

  return { success: true }
}
