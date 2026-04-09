import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface TagResult {
  id: string
  name: string
  usageCount: number
}

interface TagSearchResponse {
  tags: TagResult[]
}

interface ErrorResponse {
  error: string
}

export async function GET(
  request: Request
): Promise<NextResponse<TagSearchResponse | ErrorResponse>> {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      // Return popular tags if no query
      const popularTags = await prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          usageCount: true
        },
        orderBy: {
          usageCount: 'desc'
        },
        take: 10
      })

      return NextResponse.json({ tags: popularTags })
    }

    // Search tags by name (case-insensitive)
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        usageCount: true
      },
      orderBy: {
        usageCount: 'desc'
      },
      take: 10
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Tag search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
