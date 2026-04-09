# Inngest Background Jobs

Event-driven background job system for video processing and lifecycle management.

---

## Overview

Inngest is used for reliable background job execution including video transcoding, cleanup, and scheduled tasks.

---

## Setup

### Environment Variables

```env
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

### Client Configuration

**File:** `src/lib/inngest/client.ts`

```typescript
import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "videoshorts",
  eventKey: process.env.INNGEST_EVENT_KEY
})
```

### API Route

**File:** `src/app/api/inngest/route.ts`

```typescript
import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { functions } from "@/lib/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions
})
```

---

## Event Types

**File:** `src/lib/inngest/events.ts`

```typescript
export type InngestEvents = {
  "shorts/transcode.started": {
    data: {
      shortId: string
      rawVideoKey: string
      userId: string
    }
  }
  "shorts/transcode.completed": {
    data: {
      shortId: string
      rawVideoKey: string
      hlsPlaylistUrl: string
      userId: string
    }
  }
  "shorts/transcode.failed": {
    data: {
      shortId: string
      error: string
      retryCount: number
      userId: string
    }
  }
}
```

---

## Functions

### 1. Start Transcoding

**File:** `src/lib/inngest/functions/process-video.ts`
**Trigger:** `shorts/transcode.started`

Initiates video transcoding via Qencode API.

```typescript
export const startTranscoding = inngest.createFunction(
  {
    id: "start-transcoding",
    name: "Start Video Transcoding"
  },
  { event: "shorts/transcode.started" },
  async ({ event, step }) => {
    const { shortId, rawVideoKey, userId } = event.data

    // Step 1: Get short from DB
    const short = await step.run("get-short", async () => {
      return prisma.short.findUnique({
        where: { id: shortId }
      })
    })

    // Step 2: Get presigned download URL
    const inputUrl = await step.run("get-input-url", async () => {
      return getVideoDownloadUrl({ key: rawVideoKey, expiresIn: 7200 })
    })

    // Step 3: Start Qencode job
    const result = await step.run("start-qencode", async () => {
      return startQencodeJob({
        inputUrl,
        outputBucket: R2_VIDEO_HLS_BUCKET,
        outputPath: `shorts/${shortId}`,
        webhookUrl: `${APP_URL}/api/webhooks/qencode`
      })
    })

    // Step 4: Update short with task ID
    await step.run("update-short", async () => {
      return prisma.short.update({
        where: { id: shortId },
        data: { qencodeTaskId: result.taskToken }
      })
    })

    return { success: true, taskToken: result.taskToken }
  }
)
```

### 2. Cleanup Raw Video

**File:** `src/lib/inngest/functions/cleanup-video.ts`
**Trigger:** `shorts/transcode.completed`

Deletes raw video from R2 after successful transcoding.

```typescript
export const cleanupRawVideo = inngest.createFunction(
  {
    id: "cleanup-raw-video",
    name: "Cleanup Raw Video from R2"
  },
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

### 3. Archive Expired Shorts

**File:** `src/lib/inngest/functions/archive-expired.ts`
**Trigger:** Cron schedule `0 3 * * *` (daily at 3 AM)

Automatically archives shorts that have passed their 30-day expiry.

```typescript
export const archiveExpiredShorts = inngest.createFunction(
  {
    id: "archive-expired-shorts",
    name: "Auto-Archive Expired Shorts"
  },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const now = new Date()

    // Find all expired published shorts
    const expiredShorts = await step.run("find-expired", async () => {
      return prisma.short.findMany({
        where: {
          status: "PUBLISHED",
          expiresAt: { lte: now }
        },
        select: { id: true, title: true }
      })
    })

    // Archive each short
    const archived = await step.run("archive-shorts", async () => {
      return prisma.short.updateMany({
        where: {
          id: { in: expiredShorts.map(s => s.id) }
        },
        data: {
          status: "ARCHIVED",
          archivedAt: now
        }
      })
    })

    return {
      archivedCount: archived.count,
      shortIds: expiredShorts.map(s => s.id)
    }
  }
)
```

### 4. Send Expiry Reminders

**File:** `src/lib/inngest/functions/expiry-reminder.ts`
**Trigger:** Cron schedule `0 9 * * *` (daily at 9 AM)

Sends email reminders 7 days before short expiry.

```typescript
export const sendExpiryReminders = inngest.createFunction(
  {
    id: "send-expiry-reminders",
    name: "Send 7-Day Expiry Reminders"
  },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Find shorts expiring in 7 days
    const expiringShorts = await step.run("find-expiring", async () => {
      return prisma.short.findMany({
        where: {
          status: "PUBLISHED",
          expiresAt: {
            gte: startOfDay(sevenDaysFromNow),
            lt: endOfDay(sevenDaysFromNow)
          }
        },
        include: {
          company: {
            include: { user: true }
          }
        }
      })
    })

    // Send reminder emails
    const emails = await step.run("send-emails", async () => {
      return Promise.all(
        expiringShorts.map(short =>
          sendExpiryReminderEmail({
            to: short.company.user.email,
            shortTitle: short.title,
            shortId: short.id,
            expiresAt: short.expiresAt!,
            renewUrl: `${APP_URL}/panel/shorts/${short.id}`
          })
        )
      )
    })

    return {
      remindersSent: emails.length,
      shortIds: expiringShorts.map(s => s.id)
    }
  }
)
```

---

## Function Registration

**File:** `src/lib/inngest/functions/index.ts`

```typescript
import { startTranscoding } from './process-video'
import { cleanupRawVideo } from './cleanup-video'
import { archiveExpiredShorts } from './archive-expired'
import { sendExpiryReminders } from './expiry-reminder'

export const functions = [
  startTranscoding,
  cleanupRawVideo,
  archiveExpiredShorts,
  sendExpiryReminders
]
```

---

## Sending Events

### From Server Actions

```typescript
import { inngest } from '@/lib/inngest/client'

// In publishShortAction
await inngest.send({
  name: 'shorts/transcode.started',
  data: {
    shortId: short.id,
    rawVideoKey: short.rawVideoKey,
    userId: session.user.id
  }
})
```

### From Webhooks

```typescript
// In Qencode webhook handler
await inngest.send({
  name: 'shorts/transcode.completed',
  data: {
    shortId: short.id,
    rawVideoKey: short.rawVideoKey,
    hlsPlaylistUrl: payload.videos[0].url,
    userId: short.company.userId
  }
})
```

---

## Local Development

### Start Inngest Dev Server

```bash
npx inngest-cli@latest dev
```

This opens the Inngest dashboard at `http://localhost:8288`.

### Dashboard Features

- View function registrations
- See event history
- Trigger functions manually
- View function logs
- Replay failed events

### Manual Event Triggering

From the dashboard, you can manually send events:

```json
{
  "name": "shorts/transcode.started",
  "data": {
    "shortId": "clq123abc",
    "rawVideoKey": "shorts/cmp/video.mp4",
    "userId": "usr123"
  }
}
```

---

## Production Setup

### Inngest Cloud

1. Create account at `inngest.com`
2. Get production keys
3. Set environment variables
4. Deploy API route

### Monitoring

- Function execution logs
- Event delivery status
- Retry counts
- Error tracking

### Configuration

```typescript
export const inngest = new Inngest({
  id: "videoshorts",
  eventKey: process.env.INNGEST_EVENT_KEY,
  logger: logger, // Custom logger
  // Retry configuration
  retries: 3
})
```

---

## Best Practices

### Step Functions

Break down into atomic steps for:
- Better observability
- Automatic retries per step
- Resume from failure point

### Error Handling

```typescript
async ({ event, step }) => {
  try {
    await step.run("risky-operation", async () => {
      // ...
    })
  } catch (error) {
    // Log and handle
    await step.run("handle-error", async () => {
      await notifyError(error)
    })
    throw error // Re-throw for Inngest retry
  }
}
```

### Idempotency

Ensure functions can be safely re-run:
```typescript
// Check if already processed
const short = await prisma.short.findUnique({
  where: { id: shortId }
})

if (short.status === 'PUBLISHED') {
  return { skipped: true, reason: 'Already published' }
}
```

---

## Testing

### Unit Tests

Mock Inngest client:

```typescript
vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['evt_123'] }),
    createFunction: vi.fn()
  }
}))
```

### Integration Tests

Use Inngest test mode:

```typescript
import { createTestClient } from 'inngest/test'

const testClient = createTestClient(inngest)
const result = await testClient.invoke('start-transcoding', {
  data: { shortId: 'test', rawVideoKey: 'test.mp4', userId: 'usr' }
})
```

---

## Related Documentation

- [Qencode Integration](./qencode-integration.md)
- [Publishing Workflow](../features/shorts/publishing.md)
- [Short Lifecycle](../features/shorts/lifecycle.md)

---

**Last Updated:** 2026-01-01
