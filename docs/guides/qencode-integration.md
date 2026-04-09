# Qencode Integration Guide

Video transcoding service integration for HLS adaptive streaming.

---

## Overview

Qencode is used to transcode uploaded videos into HLS format with multiple quality levels for adaptive bitrate streaming.

---

## Setup

### Environment Variables

```env
QENCODE_API_KEY=your_api_key_here
```

> **Note:** Qencode does NOT support webhook signature verification (no `X-Qencode-Signature` header).
> Security is ensured by validating that the `task_token` in the webhook payload exists in our database.

### Required R2 Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `R2_VIDEO_RAW_BUCKET` | Raw uploaded videos | Private |
| `R2_VIDEO_HLS_BUCKET` | Processed HLS files | Public |

---

## Transcoding Profile

### HLS Configuration

```typescript
const HLS_PROFILE = {
  format: "advanced_hls",
  segment_duration: 4,
  streams: [
    {
      // 1080p - High quality
      size: "1080x1920",
      video_codec: "libx264",
      profile: "high",
      bitrate: 4500,
      audio_bitrate: 128,
      audio_sample_rate: 48000
    },
    {
      // 720p - Main quality
      size: "720x1280",
      video_codec: "libx264",
      profile: "main",
      bitrate: 2500,
      audio_bitrate: 128,
      audio_sample_rate: 44100
    },
    {
      // 480p - Low quality
      size: "480x854",
      video_codec: "libx264",
      profile: "main",
      bitrate: 1000,
      audio_bitrate: 96,
      audio_sample_rate: 44100
    }
  ]
}
```

### Output Structure

```
/shorts/{shortId}/
  master.m3u8           # Master playlist
  stream_0/             # 1080p
    playlist.m3u8
    segment_0.ts
    segment_1.ts
    ...
  stream_1/             # 720p
    playlist.m3u8
    segment_0.ts
    ...
  stream_2/             # 480p
    playlist.m3u8
    segment_0.ts
    ...
  thumbnail.jpg         # Auto-generated thumbnail
```

---

## API Client

**File:** `src/lib/qencode.ts`

### Start Transcoding Job

```typescript
import { startQencodeJob } from '@/lib/qencode'

const result = await startQencodeJob({
  inputUrl: 'https://r2.example.com/raw/video.mp4',
  outputBucket: 'hls-bucket',
  outputPath: `shorts/${shortId}`,
  webhookUrl: 'https://app.example.com/api/webhooks/qencode'
})

// result.taskToken - Used to track the job
// result.statusUrl - URL to check status
```

### Validate Webhook Payload

```typescript
import { validateQencodePayload, parseQencodeWebhookPayload } from '@/lib/qencode'

// Parse and validate payload structure
const payload = parseQencodeWebhookPayload(rawBody)
if (!validateQencodePayload(payload)) {
  return new Response('Invalid payload', { status: 400 })
}

// Additional security: verify task_token exists in database
const short = await prisma.short.findFirst({
  where: { qencodeTaskId: payload.task_token }
})
if (!short) {
  return new Response('Short not found', { status: 404 })
}
```

---

## Transcoding Flow

```
1. User uploads video to R2 raw bucket
   |
2. publishShortAction triggered
   |
3. Inngest event: shorts/transcode.started
   |
4. startTranscoding function runs:
   a. Get presigned download URL for raw video
   b. Call startQencodeJob()
   c. Store qencodeTaskId in Short record
   |
5. Qencode processes video (2-5 minutes)
   |
6. Qencode sends webhook to /api/webhooks/qencode
   |
7. Webhook handler:
   a. Validate payload structure
   b. Verify task_token exists in database
   c. Extract HLS URL from payload
   d. Update Short (hlsPlaylistUrl, status = PUBLISHED)
   e. Send Inngest event: shorts/transcode.completed
   |
8. cleanupRawVideo function runs:
   a. Delete raw video from R2
   |
9. Send "short published" email
```

---

## Inngest Functions

### Start Transcoding

**File:** `src/lib/inngest/functions/process-video.ts`

