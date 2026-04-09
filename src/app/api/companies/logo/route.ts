import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUploadUrl, deleteObject, getPublicUrl } from '@/lib/r2'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!companyProfile) {
      return NextResponse.json({ error: 'Not a company account' }, { status: 403 })
    }

    const body = await request.json()
    const { contentType } = body

    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    // Generate unique key for logo
    const fileExtension = contentType.split('/')[1]
    const key = `companies/${companyProfile.id}/logo-${nanoid()}.${fileExtension}`

    // Get presigned URL from R2
    const uploadUrl = await getUploadUrl({ key, contentType })
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error('Logo upload URL generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!companyProfile || !companyProfile.logo) {
      return NextResponse.json({ error: 'No logo to delete' }, { status: 404 })
    }

    // Extract key from logo URL
    const logoUrl = companyProfile.logo
    const urlParts = logoUrl.split('/')
    const key = `companies/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`

    // Delete from R2
    await deleteObject(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
