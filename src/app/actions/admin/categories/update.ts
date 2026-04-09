"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"
import { type Category } from "@prisma/client"

export async function updateCategoryAction(
  categoryId: string,
  data: unknown
): Promise<ActionResult<Category>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  try {
    // Check category exists
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      return createError("admin.errors.categoryNotFound", "CATEGORY_NOT_FOUND")
    }

    // Check for duplicate slug (excluding current category)
    const slugExists = await prisma.category.findFirst({
      where: {
        slug: parsed.data.slug,
        NOT: { id: categoryId }
      }
    })

    if (slugExists) {
      return createError("admin.errors.categorySlugExists", "SLUG_EXISTS")
    }

    // Prevent setting self as parent
    if (parsed.data.parentId === categoryId) {
      return createError("admin.errors.categorySelfParent", "SELF_PARENT")
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...parsed.data,
        parentId: parsed.data.parentId || null,
        enabled: parsed.data.enabled ?? true
      }
    })

    revalidatePath("/[locale]/admin/categories", "page")
    return createSuccess(category)
  } catch (error) {
    console.error("[ADMIN_UPDATE_CATEGORY]", {
      adminId: session.user.id,
      categoryId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return createError("admin.errors.categoryUpdateFailed", "CATEGORY_UPDATE_FAILED")
  }
}
