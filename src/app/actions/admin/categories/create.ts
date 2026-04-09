"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { type ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError, createSuccess } from "@/lib/types/action-result"
import { type Category } from "@prisma/client"

export async function createCategoryAction(
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
    // Check for duplicate slug
    const existing = await prisma.category.findUnique({
      where: { slug: parsed.data.slug }
    })

    if (existing) {
      return createError("admin.errors.categorySlugExists", "SLUG_EXISTS")
    }

    // Get max order for new category
    const maxOrder = await prisma.category.aggregate({
      _max: { order: true },
      where: { parentId: parsed.data.parentId ?? null }
    })

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        parentId: parsed.data.parentId || null,
        order: parsed.data.order ?? (maxOrder._max.order ?? 0) + 1,
        enabled: parsed.data.enabled ?? true
      }
    })

    revalidatePath("/[locale]/admin/categories", "page")
    return createSuccess(category)
  } catch (error) {
    console.error("[ADMIN_CREATE_CATEGORY]", {
      adminId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return createError("admin.errors.categoryCreateFailed", "CATEGORY_CREATE_FAILED")
  }
}
