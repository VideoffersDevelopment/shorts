"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { createError, createSuccess } from "@/lib/types/action-result"

export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  try {
    // Check if category exists and has companies or children
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            companyProfiles: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return createError("admin.errors.categoryNotFound", "CATEGORY_NOT_FOUND")
    }

    if (category._count.companyProfiles > 0) {
      return createError(
        "admin.errors.categoryHasCompanies",
        "CATEGORY_HAS_COMPANIES"
      )
    }

    if (category._count.children > 0) {
      return createError(
        "admin.errors.categoryHasChildren",
        "CATEGORY_HAS_CHILDREN"
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    revalidatePath("/[locale]/admin/categories", "page")
    return createSuccess(undefined)
  } catch (error) {
    console.error("[ADMIN_DELETE_CATEGORY]", {
      adminId: session.user.id,
      categoryId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return createError("admin.errors.categoryDeleteFailed", "CATEGORY_DELETE_FAILED")
  }
}
