"use server"

import { prisma } from "@/lib/prisma"
import { emailSchema } from "@/lib/validation"
import { sendEmail, generatePasswordResetEmail } from "@/lib/resend"
import { generateToken } from "@/lib/utils"

interface ForgotPasswordResult {
  success?: boolean
  error?: string
}

export async function forgotPasswordAction(data: unknown): Promise<ForgotPasswordResult> {
  const parsed = emailSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { success: true }
  }

  const token = generateToken()
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000)
    }
  })

  const html = await generatePasswordResetEmail(token)
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html
  })

  return { success: true }
}
