# Task 04: Qencode Integration + Inngest Jobs

## Overview

**Priority:** HIGH
**Dependencies:** Task 02
**Complexity:** Medium (12 files, ~12k tokens)
**Status:** pending

## What to Build

Video transcoding pipeline and background job system:
1. Qencode API client for transcoding
2. Inngest functions for video processing
3. Qencode webhook handler
4. Processing status API endpoint
5. Processing status timeline UI
6. Video player component (@vidstack/react)
7. Publishing status page
8. Publish server action
9. Email template for processing complete

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/qencode.ts` | Create | Qencode API client (start job, verify signature) |
| `src/lib/inngest/functions/process-video.ts` | Create | Start transcoding Inngest function |
| `src/lib/inngest/functions/cleanup-video.ts` | Create | Cleanup raw video after transcode |
| `src/app/api/inngest/route.ts` | Create | Inngest API route handler |
| `src/app/api/webhooks/qencode/route.ts` | Create | Qencode webhook handler |
| `src/app/api/shorts/[id]/status/route.ts` | Create | Short processing status endpoint |
| `src/components/shorts/processing-status-timeline.tsx` | Create | Status timeline component |
| `src/components/shorts/short-player.tsx` | Create | HLS video player (@vidstack/react) |
| `src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx` | Create | Processing status page |
| `src/app/actions/shorts/publish.ts` | Create | Publish short server action |
| `src/lib/email/templates/processing-complete.tsx` | Create | Email for "Your short is live!" |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/email/index.ts` | Add sendProcessingCompleteEmail function |

## Implementation Details

### 1. Qencode Client

**File:** `src/lib/qencode.ts`

```typescript
interface QencodeJobOptions {
  inputUrl: string
  outputBucket: string
  outputPath: string
  webhookUrl: string
}

export async function startQencodeJob(options: QencodeJobOptions): Promise<string>
// Returns task_token

export function verifyQencodeSignature(rawBody: string, signature: string | null): boolean
// HMAC-SHA256 verification
```

**Transcoding Profile:**
- Output: HLS (advanced_hls)
- Segment duration: 4 seconds
- Streams:
  - 1080p: 1080x1920, 4500kbps, high profile
  - 720p: 720x1280, 2500kbps, main profile
  - 480p: 480x854, 1000kbps, main profile

### 2. Inngest Functions

**process-video.ts:**
```typescript
export const startTranscoding = inngest.createFunction(
  { id: "start-transcoding", name: "Start Video Transcoding" },
  { event: "shorts/transcode.started" },
  async ({ event, step }) => {
    // 1. Get short from DB
    // 2. Get presigned download URL for raw video
    // 3. Start Qencode job
    // 4. Update short with qencodeTaskId
  }
)
```

**cleanup-video.ts:**
```typescript
export const cleanupRawVideo = inngest.createFunction(
  { id: "cleanup-raw-video", name: "Cleanup Raw Video from R2" },
  { event: "shorts/transcode.completed" },
  async ({ event, step }) => {
    // Delete raw video from R2 video-raw bucket
  }
)
```

### 3. Qencode Webhook Handler

**File:** `src/app/api/webhooks/qencode/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Verify signature
  // 2. Parse payload
  // 3. Find short by qencodeTaskId
  // 4. On success:
  //    - Update hlsPlaylistUrl, thumbnailUrl, duration
  //    - Set status = PUBLISHED
  //    - Set publishedAt, expiresAt (30 days)
  //    - Send "shorts/transcode.completed" event
  // 5. On error:
  //    - Increment retryCount
  //    - If retryCount < 3: send "shorts/transcode.retry" event
  //    - If retryCount >= 3: refund credit, notify user
}
```

### 4. Processing Status API

**File:** `src/app/api/shorts/[id]/status/route.ts`

```typescript
// GET /api/shorts/[id]/status
// Response: {
//   status: ShortStatus,
//   processingError?: string,
//   hlsPlaylistUrl?: string,
//   estimatedTimeRemaining?: number
// }
```

