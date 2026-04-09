import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

const BUCKET = process.env.R2_BUCKET_NAME!

export interface UploadUrlOptions {
  key: string
  contentType: string
  expiresIn?: number
}

export async function getUploadUrl({
  key,
  contentType,
  expiresIn = 3600
}: UploadUrlOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

export interface DownloadUrlOptions {
  key: string
  expiresIn?: number
}

export async function getDownloadUrl({
  key,
  expiresIn = 3600
}: DownloadUrlOptions): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

export function getPublicUrl(key: string): string {
  const baseUrl = process.env.R2_PUBLIC_URL || `https://${BUCKET}.r2.dev`
  return `${baseUrl}/${key}`
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  })

  await r2Client.send(command)
}
