# Task 01: Database Schema + Infrastructure

## Overview

**Priority:** HIGH
**Dependencies:** None
**Complexity:** Simple (8 files, ~8k tokens)
**Status:** pending

## What to Build

Foundation layer for Stage 03:
1. Prisma schema migration (rename Mux fields to Qencode)
2. Install NPM packages (@vidstack/react, inngest)
3. Validation schemas for shorts and payments
4. Inngest client setup
5. i18n configuration update
6. Environment variables template

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/validation/shorts.ts` | Create | Zod schemas for short creation/update |
| `src/lib/validation/payments.ts` | Create | Zod schemas for payment checkout |
| `src/lib/inngest/client.ts` | Create | Inngest client configuration |
| `src/lib/inngest/events.ts` | Create | TypeScript types for Inngest events |

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Rename muxAssetId -> qencodeTaskId, muxPlaybackId -> hlsPlaylistUrl, muxUploadId -> rawVideoKey using @map |
| `package.json` | Add @vidstack/react, inngest dependencies |
| `i18n.ts` | Add shorts and payments namespace imports |
| `.env.example` | Add R2 video, Qencode, payment provider, Inngest env vars |

## Implementation Details

### 1. Prisma Schema Migration

Use `@map` directive for non-destructive column rename:

```prisma
model Short {
  // RENAME using @map (preserves existing column in DB)
  qencodeTaskId   String?  @unique @map("muxAssetId")
  hlsPlaylistUrl  String?  @unique @map("muxPlaybackId")
  rawVideoKey     String?  @map("muxUploadId")

  // Also add new index
  @@index([qencodeTaskId])
}
```

### 2. NPM Packages

```bash
npm install @vidstack/react inngest
```

### 3. Validation Schemas

**shorts.ts:**
```typescript
export const createShortSchema = z.object({
  rawVideoKey: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().cuid(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  ctaLink: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  customThumbnail: z.boolean().optional(),
  duration: z.number().int().positive().max(60).optional(),
  aspectRatio: z.string().optional()
})

export const updateShortSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  ctaLink: z.string().url().optional().nullable()
})
```

**payments.ts:**
```typescript
export const checkoutSchema = z.object({
  provider: z.enum(['PRZELEWY24', 'TPAY']),
  credits: z.number().int().positive().refine(
    (n) => [1, 5, 20, 50].includes(n),
    { message: 'Invalid credit package' }
  ),
  shortId: z.string().cuid().optional(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url()
})
```

### 4. Inngest Client

```typescript
// src/lib/inngest/client.ts
import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "videoshorts",
  eventKey: process.env.INNGEST_EVENT_KEY
})
```

### 5. i18n.ts Update

Add shorts and payments namespaces to the i18n configuration:

```typescript
// i18n.ts - add to existing namespaces array
const namespaces = [
  'common',
  'sidebar',
  'auth',
  'companies',
  'shorts',    // ADD THIS
  'payments',  // ADD THIS
  // ... other existing namespaces
]

// In the messages loading section, add:
const shortsMessages = (await import(`./src/lib/locales/${locale}/shorts.json`)).default
const paymentsMessages = (await import(`./src/lib/locales/${locale}/payments.json`)).default

// And include in the returned messages object:
return {
  // ... existing namespaces
  shorts: shortsMessages,
  payments: paymentsMessages,
}
```

### 6. Environment Variables

```env
# R2 Video Buckets
R2_VIDEO_RAW_BUCKET=
R2_VIDEO_HLS_BUCKET=
R2_VIDEO_HLS_PUBLIC_URL=

# Qencode
QENCODE_API_KEY=
QENCODE_WEBHOOK_SECRET=

# Przelewy24
PRZELEWY24_MERCHANT_ID=
PRZELEWY24_CRC=
PRZELEWY24_API_KEY=

# Tpay
TPAY_MERCHANT_ID=
TPAY_SECURITY_CODE=
TPAY_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

## Acceptance Criteria

- [ ] `npx prisma migrate dev --name rename_mux_to_qencode` runs successfully
- [ ] `npx prisma generate` completes without errors
- [ ] `npm install` completes with new packages
- [ ] `npm run build` passes without TypeScript errors
- [ ] Validation schemas export correctly
- [ ] Inngest client initializes without errors
- [ ] i18n.ts compiles without errors

## Verification Steps

```bash
# 1. Run migration
npx prisma migrate dev --name rename_mux_to_qencode

# 2. Generate Prisma client
npx prisma generate

# 3. Install packages
npm install

# 4. Verify build
npm run build

# 5. Check TypeScript
npx tsc --noEmit
```

## Notes

- The @map directive preserves existing database column names while updating TypeScript field names
- No data migration needed - columns are renamed at the application level only
- Inngest functions will be implemented in Task 04
- Translation files will be created in Task 02 (shorts.json) and Task 05 (payments.json)
