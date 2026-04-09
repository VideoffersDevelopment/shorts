# Shorts Upload Feature

**Status:** Implemented (Stage 03)
**Components:** VideoUploadWizard, VideoDropzone, ShortMetadataForm

---

## Overview

Multi-step wizard for uploading video shorts with direct-to-R2 upload, client-side validation, and metadata capture.

---

## User Flow

```
Step 1: Video Upload     Step 2: Metadata        Step 3: Thumbnail      Step 4: Review
+----------------+       +----------------+       +----------------+      +----------------+
| Drag & Drop    |       | Title          |       | Auto/Custom    |      | Summary        |
| or File Picker |  -->  | Description    |  -->  | Thumbnail      | -->  | Preview        |
| Progress Bar   |       | Category/Tags  |       | Selection      |      | Save as Draft  |
+----------------+       | Location/CTA   |       +----------------+      +----------------+
```

---

## Technical Implementation

### Step 1: Video Upload

**Component:** `VideoDropzone`

```typescript
interface VideoDropzoneProps {
  onUploadComplete: (data: { key: string; duration: number; aspectRatio: string }) => void
  onUploadError: (error: string) => void
  maxSizeMB?: number  // default: 100
  maxDurationSec?: number  // default: 60
}
```

**Validation Rules:**
- Formats: MP4, MOV, WebM
- Max size: 100MB
- Max duration: 60 seconds
- Recommended aspect ratio: 9:16 (warning if different)

**Upload Process:**
1. Client-side validation (format, size)
2. Video duration/aspect detection via HTML5 video element
3. Request presigned URL from `/api/shorts/upload-url`
4. Direct upload to R2 using XMLHttpRequest (for progress)
5. Return video key on success

### Step 2: Metadata

**Component:** `ShortMetadataForm`

```typescript
interface ShortMetadataFormProps {
  defaultValues?: Partial<ShortMetadataInput>
  companyCategory?: string
  companyLocation?: { lat: number; lng: number; address: string }
  onSubmit: (data: ShortMetadataInput) => void
}
```

**Fields:**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Title | text | max 100 chars | Yes |
| Description | textarea | max 500 chars | No |
| Category | select | from database | Yes |
| Tags | autocomplete | max 10 tags | No |
| Location | map picker | lat/lng/address | No |
| CTA Link | url | valid URL | No |

### Step 3: Thumbnail

**Component:** `ThumbnailSelector`

```typescript
interface ThumbnailSelectorProps {
  videoKey?: string
  value: { type: 'auto' | 'custom'; url?: string }
  onChange: (value: { type: 'auto' | 'custom'; url?: string }) => void
}
```

**Options:**
- **Auto:** Extracted from video by Qencode during transcoding
- **Custom:** Upload custom thumbnail (1080x1920, max 2MB)

### Step 4: Review

Displays summary of all entered data with:
- Video preview (HTML5 player)
- All metadata fields
- Edit buttons for each section
- "Save as Draft" button

---

## Server Action

**File:** `src/app/actions/shorts/create.ts`

```typescript
export async function createShortAction(
  data: unknown
): Promise<ActionResult<{ shortId: string }>>
```

**Flow:**
1. AUTH - Verify session
2. AUTHORIZATION - Verify company profile exists and is ACTIVE
3. LIMIT - Check max 10 drafts per company
4. VALIDATION - Validate with Zod schema
5. TRANSACTION:
   - Create Short record
   - Create/upsert Tags
   - Create ShortTag junction records
   - Create ShortStats record
6. revalidatePath
7. Return shortId

---

## API Endpoints

### POST /api/shorts/upload-url

Generate presigned URL for video upload.

**Request:**
```typescript
{
  contentType: string  // "video/mp4" | "video/quicktime" | "video/webm"
  fileSize: number     // bytes
}
```

**Response:**
```typescript
{
  uploadUrl: string   // R2 presigned PUT URL
  key: string         // Storage key
}
```

**Validations:**
- Auth required
- Company profile required
- Valid content type
- File size <= 100MB
- Rate limit: 10 uploads/hour per company

### POST /api/shorts/thumbnail-url

Generate presigned URL for custom thumbnail.

**Request:**
```typescript
{
  contentType: string  // "image/jpeg" | "image/png"
  shortId?: string     // Optional, for linking
}
```

**Response:**
```typescript
{
  uploadUrl: string
  key: string
  publicUrl: string
}
```

### GET /api/tags/search

Search existing tags for autocomplete.

**Query:** `?q=keyword`

**Response:**
```typescript
{
  tags: Array<{
    id: string
    name: string
    usageCount: number
  }>
}
```

---

## R2 Storage

**Bucket:** `R2_VIDEO_RAW_BUCKET`

**Key Format:** `shorts/{companyId}/{nanoid()}.{ext}`

**Functions:**

```typescript
// src/lib/r2-video.ts
export async function getVideoUploadUrl(options: VideoUploadUrlOptions): Promise<string>
export async function getVideoDownloadUrl(options: VideoDownloadUrlOptions): Promise<string>
export async function deleteVideoObject(key: string): Promise<void>
```

---

## Usage Example

```tsx
import { VideoUploadWizard } from '@/components/shorts/video-upload-wizard'

export default function NewShortPage({ company }) {
  return (
    <VideoUploadWizard
      companyId={company.id}
      defaultCategoryId={company.categoryId}
      defaultLocation={{
        lat: company.latitude,
        lng: company.longitude,
        address: company.city
      }}
      onComplete={(shortId) => router.push(`/panel/shorts/${shortId}`)}
      onCancel={() => router.push('/panel/shorts')}
    />
  )
}
```

---

## Error Handling

| Error Code | Message | Cause |
|------------|---------|-------|
| `UNAUTHORIZED` | Not logged in | Missing session |
| `NOT_COMPANY` | Not a company account | User role is not COMPANY |
| `NO_COMPANY_PROFILE` | No company profile | Company profile not created |
| `COMPANY_NOT_ACTIVE` | Company not active | Company status is not ACTIVE |
| `MAX_DRAFTS_EXCEEDED` | Too many drafts | Already 10 drafts |
| `CREATE_FAILED` | Creation failed | Database error |

---

## Related Documentation

- [Shorts Management](./management.md)
- [Publishing Workflow](./publishing.md)
- [createShortAction](../../api/server-actions/shorts.md#createshortaction)

---

**Implemented:** 2025-12-31
**Last Updated:** 2026-01-01
