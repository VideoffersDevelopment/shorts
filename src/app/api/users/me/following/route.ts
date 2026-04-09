import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type {
  FollowedCompany,
  FollowingListResponse,
} from '@/lib/types/interactions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20)
    )

    const totalCount = await prisma.follow.count({
      where: { userId: session.user.id },
    })

    const follows = await prisma.follow.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            viesVerified: true,
            _count: { select: { followers: true, shorts: true } },
          },
        },
      },
    })

    const companies: FollowedCompany[] = follows.map((f) => ({
      id: f.company.id,
      companyName: f.company.companyName,
      slug: f.company.slug,
      logo: f.company.logo,
      viesVerified: f.company.viesVerified,
      followersCount: f.company._count.followers,
      shortsCount: f.company._count.shorts,
    }))

    const hasMore = page * limit < totalCount

    return NextResponse.json({
      companies,
      totalCount,
      page,
      hasMore,
    } satisfies FollowingListResponse)
  } catch (error) {
    console.error('GET /api/users/me/following error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
