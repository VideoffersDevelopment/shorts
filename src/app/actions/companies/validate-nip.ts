"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nipSchema } from "@/lib/validation"
import { checkVATWithRetry } from "@/lib/vies"
import { createError, createSuccess } from "@/lib/types/action-result"
import type { ActionResult } from "@/lib/types/action-result"

export interface NipValidationResult {
  isValid: boolean
  isUnique: boolean
  viesStatus: "verified" | "pending" | "unavailable" | "invalid"
  companyName?: string
  error?: string
}

export async function validateNipAction(
  nip: string
): Promise<ActionResult<NipValidationResult>> {
  // 1. AUTH CHECK
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. FORMAT VALIDATION
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

  // 3. UNIQUENESS CHECK
  const existing = await prisma.companyProfile.findUnique({
    where: { nip: normalizedNip },
    select: { userId: true }
  })

  if (existing && existing.userId !== session.user.id) {
    return createSuccess<NipValidationResult>({
      isValid: false,
      isUnique: false,
      viesStatus: "invalid",
      error: "nipValidation.errors.alreadyExists"
    })
  }

  // 4. VIES VERIFICATION
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