```typescript
export const startTranscoding = inngest.createFunction(
  { id: "start-transcoding", name: "Start Video Transcoding" },
  { event: "shorts/transcode.started" },
  async ({ event, step }) => {
    const { shortId, rawVideoKey, userId } = event.data

    // Get short from database
    const short = await step.run("get-short", async () => {
      return prisma.short.findUnique({
        where: { id: shortId },
        include: { company: true }
      })
    })

    // Get presigned download URL
    const inputUrl = await step.run("get-input-url", async () => {
      return getVideoDownloadUrl({ key: rawVideoKey, expiresIn: 7200 })
    })

    // Start Qencode job
    const result = await step.run("start-qencode", async () => {
      return startQencodeJob({
        inputUrl,
        outputBucket: R2_VIDEO_HLS_BUCKET,
        outputPath: `shorts/${shortId}`,
        webhookUrl: `${NEXT_PUBLIC_APP_URL}/api/webhooks/qencode`
      })
    })

    // Update short with task ID
    await step.run("update-short", async () => {
      return prisma.short.update({
        where: { id: shortId },
        data: { qencodeTaskId: result.taskToken }
      })
    })

    return { taskToken: result.taskToken }
  }
)
```

### Cleanup Raw Video

**File:** `src/lib/inngest/functions/cleanup-video.ts`

```typescript
export const cleanupRawVideo = inngest.createFunction(
  { id: "cleanup-raw-video", name: "Cleanup Raw Video from R2" },
  { event: "shorts/transcode.completed" },
  async ({ event, step }) => {
    const { rawVideoKey } = event.data

    await step.run("delete-raw-video", async () => {
      return deleteVideoObject(rawVideoKey)
    })

    return { deleted: rawVideoKey }
  }
)
```

---

## Error Handling

### Retry Logic

On transcoding failure:
1. Increment `retryCount` on Short
2. If retryCount < 3: trigger retry via Inngest
3. If retryCount >= 3: give up, refund credit

```typescript
// In webhook handler
if (payload.status === 'error') {
  if (short.retryCount < 3) {
    await inngest.send({
      name: 'shorts/transcode.retry',
      data: { shortId, attempt: short.retryCount + 1 }
    })
  } else {
    await refundCredit(userId, shortId, payload.error_message)
    await sendTranscodingFailedEmail(...)
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_INPUT` | Unsupported format | Validate before upload |
| `TIMEOUT` | Video too long/large | Check duration/size limits |
| `QUOTA_EXCEEDED` | API quota reached | Contact Qencode |
| `OUTPUT_ERROR` | R2 write failed | Check R2 credentials |

---

## Testing

### Local Development

1. Start Inngest dev server:
   ```bash
   npx inngest-cli@latest dev
   ```

2. Open Inngest dashboard at `http://localhost:8288`

3. Use ngrok for webhook testing:
   ```bash
   ngrok http 3000
   ```

4. Update webhook URL to ngrok URL

### Mocking Qencode

For unit tests, mock the Qencode module:

```typescript
vi.mock('@/lib/qencode', () => ({
  startQencodeJob: vi.fn().mockResolvedValue({
    taskToken: 'test-task-token',
    statusUrl: 'https://api.qencode.com/v1/status'
  }),
  validateQencodePayload: vi.fn().mockReturnValue(true),
  parseQencodeWebhookPayload: vi.fn()
}))
```

### Simulating Webhook

```bash
# First, create a short with a specific qencodeTaskId in the database
# Then send a webhook payload with matching task_token:

curl -X POST http://localhost:3000/api/webhooks/qencode \
  -H "Content-Type: application/json" \
  -d '{
    "task_token": "your-task-token-from-db",
    "status": "completed",
    "videos": [{
      "url": "https://hls.example.com/shorts/abc/master.m3u8",
      "type": "hls",
      "duration": 45,
      "thumbnail": "https://hls.example.com/shorts/abc/thumbnail.jpg"
    }]
  }'
```

> **Security Note:** The webhook is secured by verifying that the `task_token` exists in our database.
> Since task tokens are unique UUIDs generated by Qencode during job creation, only legitimate
> webhooks from Qencode (for jobs we initiated) will pass validation.

---

## Production Considerations

### Cost Optimization

- Only transcode when publishing (not on upload)
- Delete raw videos after successful transcode
- Use appropriate quality levels (consider lower for MVP)

### Monitoring

- Log all transcoding jobs
- Track success/failure rates
- Alert on repeated failures

### Fallback Strategy

If Qencode is down:
- Queue jobs for retry
- Notify users of delay
- Consider alternative provider

---

## Related Documentation

- [Publishing Workflow](../features/shorts/publishing.md)
- [Inngest Jobs](./inngest-jobs.md)
- [R2 Storage](../database/r2-storage.md)

---

**Last Updated:** 2026-01-11
