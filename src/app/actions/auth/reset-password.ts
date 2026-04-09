"use server"

import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validation"
import bcrypt from "bcryptjs"

interface ResetPasswordResult {
  success?: boolean
  error?: string
}

export async function resetPasswordAction(data: unknown): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token, password } = parsed.data

  const verification = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verification || verification.expires < new Date()) {
    return { error: "Token expired or invalid" }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { email: verification.identifier },
    data: { passwordHash }
  })

  await prisma.verificationToken.delete({ where: { token } })

  return { success: true }
}
