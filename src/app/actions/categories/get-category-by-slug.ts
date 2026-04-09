"use server"

import { prisma } from "@/lib/prisma"
import type { Category } from "@prisma/client"

export type CategoryWithChildren = Category & {
  children: Category[]
  parent: Category | null
}

/**
 * Get a category by slug with its children and parent.
 * Public action — no auth required.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryWithChildren | null> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        enabled: true,
      },
      include: {
        children: {
          where: { enabled: true },
          orderBy: { order: "asc" },
        },
        parent: true,
      },
    })

    return category
  } catch (error) {
    console.error("[GET_CATEGORY_BY_SLUG]", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
