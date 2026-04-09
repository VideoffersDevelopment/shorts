"use server"

import { prisma } from "@/lib/prisma"
import { companySignupSchema } from "@/lib/validation"
import { sendEmail, generateVerificationEmail } from "@/lib/resend"
import { checkVATWithRetry } from "@/lib/vies"
import { generateSlug } from "@/lib/utils/slug"
import { generateToken } from "@/lib/utils"
import { grantPromoCredits } from "@/lib/wallet/wallet-service"
import bcrypt from "bcryptjs"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"

interface CompanySignupResult {
  viesStatus: "verified" | "pending_manual_review"
}

/**
 * Combined company signup action.
 * Creates a User with COMPANY role and CompanyProfile in a single transaction.
 * Sends verification email like regular signup.
 */
export async function signupCompanyAction(
  data: unknown
): Promise<ActionResult<CompanySignupResult>> {
  // 1. VALIDATION
  const parsed = companySignupSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const { email, password, companyName, nip, address, phone } = parsed.data

  // 2. CHECK: Email already exists?
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isBlocked: true }
  })

  if (existingUser) {
    if (existingUser.isBlocked) {
      return createError("ACCOUNT_BLOCKED", "ACCOUNT_BLOCKED")
    }
    return createError("EMAIL_EXISTS", "EMAIL_EXISTS")
  }

  // 3. CHECK: NIP unique?
  const nipExists = await prisma.companyProfile.findUnique({
    where: { nip }
  })
  if (nipExists) {
    return createError("errors.nipExists", "NIP_EXISTS", "nip")
  }

  // 4. VIES VERIFICATION
  let viesVerified = false
  let verifiedAt: Date | null = null
  try {
    const viesResult = await checkVATWithRetry("PL", nip)
    viesVerified = viesResult.valid
    verifiedAt = viesVerified ? new Date() : null
  } catch (error) {
    console.error("VIES API error:", error)
    // Fallback: manual verification required
    viesVerified = false
  }

  // 5. GENERATE SLUG
  const slug = await generateSlug(companyName, prisma.companyProfile)

  // 6. HASH PASSWORD
  const passwordHash = await bcrypt.hash(password, 10)

  // 7. CREATE USER + COMPANY IN TRANSACTION
  try {
    const { user } = await prisma.$transaction(async (tx) => {
      // Create user with COMPANY role directly
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "COMPANY"
        }
      })

      // Create company profile
      await tx.companyProfile.create({
        data: {
          userId: user.id,
          companyName,
          slug,
          nip,
          viesVerified,
          verifiedAt,
          street: address,
          phone
        }
      })

      return { user }
    })

    // 8. PROMO GRANT (fire-and-forget, non-blocking)
    grantPromoCredits(user.id).catch((err) =>
      console.error("PROMO grant failed:", err)
    )

    // 9. CREATE VERIFICATION TOKEN
    const token = generateToken()
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    // 9. SEND VERIFICATION EMAIL
    const html = await generateVerificationEmail(token)
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html
    })

    return createSuccess<CompanySignupResult>({
      viesStatus: viesVerified ? "verified" : "pending_manual_review"
    })
  } catch (error) {
    console.error("Company signup error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email,
      companyName,
      slug,
      nip
    })
    return createError("errors.createFailed", "CREATE_FAILED")
  }
}
