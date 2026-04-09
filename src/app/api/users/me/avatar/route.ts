import { auth } from '@/lib/auth'
import { getUploadUrl, deleteObject } from '@/lib/r2'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface PostRequestBody {
  contentType: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as PostRequestBody
  const { contentType } = body

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  const fileExtension = contentType.split("/")[1]
  const key = `avatars/${session.user.id}/${Date.now()}.${fileExtension}`

  const uploadUrl = await getUploadUrl({
    key,
    contentType
  })

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ uploadUrl, publicUrl })
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get current avatar URL from DB
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { avatar: true }
    })

    if (profile?.avatar) {
      // Extract R2 key from public URL
      const url = new URL(profile.avatar)
      const key = url.pathname.substring(1) // Remove leading "/"

      // Delete from R2
      await deleteObject(key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete avatar error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
