# Publishing Workflow

**Status:** Implemented (Stage 03)
**Components:** PublishDialog, ProcessingStatusTimeline, ShortPlayer

---

## Overview

The publishing workflow handles the transition from DRAFT to PUBLISHED, including credit verification, video transcoding, and status tracking.

---

## Publication Flow

```
                        +----------------+
                        |   DRAFT Short  |
                        +-------+--------+
                                |
                                v
                    +-----------+-----------+
                    |  Click "Publish"      |
                    +-----------+-----------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
        +-------+-------+               +-------+-------+
        | Credits > 0   |               | Credits = 0   |
        +-------+-------+               +-------+-------+
                |                               |
                v                               v
        +-------+-------+               +-------+-------+
        | Deduct Credit |               | Redirect to   |
        | Start Process |               | Payment       |
        +-------+-------+               +-------+-------+
                |                               |
                v                               |
        +-------+-------+                       |
        | PROCESSING    |<----------------------+
        +-------+-------+    (after payment success)
                |
                v
        +-------+-------+
        | Qencode       |
        | Transcoding   |
        +-------+-------+
                |
                v
        +-------+-------+
        | PUBLISHED     |
        | (30 days)     |
        +-------+-------+
```

---

## Server Action

**File:** `src/app/actions/shorts/publish.ts`

```typescript
export async function publishShortAction(
  shortId: string
): Promise<ActionResult<{
  redirectUrl?: string
  processing?: boolean
  requiresPayment?: boolean
  requiresVerification?: boolean
}>>
```

### Flow

1. **AUTH + AUTHORIZATION**
   - Verify session
   - Verify company ownership

2. **STATUS CHECK**
   - Short must be DRAFT

3. **VERIFICATION CHECK**
   - Company must have `viesVerified: true`
   - If not verified: return `{ requiresVerification: true }`

4. **CREDIT CHECK**
   - If `user.publicationCredits > 0`:
     - Deduct 1 credit
     - Create CreditTransaction (source: PUBLICATION)
     - Update short status -> PROCESSING
     - Send Inngest event: `shorts/transcode.started`
     - Return `{ processing: true, redirectUrl: /publishing }`
   - If no credits:
     - Return `{ requiresPayment: true }`

---

## PublishDialog Component

```typescript
interface PublishDialogProps {
  shortId: string
  shortTitle: string
  companyVerified: boolean
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

### States

**State 1: Company Not Verified**
```
+-------------------------------------------+
| Verification Required                     |
|                                           |
| Your company must be verified before      |
| publishing shorts.                        |
|                                           |
|         [Verify Company]                  |
+-------------------------------------------+
```

**State 2: Has Credits**
```
+-------------------------------------------+
| Publish Short                             |
|                                           |
| You have 5 publication credits.           |
| Publishing will use 1 credit.             |
|                                           |
|         [Cancel]  [Publish Now]           |
+-------------------------------------------+
```

**State 3: No Credits**
```
+-------------------------------------------+
| Purchase Credits to Publish               |
|                                           |
| You have 0 publication credits.           |
| Choose a payment provider:                |
|                                           |
| (o) Przelewy24   ( ) Tpay                 |
|                                           |
|         [Cancel]  [Pay 5.00 PLN]          |
+-------------------------------------------+
```

---

## Video Transcoding

### Qencode Integration

**File:** `src/lib/qencode.ts`

```typescript
export async function startQencodeJob(options: QencodeJobOptions): Promise<QencodeJobResult>
export function verifyQencodeSignature(rawBody: string, signature: string | null): boolean
```

### Transcoding Profile

```typescript
const HLS_PROFILE = {
  format: "advanced_hls",
  segment_duration: 4,
  streams: [
    { size: "1080x1920", bitrate: 4500, profile: "high" },   // 1080p
    { size: "720x1280", bitrate: 2500, profile: "main" },    // 720p
    { size: "480x854", bitrate: 1000, profile: "main" }      // 480p
  ]
}
```

### Inngest Functions

**Start Transcoding:**
```typescript
// src/lib/inngest/functions/process-video.ts
export const startTranscoding = inngest.createFunction(
  { id: "start-transcoding" },
  { event: "shorts/transcode.started" },
  async ({ event, step }) => {
    // 1. Get short from DB
    // 2. Get presigned download URL for raw video
    // 3. Start Qencode job
    // 4. Update short with qencodeTaskId
  }
)
```

**Cleanup Raw Video:**
```typescript
// src/lib/inngest/functions/cleanup-video.ts
export const cleanupRawVideo = inngest.createFunction(
  { id: "cleanup-raw-video" },
  { event: "shorts/transcode.completed" },
  async ({ event, step }) => {
    // Delete raw video from R2 video-raw bucket
  }
)
```

### Qencode Webhook

**Endpoint:** `POST /api/webhooks/qencode`

**On Success:**
1. Verify signature
2. Find short by qencodeTaskId
3. Update hlsPlaylistUrl, thumbnailUrl, duration
4. Set status = PUBLISHED
5. Set publishedAt, expiresAt (30 days)
6. Send Inngest event for cleanup
7. Send "short published" email

**On Error:**
1. Increment retryCount
2. If retryCount < 3: retry transcoding
3. If retryCount >= 3: refund credit, notify user

---

## Processing Status Page

**Route:** `/panel/shorts/[id]/publishing`

**Component:** `ProcessingStatusTimeline`

```typescript
interface ProcessingStatusTimelineProps {
  status: ShortStatus
  paymentStatus?: PaymentStatus
  processingError?: string
  estimatedTimeRemaining?: number
}
```

### Timeline Steps

```
+-------------------------------------------+
|  1. Draft Created           [checkmark]   |
|  2. Payment Received        [checkmark]   |
|  3. Processing Video        [spinner]     |
|     Usually takes 2-5 minutes             |
|  4. Publishing Soon         [pending]     |
+-------------------------------------------+
```

### Polling

- Poll `/api/shorts/[id]/status` every 5 seconds
- Auto-redirect to `/shorts/[id]` when status = PUBLISHED

---

## Status API

**Endpoint:** `GET /api/shorts/[id]/status`

**Response:**
```typescript
{
  status: ShortStatus
  processingError?: string
  hlsPlaylistUrl?: string
  estimatedTimeRemaining?: number
}
```

---

## Email Notifications

### Processing Complete

**Template:** `src/emails/short-published.tsx`

```
Subject: Your short "Summer Sale" is now live!

Hi [Company Name],

Great news! Your video short has been published and is now
visible to viewers.

[View Your Short]

Stats will start appearing as viewers watch your content.

Your short will be visible for 30 days until [expiry date].

- The VideoShorts Team
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Payment failed | Email notification, retry option |
| Transcoding failed (1-2x) | Auto-retry with exponential backoff |
| Transcoding failed (3x) | Refund credit, email notification |
| Webhook signature invalid | 401 Unauthorized |

---

## Related Documentation

- [Shorts Upload](./upload.md)
- [Credits System](../payments/credits.md)
- [Qencode Integration](../../guides/qencode-integration.md)

---

**Implemented:** 2025-12-31
**Last Updated:** 2026-01-01
