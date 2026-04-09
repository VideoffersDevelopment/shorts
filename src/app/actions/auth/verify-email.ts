"use server"

import { prisma } from "@/lib/prisma"

interface VerifyEmailResult {
  success?: boolean
  error?: string
}

export async function verifyEmailAction(token: string): Promise<VerifyEmailResult> {
  if (!token) {
    return { error: "Token is required" }
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verification || verification.expires < new Date()) {
    return { error: "Token expired or invalid" }
  }

  await prisma.user.update({
    where: { email: verification.identifier },
    data: { emailVerified: new Date() }
  })

  await prisma.verificationToken.delete({ where: { token } })

  return { success: true }
}
