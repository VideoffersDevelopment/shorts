"use server"

import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation"
import { sendEmail, generateVerificationEmail } from "@/lib/resend"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/utils"

interface SignupResult {
  success?: boolean
  error?: string
}

export async function signupAction(data: unknown): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isBlocked: true }
  })

  if (existing) {
    // If account exists and is blocked, return specific error
    if (existing.isBlocked) {
      return { error: "ACCOUNT_BLOCKED" }
    }
    return { error: "EMAIL_EXISTS" }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "USER"
    }
  })

  const token = generateToken()
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })

  const html = await generateVerificationEmail(token)
  await sendEmail({
    to: email,
    subject: "Verify your email",
    html
  })

  return { success: true }
}
