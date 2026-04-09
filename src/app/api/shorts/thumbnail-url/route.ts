import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { getUploadUrl, getPublicUrl } from '@/lib/r2'

const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png'] as const
type AllowedThumbnailType = typeof ALLOWED_THUMBNAIL_TYPES[number]

function isValidThumbnailType(contentType: string): contentType is AllowedThumbnailType {
  return ALLOWED_THUMBNAIL_TYPES.includes(contentType as AllowedThumbnailType)
}

function getExtensionFromContentType(contentType: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }
  return extensionMap[contentType] || 'jpg'
}

const MAX_THUMBNAIL_SIZE = 2_000_000 // 2MB

const thumbnailUrlRequestSchema = z.object({
  contentType: z.string().refine(
    (val) => isValidThumbnailType(val),
    { message: `Content type must be one of: ${ALLOWED_THUMBNAIL_TYPES.join(', ')}` }
  ),
  fileSize: z.number().int().positive().max(MAX_THUMBNAIL_SIZE, 'File size must not exceed 2MB'),
  shortId: z.string().optional()
})

interface ThumbnailUrlResponse {
  uploadUrl: string
  key: string
  publicUrl: string
}

interface ErrorResponse {
  error: string
}

export async function POST(
  request: Request
): Promise<NextResponse<ThumbnailUrlResponse | ErrorResponse>> {
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
    const validationResult = thumbnailUrlRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e) => e.message)
        .join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { contentType, shortId } = validationResult.data

    // Generate unique key for thumbnail
    const extension = getExtensionFromContentType(contentType)
    const folder = shortId || nanoid()
    const key = `thumbnails/${companyProfile.id}/${folder}/${nanoid()}.${extension}`

    // Get presigned URL from R2 (uses main bucket for images)
    const uploadUrl = await getUploadUrl({ key, contentType })
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, key, publicUrl })
  } catch (error) {
    console.error('Thumbnail upload URL generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
