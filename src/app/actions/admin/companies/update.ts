"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyProfileSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"
import type { CompanyProfile } from "@prisma/client"

// Extend schema with companyId for admin update
const adminUpdateSchema = z.object({
  companyId: z.string().cuid(),
  data: companyProfileSchema
})

export async function adminUpdateCompanyAction(
  companyId: string,
  data: unknown
): Promise<ActionResult<CompanyProfile>> {
  // 1. AUTH - Admin only
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  // 2. VALIDATION
  const parsed = adminUpdateSchema.safeParse({ companyId, data })
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  try {
    // 3. UPDATE in transaction with audit log
    const updated = await prisma.$transaction(async (tx) => {
      // Check company exists
      const existing = await tx.companyProfile.findUnique({
        where: { id: parsed.data.companyId }
      })

      if (!existing) {
        throw new Error("COMPANY_NOT_FOUND")
      }

      // Update company profile
      const company = await tx.companyProfile.update({
        where: { id: parsed.data.companyId },
        data: {
          companyName: parsed.data.data.companyName,
          description: parsed.data.data.description,
          website: parsed.data.data.website || null,
          categoryId: parsed.data.data.categoryId || null,
          subcategories: parsed.data.data.subcategories ?? [],
          socialLinks: parsed.data.data.socialLinks ?? undefined,
          logo: parsed.data.data.logo || null,
          banner: parsed.data.data.banner || null,
          latitude: parsed.data.data.latitude ?? null,
          longitude: parsed.data.data.longitude ?? null,
          street: parsed.data.data.street || null,
          postalCode: parsed.data.data.postalCode || null,
          city: parsed.data.data.city || null,
          phone: parsed.data.data.phone || null,
          contactEmail: parsed.data.data.contactEmail || null,
          businessHours: parsed.data.data.businessHours ?? undefined
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "ADMIN_UPDATE_COMPANY",
          targetType: "COMPANY",
          targetId: parsed.data.companyId,
          metadata: {
            updatedFields: Object.keys(parsed.data.data).filter(
              key => parsed.data.data[key as keyof typeof parsed.data.data] !== undefined
            )
          }
        }
      })

      return company
    })

    // 4. REVALIDATE paths
    revalidatePath("/admin/companies")
    revalidatePath(`/admin/companies/${updated.id}/edit`)
    revalidatePath(`/companies/${updated.slug}`)

    return createSuccess(updated)
  } catch (error) {
    console.error("[ADMIN_UPDATE_COMPANY]", {
      adminId: session.user.id,
      companyId: parsed.data.companyId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error && error.message === "COMPANY_NOT_FOUND") {
      return createError("admin.errors.companyNotFound", "COMPANY_NOT_FOUND")
    }

    return createError("admin.errors.updateFailed", "UPDATE_FAILED")
  }
}