### 5. ProcessingStatusTimeline Component

```typescript
interface ProcessingStatusTimelineProps {
  status: ShortStatus
  paymentStatus?: PaymentStatus
  processingError?: string
  estimatedTimeRemaining?: number
}

// Timeline steps:
// 1. Draft created (always complete)
// 2. Payment received (if applicable)
// 3. Processing video (with spinner when active)
// 4. Publishing soon / Published (with checkmark when done)
```

### 6. ShortPlayer Component

```typescript
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react'
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default'

interface ShortPlayerProps {
  hlsUrl: string
  posterUrl?: string
  title: string
  autoPlay?: boolean
  muted?: boolean
  aspectRatio?: '9:16' | '16:9'
  onPlay?: () => void
  onEnded?: () => void
  className?: string
}
```

### 7. Publishing Status Page

```typescript
// Client component with polling
// Uses SWR or React Query to poll /api/shorts/[id]/status every 5 seconds
// Shows ProcessingStatusTimeline
// Auto-redirects to /shorts/[id] when status = PUBLISHED
```

### 8. Publish Server Action

```typescript
export async function publishShortAction(
  shortId: string
): Promise<ActionResult<{ redirectUrl?: string; processing?: boolean }>>

// Steps:
// 1. AUTH + AUTHORIZATION (company ownership)
// 2. STATUS CHECK (must be DRAFT)
// 3. VERIFICATION CHECK (company must be viesVerified)
// 4. CREDIT CHECK:
//    - If user.publicationCredits > 0:
//      - Deduct 1 credit
//      - Create CreditTransaction (source: PUBLICATION, amount: -1)
//      - Update short status -> PROCESSING
//      - Send "shorts/transcode.started" Inngest event
//      - Return { processing: true }
//    - If no credits:
//      - Return { requiresPayment: true }
// 5. revalidatePath
```

## Acceptance Criteria

- [ ] Qencode client can start transcoding jobs
- [ ] Webhook verifies signatures correctly
- [ ] Inngest functions registered and visible in Inngest dashboard
- [ ] Status endpoint returns correct short status
- [ ] Timeline component shows correct steps
- [ ] ShortPlayer plays HLS streams
- [ ] Publishing page polls and shows progress
- [ ] Auto-redirect works when published
- [ ] publishShortAction deducts credits correctly
- [ ] Processing complete email sends
- [ ] `npm run build` passes

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Inngest dev server: `npx inngest-cli@latest dev`
- Test draft short created (from Task 03)
- Test user with publicationCredits > 0

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to draft short | Detail page loads | `/panel/shorts/[id]` |
| 2 | Click "Publish" button | Confirmation dialog | `button:has-text("Publish")` |
| 3 | Confirm publish | Redirect to publishing page | `/panel/shorts/[id]/publishing` |
| 4 | Verify timeline | "Processing video..." step active | `.timeline-step.active` |
| 5 | Check Inngest dashboard | "start-transcoding" function running | Inngest dev UI |
| 6 | Wait for completion | Timeline shows "Published" | |
| 7 | Auto-redirect | Redirects to public view | `/shorts/[id]` |
| 8 | Verify player | HLS video plays | `.vidstack-player` |

### Webhook Testing (with ngrok)

```bash
# 1. Start ngrok
ngrok http 3000

# 2. Update Qencode webhook URL to ngrok URL
# 3. Trigger transcoding
# 4. Verify webhook received in terminal
```

### Screenshot Checkpoints

- `01-publish-dialog.png` - Publish confirmation
- `02-publishing-page.png` - Processing status timeline
- `03-published-redirect.png` - After auto-redirect
- `04-video-player.png` - HLS player working

## Notes

- Inngest dev server required for local testing
- For production, configure Inngest cloud
- Qencode sandbox available for testing
- Consider fallback polling if SSE not implemented
- ShortPlayer needs @vidstack/react styles imported
