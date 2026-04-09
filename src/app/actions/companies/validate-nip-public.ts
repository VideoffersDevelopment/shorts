"use server"

import { prisma } from "@/lib/prisma"
import { nipSchema } from "@/lib/validation"
import { checkVATWithRetry } from "@/lib/vies"
import { createSuccess } from "@/lib/types/action-result"
import type { ActionResult } from "@/lib/types/action-result"

export interface NipValidationResult {
  isValid: boolean
  isUnique: boolean
  viesStatus: "verified" | "pending" | "unavailable" | "invalid"
  companyName?: string
  error?: string
}

/**
 * Public NIP validation action for company signup.
 * Does NOT require authentication - intentionally accessible to unauthenticated users
 * during the company registration process.
 */
export async function validateNipPublicAction(
  nip: string
): Promise<ActionResult<NipValidationResult>> {
  // NO AUTH CHECK - this action is intentionally public for company signup

  // 1. FORMAT VALIDATION
  const parsed = nipSchema.safeParse(nip)
  if (!parsed.success) {
    return createSuccess<NipValidationResult>({
      isValid: false,
      isUnique: true,
      viesStatus: "invalid",
      error: "nipValidation.errors.invalidFormat"
    })
  }

  const normalizedNip = parsed.data

  // 2. UNIQUENESS CHECK (any company using this NIP)
  const existing = await prisma.companyProfile.findUnique({
    where: { nip: normalizedNip },
    select: { id: true }
  })

  if (existing) {
    return createSuccess<NipValidationResult>({
      isValid: false,
      isUnique: false,
      viesStatus: "invalid",
      error: "nipValidation.errors.alreadyExists"
    })
  }

  // 3. VIES VERIFICATION
  try {
    const viesResult = await checkVATWithRetry("PL", normalizedNip)

    return createSuccess<NipValidationResult>({
      isValid: viesResult.valid,
      isUnique: true,
      viesStatus: viesResult.valid ? "verified" : "invalid",
      companyName: viesResult.name || undefined,
      error: viesResult.valid ? undefined : "nipValidation.errors.viesInvalid"
    })
  } catch (error) {
    console.error("VIES validation error:", error)

    // Graceful degradation: VIES unavailable - allow submission with warning
    return createSuccess<NipValidationResult>({
      isValid: true,
      isUnique: true,
      viesStatus: "unavailable",
      error: undefined
    })
  }
}
