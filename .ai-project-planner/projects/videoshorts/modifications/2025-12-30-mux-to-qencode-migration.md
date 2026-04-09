# Project Modification Report

**Project:** videoshorts
**Change:** Replace Mux with Serverless Video Pipeline (Cloudflare R2 + Qencode)
**Date:** 2025-12-30
**Agent:** project-modifier

---

## Summary

| Metric                      | Value |
| --------------------------- | ----- |
| Files Modified              | 5     |
| Sections Updated            | 35+   |
| Occurrences Replaced        | 80+   |
| Implemented Stages Affected | 0     |

---

## Change Analysis

**What is changing:**
- FROM: Mux (all-in-one video platform: upload, transcode, CDN, analytics)
- TO: Serverless Video Pipeline (Cloudflare R2 + Qencode + Vidstack + PostHog)

**Scope:**
- Video upload architecture (Mux direct upload → R2 presigned PUT)
- Transcoding service (Mux automatic → Qencode API)
- Video storage (Mux CDN → R2 public bucket with Cloudflare CDN)
- Video player (@mux/mux-player-react → @vidstack/react)
- Video analytics (Mux Data → PostHog custom events)
- Webhooks (Mux webhooks → Qencode callbacks)
- Database schema (muxAssetId/muxPlaybackId → qencodeTaskId/hlsPlaylistUrl/rawVideoKey)
- Environment variables

**Keywords to search and replace:**
- "Mux" → "Qencode" / "R2" / "Cloudflare" (context-dependent)
- "mux" → appropriate replacement
- "muxAssetId" → "qencodeTaskId"
- "muxPlaybackId" → "hlsPlaylistUrl"
- "@mux/mux-node" → "qencode-api-client"
- "@mux/mux-player-react" → "@vidstack/react"
- "Mux Data" → "PostHog video events"

---

## Implementation Status

| Stage | Name              | Status         | Affected by Change?           |
| ----- | ----------------- | -------------- | ----------------------------- |
| 01    | Core Auth         | ✅ Completed   | ❌ No                         |
| 02    | Companies         | ⏳ Not started | ❌ No                         |
| 03    | Shorts + Payments | ⏳ Not started | ✅ YES - main video pipeline  |
| 04    | Feed              | ⏳ Not started | ✅ YES - video playback       |
| 05    | Interactions      | ⏳ Not started | ❌ No                         |
| 06    | Moderation        | ⏳ Not started | ❌ No                         |
| 07    | Analytics         | ⏳ Not started | ✅ YES - video analytics      |
| 08    | Notifications     | ⏳ Not started | ❌ No                         |

**Stage 03, 04, 07 are NOT YET implemented.**
✅ Safe to modify - no code changes needed.

---

## New Architecture Components

### 1. R2 Buckets Configuration

```
video-raw bucket:
├─ Access: Private
├─ Lifecycle: 24h auto-delete
├─ CORS: Enabled for upload domains
└─ Purpose: Temporary raw video storage

video-hls bucket:
├─ Access: Public
├─ CDN: Enabled (Cloudflare)
├─ Cache headers: Configured per file type
└─ Purpose: HLS output storage and delivery
```

### 2. Qencode Transcoding Profile

```json
{
  "format": "advanced_hls",
  "segment_duration": 5,
  "profile": "high",
  "streams": [
    { "size": "1080x1920", "bitrate": 4500, "codec": "h264" },
    { "size": "720x1280", "bitrate": 2500, "codec": "h264" },
    { "size": "480x854", "bitrate": 1000, "codec": "h264" }
  ],
  "aspect_ratio": "9:16"
}
```

### 3. Cache Headers (Cloudflare)

```
.ts segments:    Cache-Control: max-age=31536000, immutable (1 rok)
.m3u8 playlists: Cache-Control: max-age=3600 (1 godzina)
.jpg thumbnails: Cache-Control: max-age=31536000, immutable
```

### 4. Database Schema Changes

