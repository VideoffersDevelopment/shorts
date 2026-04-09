import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params

    // Fetch enabled child categories for the given parent category
    const subcategories = await prisma.category.findMany({
      where: {
        parentId: categoryId,
        enabled: true
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Failed to fetch subcategories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
      { status: 500 }
    )
  }
}
