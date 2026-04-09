# Task 02: R2 Video Module + Upload API

## Overview

**Priority:** HIGH
**Dependencies:** Task 01
**Complexity:** Simple (10 files, ~10k tokens)
**Status:** pending

## What to Build

R2 video storage infrastructure and upload APIs:
1. R2 video module for presigned URL generation
2. Video upload URL API endpoint
3. Thumbnail upload URL API endpoint
4. Tags search API endpoint
5. Translation files (shorts.json for all 6 locales)

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/r2-video.ts` | Create | R2 video bucket operations (upload/download/delete) |
| `src/app/api/shorts/upload-url/route.ts` | Create | Generate presigned PUT URL for video upload |
| `src/app/api/shorts/thumbnail-url/route.ts` | Create | Generate presigned PUT URL for custom thumbnail |
| `src/app/api/tags/search/route.ts` | Create | Search existing tags for autocomplete |
| `src/lib/locales/en/shorts.json` | Create | English translations for shorts |
| `src/lib/locales/pl/shorts.json` | Create | Polish translations for shorts |
| `src/lib/locales/de/shorts.json` | Create | German translations for shorts |
| `src/lib/locales/es/shorts.json` | Create | Spanish translations for shorts |
| `src/lib/locales/ru/shorts.json` | Create | Russian translations for shorts |
| `src/lib/locales/uk/shorts.json` | Create | Ukrainian translations for shorts |

## Implementation Details

### 1. R2 Video Module

**File:** `src/lib/r2-video.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2VideoClient = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

const VIDEO_RAW_BUCKET = process.env.R2_VIDEO_RAW_BUCKET!
const VIDEO_HLS_BUCKET = process.env.R2_VIDEO_HLS_BUCKET!

export interface VideoUploadUrlOptions {
  key: string
  contentType: string
  expiresIn?: number // default: 3600 (1 hour)
}

export async function getVideoUploadUrl(options: VideoUploadUrlOptions): Promise<string>
export async function getVideoDownloadUrl(options: { key: string; expiresIn?: number }): Promise<string>
export function getHlsPublicUrl(key: string): string
export async function deleteVideoObject(key: string): Promise<void>
```

### 2. Video Upload URL Endpoint

**File:** `src/app/api/shorts/upload-url/route.ts`

```typescript
// POST /api/shorts/upload-url
// Request: { contentType: string, fileSize: number }
// Response: { uploadUrl: string, key: string }

// Validations:
// - Auth required
// - Company profile required
// - Content type: video/mp4, video/quicktime, video/webm
// - File size: max 100MB
// - Rate limit: max 10 uploads per hour per company
```

### 3. Thumbnail Upload URL Endpoint

**File:** `src/app/api/shorts/thumbnail-url/route.ts`

```typescript
// POST /api/shorts/thumbnail-url
// Request: { contentType: string, shortId?: string }
// Response: { uploadUrl: string, key: string, publicUrl: string }

// Validations:
// - Auth required
// - Company profile required
// - Content type: image/jpeg, image/png
// - File size: max 2MB
```

### 4. Tags Search Endpoint

**File:** `src/app/api/tags/search/route.ts`

```typescript
// GET /api/tags/search?q=keyword
// Response: { tags: Array<{ id: string, name: string, usageCount: number }> }

// Features:
// - Case-insensitive search
// - Ordered by usageCount (most popular first)
// - Limit to 10 results
```

### 5. Translation Files

Create shorts.json in all 6 locales with full translation structure from architecture.

**Key sections:**
- meta (title, description)
- list (empty states)
- create (wizard steps)
- wizard (video, metadata, thumbnail, review sections)
- detail (field labels)
- status (DRAFT, PENDING_PAYMENT, PROCESSING, PUBLISHED, ARCHIVED, DELETED)
- actions (view, edit, publish, archive, etc.)
- publish (dialog content)
- publishing (processing status page)
- archive, delete, renew (confirmation dialogs)
- public (public view labels)
- table (column headers)
- filters (filter labels)
- errors (error messages)
- success (success messages)

## Acceptance Criteria

- [ ] R2 video module exports all functions
- [ ] `POST /api/shorts/upload-url` returns valid presigned URL
- [ ] `POST /api/shorts/thumbnail-url` returns valid presigned URL
- [ ] `GET /api/tags/search?q=test` returns matching tags
- [ ] All 6 translation files created with complete structure
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server running: `npm run dev` on localhost:3000
- Test user logged in with COMPANY role

### API Testing (via curl or browser console)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as test company user | Session established |
| 2 | Call `POST /api/shorts/upload-url` with `{ contentType: "video/mp4", fileSize: 1000000 }` | Returns `{ uploadUrl: "https://...", key: "shorts/..." }` |
| 3 | Call `POST /api/shorts/thumbnail-url` with `{ contentType: "image/jpeg" }` | Returns `{ uploadUrl: "https://...", key: "thumbnails/...", publicUrl: "..." }` |
| 4 | Call `GET /api/tags/search?q=test` | Returns `{ tags: [...] }` array |
| 5 | Call upload-url with invalid content type | Returns 400 error |
| 6 | Call upload-url with file size > 100MB | Returns 400 error |

### Translation Verification

```bash
# Check all translation files exist
ls src/lib/locales/*/shorts.json

# Validate JSON syntax
node -e "require('./src/lib/locales/en/shorts.json')"
node -e "require('./src/lib/locales/pl/shorts.json')"
```

## Notes

- Use existing R2 client pattern from `src/lib/r2.ts` as reference
- Video raw bucket uses the same R2 credentials as the images bucket
- Key format: `shorts/{companyId}/{nanoid()}` for videos
- Key format: `thumbnails/{companyId}/{shortId}/{nanoid()}.{ext}` for thumbnails
- Rate limiting can use simple Prisma count query for MVP
