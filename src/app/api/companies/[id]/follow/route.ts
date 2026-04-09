import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { FollowResponse } from '@/lib/types/interactions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify company exists
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
      select: { id: true, userId: true },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Cannot follow your own company
    if (company.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot follow your own company' },
        { status: 400 }
      )
    }

    // Upsert follow (idempotent)
    await prisma.follow.upsert({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
      create: {
        userId: session.user.id,
        companyId,
      },
      update: {},
    })

    const followersCount = await prisma.follow.count({
      where: { companyId },
    })

    return NextResponse.json({
      following: true,
      followersCount,
    } satisfies FollowResponse)
  } catch (error) {
    console.error('POST /api/companies/[id]/follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete follow (deleteMany doesn't throw if not found)
    await prisma.follow.deleteMany({
      where: {
        userId: session.user.id,
        companyId,
      },
    })

    const followersCount = await prisma.follow.count({
      where: { companyId },
    })

    return NextResponse.json({
      following: false,
      followersCount,
    } satisfies FollowResponse)
  } catch (error) {
    console.error('DELETE /api/companies/[id]/follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