```prisma
// REMOVED
muxAssetId     String?     @unique
muxPlaybackId  String?     @unique
muxUploadId    String?
@@index([muxAssetId])

// ADDED
qencodeTaskId    String?     @unique    // Qencode task ID
hlsPlaylistUrl   String?                // R2 public URL to master.m3u8
rawVideoKey      String?                // R2 key in video-raw bucket
@@index([qencodeTaskId])
```

### 5. Environment Variables

```env
# REMOVED
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# ADDED
QENCODE_API_KEY=
QENCODE_WEBHOOK_SECRET=
R2_VIDEO_RAW_BUCKET=video-raw
R2_VIDEO_HLS_BUCKET=video-hls
R2_VIDEO_PUBLIC_URL=https://video.videoshorts.pl
```

### 6. API Routes

```
# REMOVED
POST /api/webhooks/mux

# ADDED
POST /api/webhooks/qencode
POST /api/shorts/:id/trigger-transcode
GET  /api/shorts/:id/transcode-status
```

### 7. Video Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  R2 Raw     │────▶│   Qencode   │
│  (Upload)   │     │  (24h TTL)  │     │ (transcode) │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◀────│  CF CDN     │◀────│  R2 HLS     │
│ (Playback)  │     │  (cached)   │     │  (public)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 8. HLS Output Structure (R2 video-hls bucket)

```
shorts/{shortId}/
├── master.m3u8          # Master playlist
├── 1080p/
│   ├── playlist.m3u8    # 1080p playlist
│   └── segment_*.ts     # 1080p segments
├── 720p/
│   ├── playlist.m3u8
│   └── segment_*.ts
├── 480p/
│   ├── playlist.m3u8
│   └── segment_*.ts
└── thumbnail.jpg        # Auto-extracted
```

---

## Video Upload & Publish Flow

```
1. Company creates short draft
   POST /api/shorts
   → Creates Short record (status: DRAFT)
   → Returns shortId

2. Company requests upload URL
   POST /api/shorts/:id/upload-url
   → Generates presigned PUT URL for R2 video-raw bucket
   → Returns {uploadUrl, rawVideoKey}
   → Saves rawVideoKey to Short record

3. Client uploads video directly to R2 (video-raw bucket)
   PUT https://<bucket>.r2.cloudflarestorage.com/...
   → Direct upload (client → R2, bypasses server)
   → video-raw bucket has 24h auto-delete policy

4. Company initiates publish
   POST /api/shorts/:id/publish
   → PublicationController.publish(userId, shortId)

   A. If company HAS credits (publicationCredits > 0):
      → PublicationController.publishWithCredits()
      → Decrement publicationCredits by 1
      → Create CreditTransaction (amount: -1)
      → Trigger Qencode transcoding job (step 8)
      → Update Short status: PROCESSING
      → Return success: true

   B. If company HAS NO credits (publicationCredits = 0):
      → PublicationController.createCheckoutSession()
      → Creates Payment Provider Checkout Session
      → Return success: false, needsPayment: true, checkoutUrl
      → Frontend redirects to Payment Provider Checkout

5. User completes payment (only if B)
   → Payment provider redirect to success page
   → Provider sends webhook: payment.succeeded

6. Webhook handler (only if B)
   POST /api/webhooks/[provider]
   → Verifies signature
   → Enqueues Inngest event: payment.succeeded

7. Inngest processes payment (only if B)
   → Updates Payment (status: SUCCEEDED)
   → PublicationController.addCreditsFromPayment()
   → Add credits (creditsGranted: 1)
   → Create CreditTransaction (amount: +1)
   → If payment linked with short: trigger transcoding (step 8)
   → Update Short status: PROCESSING

8. Trigger Qencode transcoding
   → Call Qencode API to start transcoding job:
     - Input: R2 video-raw presigned URL
     - Output: R2 video-hls bucket path
     - Profile: HLS, 4-6s segments, H.264 High/Main
     - Resolutions: 1080p (4500kbps), 720p (2500kbps), 480p (1000kbps)
     - Aspect ratio: 9:16
   → Save qencodeTaskId to Short record
   → Qencode processes video asynchronously

9. Qencode finishes transcoding
   → Sends webhook callback to our API
   POST /api/webhooks/qencode
   → Verify webhook authenticity
   → Update Short:
     - hlsPlaylistUrl: R2 public URL to master.m3u8
     - thumbnailUrl: extracted or generated thumbnail
     - duration: video duration in seconds
     - status: PUBLISHED
     - publishedAt: now()
   → Delete raw video from video-raw bucket (cleanup)
   → Enqueue Inngest event: short.published

10. Inngest finalizes publication
    → Sends notification email
    → Creates in-app notification
    → Schedules archivization job (30 days)

11. Short appears in feed
    → HLS streaming via Cloudflare CDN
    → Cache headers: .ts/.jpg → 1 year, .m3u8 → 1 hour
    → Indexed for search
    → Visible to users

FLOW SUMMARY:
- With credits: DRAFT → PROCESSING (step 4A+8) → PUBLISHED (step 9-10)
- Without credits: DRAFT → PENDING_PAYMENT (step 4B) → payment → PROCESSING (step 7+8) → PUBLISHED (step 9-10)
```

