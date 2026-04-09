import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  getVideoUploadUrl,
  isValidVideoType,
  MAX_VIDEO_SIZE,
  ALLOWED_VIDEO_TYPES
} from '@/lib/r2-video'

const uploadUrlRequestSchema = z.object({
  contentType: z.string().refine(
    (val) => isValidVideoType(val),
    { message: `Content type must be one of: ${ALLOWED_VIDEO_TYPES.join(', ')}` }
  ),
  fileSize: z.number().max(MAX_VIDEO_SIZE, {
    message: `File size must be less than ${MAX_VIDEO_SIZE / 1_000_000}MB`
  })
})

interface UploadUrlResponse {
  uploadUrl: string
  key: string
}

interface ErrorResponse {
  error: string
}

export async function POST(
  request: Request
): Promise<NextResponse<UploadUrlResponse | ErrorResponse>> {
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = uploadUrlRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e) => e.message)
        .join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { contentType } = validationResult.data

    // Generate unique key for video
    const key = `shorts/${companyProfile.id}/${nanoid()}`

    // Get presigned URL from R2
    const uploadUrl = await getVideoUploadUrl({ key, contentType })

    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error('Video upload URL generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
