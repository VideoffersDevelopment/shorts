# Short Model

Video short entity representing user-uploaded short-form video content.

---

## Schema

```prisma
model Short {
  id                 String              @id @default(cuid())
  companyId          String
  qencodeTaskId      String?             @unique @map("muxAssetId")
  hlsPlaylistUrl     String?             @unique @map("muxPlaybackId")
  rawVideoKey        String?             @map("muxUploadId")
  title              String              @db.VarChar(100)
  description        String?             @db.Text
  categoryId         String
  latitude           Float?
  longitude          Float?
  address            String?
  ctaLink            String?
  status             ShortStatus         @default(DRAFT)
  thumbnailUrl       String?
  customThumbnail    Boolean             @default(false)
  duration           Int?
  aspectRatio        String?
  publishedAt        DateTime?           @db.Timestamptz(6)
  archivedAt         DateTime?           @db.Timestamptz(6)
  expiresAt          DateTime?           @db.Timestamptz(6)
  processingError    String?             @db.Text
  retryCount         Int                 @default(0)
  createdAt          DateTime            @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime            @updatedAt @db.Timestamptz(6)

  // Relations
  company            CompanyProfile      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  category           Category            @relation(fields: [categoryId], references: [id])
  tags               ShortTag[]
  payment            Payment?
  stats              ShortStats?
  creditTransactions CreditTransaction[]

  @@index([companyId])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@index([categoryId])
  @@index([qencodeTaskId])
}
```

---

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `companyId` | String | Foreign key to CompanyProfile |
| `qencodeTaskId` | String? | Qencode job identifier (mapped from muxAssetId) |
| `hlsPlaylistUrl` | String? | HLS master playlist URL (mapped from muxPlaybackId) |
| `rawVideoKey` | String? | R2 raw bucket key (mapped from muxUploadId) |
| `title` | String | Video title (max 100 chars) |
| `description` | String? | Video description |
| `categoryId` | String | Foreign key to Category |
| `latitude` | Float? | Location latitude |
| `longitude` | Float? | Location longitude |
| `address` | String? | Location address text |
| `ctaLink` | String? | Call-to-action URL |
| `status` | ShortStatus | Current lifecycle status |
| `thumbnailUrl` | String? | Thumbnail image URL |
| `customThumbnail` | Boolean | Whether user uploaded custom thumbnail |
| `duration` | Int? | Video duration in seconds |
| `aspectRatio` | String? | Video aspect ratio (e.g., "9:16") |
| `publishedAt` | DateTime? | When short was published |
| `archivedAt` | DateTime? | When short was archived |
| `expiresAt` | DateTime? | Publication expiry date |
| `processingError` | String? | Last transcoding error message |
| `retryCount` | Int | Number of transcoding retries |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

---

## Status Enum

```prisma
enum ShortStatus {
  DRAFT           // Initial state, not published
  PENDING_PAYMENT // Waiting for payment to complete
  PROCESSING      // Video being transcoded
  PUBLISHED       // Live and visible
  ARCHIVED        // Expired or manually archived
  DELETED         // Soft deleted
}
```

### Status Transitions

```
DRAFT --> PENDING_PAYMENT --> PROCESSING --> PUBLISHED --> ARCHIVED
  |                                              |           |
  +-------------------------------------------->-+           |
  |            (if credits available)                        |
  +-- DELETE -----------------------------------------------+
        (only from DRAFT)
```

---

## Relations

### Company (many-to-one)

```typescript
// Get short with company
const short = await prisma.short.findUnique({
  where: { id },
  include: { company: true }
})
```

### Category (many-to-one)

```typescript
// Get short with category
const short = await prisma.short.findUnique({
  where: { id },
  include: { category: true }
})
```

### Tags (many-to-many via ShortTag)

```typescript
// Get short with tags
const short = await prisma.short.findUnique({
  where: { id },
  include: {
    tags: {
      include: { tag: true }
    }
  }
})
```

### Stats (one-to-one)

```typescript
// Get short with stats
const short = await prisma.short.findUnique({
  where: { id },
  include: { stats: true }
})
```

### Payment (one-to-one, optional)

```typescript
// Get short with payment info
const short = await prisma.short.findUnique({
  where: { id },
  include: { payment: true }
})
```

---

## Common Queries

### Get Company Shorts

```typescript
const shorts = await prisma.short.findMany({
  where: {
    companyId,
    status: { not: 'DELETED' }
  },
  include: {
    stats: true,
    tags: { include: { tag: true } }
  },
  orderBy: { createdAt: 'desc' }
})
```

### Get Published Shorts (Feed)

```typescript
const shorts = await prisma.short.findMany({
  where: {
    status: 'PUBLISHED',
    expiresAt: { gt: new Date() }
  },
  include: {
    company: true,
    category: true,
    stats: true
  },
  orderBy: { publishedAt: 'desc' },
  take: 20
})
```

### Get Expired Shorts

```typescript
const expiredShorts = await prisma.short.findMany({
  where: {
    status: 'PUBLISHED',
    expiresAt: { lte: new Date() }
  }
})
```

### Get Shorts Expiring Soon (7 days)

```typescript
const expiringShorts = await prisma.short.findMany({
  where: {
    status: 'PUBLISHED',
    expiresAt: {
      gte: startOfDay(addDays(new Date(), 7)),
      lt: endOfDay(addDays(new Date(), 7))
    }
  },
  include: { company: { include: { user: true } } }
})
```

---

## Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| Primary | `id` | Record lookup |
| Unique | `qencodeTaskId` | Webhook matching |
| Unique | `hlsPlaylistUrl` | Video delivery |
| Index | `companyId` | Company shorts list |
| Index | `status` | Status filtering |
| Index | `publishedAt` | Feed ordering |
| Index | `expiresAt` | Expiry queries |
| Index | `categoryId` | Category filtering |

---

## Field Mapping

The model uses `@map` to preserve backward compatibility:

```prisma
qencodeTaskId   String?  @unique @map("muxAssetId")
hlsPlaylistUrl  String?  @unique @map("muxPlaybackId")
rawVideoKey     String?  @map("muxUploadId")
```

This allows the database columns to retain their original names while TypeScript uses the new field names.

---

## Lifecycle

### Creation

1. User uploads video to R2
2. `createShortAction` creates Short with status = DRAFT
3. ShortStats record created automatically

### Publication

1. User clicks Publish
2. Credit check -> deduct or redirect to payment
3. Status changes to PROCESSING
4. Qencode transcodes video
5. Webhook updates hlsPlaylistUrl
6. Status changes to PUBLISHED
7. publishedAt and expiresAt set

### Expiry

1. Daily cron checks expiresAt
2. Shorts past expiry archived
3. Status changes to ARCHIVED
4. archivedAt set

### Renewal

1. User clicks Renew on archived short
2. Credit check
3. Status changes back to PUBLISHED
4. New publishedAt and expiresAt set

---

## Related Models

- [ShortStats](./short-stats.md)
- [Tag](./tag.md)
- [Payment](./payment.md)
- [CreditTransaction](./credit-transaction.md)

---

**Last Updated:** 2026-01-01