---

## Code Examples

### R2 Upload Client

```typescript
// src/lib/video-pipeline/r2-upload.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateUploadUrl(shortId: string) {
  const rawVideoKey = `uploads/${shortId}/${Date.now()}.mp4`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_VIDEO_RAW_BUCKET,
    Key: rawVideoKey,
    ContentType: 'video/mp4',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  return { uploadUrl, rawVideoKey };
}

export async function deleteRawVideo(rawVideoKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_VIDEO_RAW_BUCKET,
    Key: rawVideoKey,
  });

  await s3Client.send(command);
}
```

### Qencode Client

```typescript
// src/lib/video-pipeline/qencode.ts
const QENCODE_API_URL = 'https://api.qencode.com/v1';

export async function startTranscodeJob(shortId: string, rawVideoKey: string) {
  const inputUrl = await generatePresignedReadUrl(rawVideoKey);
  const outputPath = `shorts/${shortId}/`;

  const response = await fetch(`${QENCODE_API_URL}/start_encode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.QENCODE_API_KEY}`,
    },
    body: JSON.stringify({
      query: {
        source: inputUrl,
        format: [{
          output: 'advanced_hls',
          destination: {
            url: `s3://${process.env.R2_VIDEO_HLS_BUCKET}/${outputPath}`,
            credentials: {
              access_key: process.env.R2_ACCESS_KEY_ID,
              secret_key: process.env.R2_SECRET_ACCESS_KEY,
            },
          },
          stream: [
            { size: '1080x1920', bitrate: 4500 },
            { size: '720x1280', bitrate: 2500 },
            { size: '480x854', bitrate: 1000 },
          ],
          segment_duration: 5,
          profile: 'high',
        }],
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/qencode`,
    }),
  });

  const data = await response.json();
  return { qencodeTaskId: data.task_token };
}

export async function getTranscodeStatus(taskId: string) {
  const response = await fetch(`${QENCODE_API_URL}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.QENCODE_API_KEY}`,
    },
    body: JSON.stringify({ task_tokens: [taskId] }),
  });

  return response.json();
}
```

### Inngest Background Jobs

