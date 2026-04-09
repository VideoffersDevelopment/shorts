"use server"

import { prisma } from "@/lib/prisma"
import type { Category } from "@prisma/client"

export type CategoryWithChildren = Category & {
  children: Category[]
}

/**
 * Get all main categories (parentId = null) with their enabled subcategories.
 * This is a public action - no auth required.
 * Used in the sidebar for navigation.
 */
export async function getMainCategories(): Promise<CategoryWithChildren[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        enabled: true,
      },
      include: {
        children: {
          where: { enabled: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    return categories
  } catch (error) {
    console.error("[GET_MAIN_CATEGORIES]", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
    return []
  }
}
