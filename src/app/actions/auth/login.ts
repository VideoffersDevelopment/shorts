"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export type LoginResult = {
  success: boolean
  error?: "INVALID_CREDENTIALS" | "EMAIL_NOT_VERIFIED" | "USER_BLOCKED" | "UNKNOWN_ERROR"
}

/**
 * Server action for login that provides custom error codes.
 * This bypasses NextAuth v5's limitation of wrapping all errors as CallbackRouteError.
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  // Validate input
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { success: false, error: "INVALID_CREDENTIALS" }
  }

  try {
    // First, check user status before attempting signIn
    // This allows us to return specific error codes
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        passwordHash: true,
        emailVerified: true,
        isBlocked: true
      }
    })

    // Check if user exists and has a password
    if (!user?.passwordHash) {
      return { success: false, error: "INVALID_CREDENTIALS" }
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!isValidPassword) {
      return { success: false, error: "INVALID_CREDENTIALS" }
    }

    // Check email verification
    if (!user.emailVerified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED" }
    }

    // Check if blocked
    if (user.isBlocked) {
      return { success: false, error: "USER_BLOCKED" }
    }

    // All checks passed, proceed with signIn
    // At this point, the authorize() function will succeed
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false
    })

    return { success: true }
  } catch (error) {
    console.error("[LOGIN_ACTION]", error)

    // Handle AuthError from NextAuth
    if (error instanceof AuthError) {
      // Check if the error message contains our custom codes
      const message = error.message || ""
      if (message.includes("EMAIL_NOT_VERIFIED")) {
        return { success: false, error: "EMAIL_NOT_VERIFIED" }
      }
      if (message.includes("USER_BLOCKED") || message.includes("BLOCKED")) {
        return { success: false, error: "USER_BLOCKED" }
      }
      return { success: false, error: "INVALID_CREDENTIALS" }
    }

    // Handle redirect (signIn with redirect: false still throws on success in some cases)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return { success: true }
    }

    return { success: false, error: "UNKNOWN_ERROR" }
  }
}