```typescript
// src/inngest/functions/video-processing.ts
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/prisma';
import { deleteRawVideo } from '@/lib/video-pipeline/r2-upload';
import { startTranscodeJob } from '@/lib/video-pipeline/qencode';

// Qencode transcode complete → publish short
export const handleQencodeCompleted = inngest.createFunction(
  { id: 'qencode-job-completed' },
  { event: 'qencode/job.completed' },
  async ({ event }) => {
    const { taskId, hlsPlaylistUrl, duration, thumbnailUrl } = event.data;

    const short = await prisma.short.findUnique({
      where: { qencodeTaskId: taskId },
      include: { company: true },
    });

    if (!short) return;

    // Update short
    await prisma.short.update({
      where: { id: short.id },
      data: {
        status: 'PUBLISHED',
        hlsPlaylistUrl,
        duration,
        thumbnailUrl,
        publishedAt: new Date(),
        expiresAt: addDays(new Date(), 30),
      },
    });

    // Cleanup raw video from video-raw bucket
    if (short.rawVideoKey) {
      await deleteRawVideo(short.rawVideoKey);
    }

    // Send notification email
    await sendEmail({
      to: short.company.email,
      template: 'ShortPublished',
      data: { shortId: short.id, title: short.title },
    });
  }
);

// Qencode transcode failed → handle error
export const handleQencodeFailed = inngest.createFunction(
  { id: 'qencode-job-failed' },
  { event: 'qencode/job.failed' },
  async ({ event }) => {
    const { taskId, error } = event.data;

    const short = await prisma.short.findUnique({
      where: { qencodeTaskId: taskId },
      include: { company: true },
    });

    if (!short) return;

    // Increment retry count
    const retryCount = (short.retryCount || 0) + 1;

    if (retryCount < 3) {
      await prisma.short.update({
        where: { id: short.id },
        data: { retryCount },
      });

      // Retry transcoding
      if (short.rawVideoKey) {
        await startTranscodeJob(short.id, short.rawVideoKey);
      }
    } else {
      // Max retries reached - refund and notify
      await prisma.short.update({
        where: { id: short.id },
        data: {
          status: 'DRAFT',
          processingError: error,
        },
      });

      // Refund credit
      await publicationController.refundCredit(short.companyId, short.id);

      // Notify user
      await sendEmail({
        to: short.company.email,
        template: 'TranscodeFailed',
        data: { shortId: short.id, title: short.title, error },
      });
    }
  }
);
```

---

## Benefits of This Change

1. **Cost Optimization:** Pay-per-use transcoding vs Mux monthly fees
2. **Control:** Full control over video storage and CDN caching
3. **Flexibility:** Can switch transcoding providers if needed
4. **Integration:** R2 already used for images, consistent storage layer
5. **Scalability:** Cloudflare CDN handles global delivery
6. **Data Ownership:** Video files stored in own R2 buckets

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Qencode transcoding failures | High | Retry logic (max 3x), 24h raw retention, refund flow |
| R2 upload failures | Medium | Client-side retry, progress indicator, presigned URL refresh |
| Increased implementation complexity | Medium | Well-documented API, clear error handling |
| Cache invalidation needed | Low | Long cache TTLs, versioned URLs if needed |
| Missing Mux Data analytics | Medium | PostHog video events provide similar insights |

---

## Documentation Modified

- architecture-plan.md (10 sections)
- project-spec.md (7 sections)
- stages/stage-03-shorts-payments/spec.md (12 sections)
- stages/stage-07-analytics/spec.md (4 sections)
- stages/index.md (2 sections)

---

## Next Steps for Implementation

1. **Create R2 buckets:**
   - video-raw (private, 24h lifecycle)
   - video-hls (public, CDN enabled)

2. **Configure CORS on R2:**
   - Allow uploads from localhost:3000 and production domain

3. **Set up Qencode account:**
   - Create API key
   - Configure webhook URL
   - Test transcoding profile

4. **Install Vidstack:**
   - `npm install @vidstack/react`
   - Replace Mux Player components

5. **Implement video pipeline:**
   - `src/lib/video-pipeline/r2-upload.ts`
   - `src/lib/video-pipeline/qencode.ts`
   - `src/lib/video-pipeline/webhook.ts`

6. **Update database schema:**
   - Create migration for schema changes
   - Update Prisma client

7. **Configure environment variables:**
   - Add Qencode and R2 video bucket credentials

8. **Implement PostHog video events:**
   - Track video_started, video_progress, video_completed

---

**Generated:** 2025-12-30
**Agent:** project-modifier
**Status:** Ready for implementation
