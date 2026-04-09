"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyProfileSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"
import type { CompanyProfile } from "@prisma/client"

export async function updateCompanyProfileAction(
  data: unknown
): Promise<ActionResult<CompanyProfile>> {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. CHECK: Has company profile?
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })
  if (!existing) {
    return createError("companies.errors.notCompany", "NOT_COMPANY")
  }

  // 3. VALIDATION
  const parsed = companyProfileSchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  // 4. UPDATE PROFILE
  try {
    const updated = await prisma.companyProfile.update({
      where: { userId: session.user.id },
      data: {
        companyName: parsed.data.companyName,
        description: parsed.data.description,
        website: parsed.data.website || null,
        categoryId: parsed.data.categoryId || null,
        subcategories: parsed.data.subcategories ?? [],
        socialLinks: parsed.data.socialLinks ?? undefined,
        logo: parsed.data.logo || null,
        banner: parsed.data.banner || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        street: parsed.data.street || null,
        postalCode: parsed.data.postalCode || null,
        city: parsed.data.city || null,
        phone: parsed.data.phone || null,
        contactEmail: parsed.data.contactEmail || null,
        businessHours: parsed.data.businessHours ?? undefined
      }
    })

    // 5. REVALIDATE
    revalidatePath(`/companies/${updated.slug}`)
    revalidatePath("/panel/company/profile")

    return createSuccess(updated)
  } catch (error) {
    console.error("Company profile update error:", error)
    return createError("companies.errors.updateFailed", "UPDATE_FAILED")
  }
}
