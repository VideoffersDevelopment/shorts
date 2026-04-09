import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * R2 Video Client for managing video uploads and HLS streaming
 * Uses separate buckets for raw videos and HLS processed content
 */
const r2VideoClient = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

const RAW_BUCKET = process.env.R2_VIDEO_RAW_BUCKET!
const HLS_BUCKET = process.env.R2_VIDEO_HLS_BUCKET!
const HLS_PUBLIC_URL = process.env.R2_VIDEO_HLS_PUBLIC_URL!
const RAW_PUBLIC_URL = process.env.R2_VIDEO_RAW_PUBLIC_URL!

export interface VideoUploadUrlOptions {
  key: string
  contentType: string
  expiresIn?: number
}

export interface VideoDownloadUrlOptions {
  key: string
  expiresIn?: number
}

/**
 * Generate a presigned URL for uploading raw video to R2
 */
export async function getVideoUploadUrl({
  key,
  contentType,
  expiresIn = 3600
}: VideoUploadUrlOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: RAW_BUCKET,
    Key: key,
    ContentType: contentType
  })

  return getSignedUrl(r2VideoClient, command, { expiresIn })
}

/**
 * Generate a presigned URL for downloading raw video from R2
 */
export async function getVideoDownloadUrl({
  key,
  expiresIn = 3600
}: VideoDownloadUrlOptions): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: RAW_BUCKET,
    Key: key
  })

  return getSignedUrl(r2VideoClient, command, { expiresIn })
}

/**
 * Get the public URL for raw video (before HLS processing)
 * Used as fallback during QENCODE transcoding
 * Raw bucket is configured with public access
 *
 * IMPORTANT: R2_VIDEO_RAW_PUBLIC_URL must be set in .env
 * Format: https://pub-XXXX.r2.dev (from Cloudflare R2 dashboard)
 */
export function getRawVideoPublicUrl(rawVideoKey: string): string {
  const baseUrl = RAW_PUBLIC_URL || `https://${RAW_BUCKET}.r2.dev`
  return `${baseUrl}/${rawVideoKey}`
}

/**
 * Get the public URL for HLS playlist
 * HLS bucket is configured with public access
 */
export function getHlsPublicUrl(key: string): string {
  const baseUrl = HLS_PUBLIC_URL || `https://${HLS_BUCKET}.r2.dev`
  return `${baseUrl}/${key}`
}

/**
 * Get the public URL for auto-generated thumbnail
 *
 * Qencode saves thumbnails with the same path as the HLS directory,
 * but without the trailing slash (i.e., as a file, not a folder).
 * Example: shorts/{companyId}/{shortId} (no extension, it's a PNG)
 */
export function getThumbnailPublicUrl(companyId: string, shortId: string): string {
  const baseUrl = HLS_PUBLIC_URL || `https://${HLS_BUCKET}.r2.dev`
  return `${baseUrl}/shorts/${companyId}/${shortId}`
}

/**
 * Delete a video object from raw bucket
 */
export async function deleteVideoObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: RAW_BUCKET,
    Key: key
  })

  await r2VideoClient.send(command)
}

/**
 * Allowed video content types for upload
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm'
] as const

export type AllowedVideoType = typeof ALLOWED_VIDEO_TYPES[number]

/**
 * Maximum file size for video uploads (100MB)
 */
export const MAX_VIDEO_SIZE = 100_000_000

/**
 * Check if content type is allowed for video upload
 */
export function isValidVideoType(contentType: string): contentType is AllowedVideoType {
  return ALLOWED_VIDEO_TYPES.includes(contentType as AllowedVideoType)
}
