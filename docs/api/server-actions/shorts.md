# Shorts Server Actions

Server Actions for short video management.

**Location:** `src/app/actions/shorts/`

---

## Actions Overview

| Action | File | Purpose |
|--------|------|---------|
| `createShortAction` | `create.ts` | Create draft short |
| `updateShortMetadataAction` | `update.ts` | Update metadata |
| `publishShortAction` | `publish.ts` | Publish short |
| `archiveShortAction` | `archive.ts` | Archive published short |
| `deleteShortAction` | `delete.ts` | Delete draft |
| `duplicateShortAction` | `duplicate.ts` | Duplicate as new draft |
| `renewShortAction` | `renew.ts` | Renew archived short |

---

## createShortAction

Create a new draft short with video and metadata.

**File:** `src/app/actions/shorts/create.ts`

**Signature:**
```typescript
export async function createShortAction(
  data: unknown
): Promise<ActionResult<{ shortId: string }>>
```

**Input Schema (Zod):**
```typescript
const createShortSchema = z.object({
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
```

**Returns:**
- `success: true` + `data.shortId` on success
- `success: false` + `error` on failure

**Errors:**
| Code | Message | Cause |
|------|---------|-------|
| `UNAUTHORIZED` | Not logged in | Missing session |
| `NOT_COMPANY` | Not company account | Role is not COMPANY |
| `NO_COMPANY_PROFILE` | No profile | CompanyProfile missing |
| `COMPANY_NOT_ACTIVE` | Not active | Company status !== ACTIVE |
| `MAX_DRAFTS_EXCEEDED` | Too many drafts | 10 draft limit |
| `CREATE_FAILED` | Creation failed | Database error |

**Example:**
```typescript
const result = await createShortAction({
  rawVideoKey: 'shorts/cmp123/abc456.mp4',
  title: 'Summer Sale',
  description: 'Check out our deals',
  categoryId: 'cat_fashion',
  tags: ['sale', 'summer'],
  duration: 45,
  aspectRatio: '9:16'
})

if (result.success) {
  router.push(`/panel/shorts/${result.data.shortId}`)
}
```

---

## updateShortMetadataAction

Update short title, description, tags, or CTA link.

**File:** `src/app/actions/shorts/update.ts`

**Signature:**
```typescript
export async function updateShortMetadataAction(
  shortId: string,
  data: unknown
): Promise<ActionResult<Short>>
```

**Input Schema (Zod):**
```typescript
const updateShortSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  ctaLink: z.string().url().optional().nullable()
})
```

**Allowed Status:** DRAFT, PUBLISHED

**Errors:**
| Code | Message | Cause |
|------|---------|-------|
| `NOT_FOUND` | Short not found | Invalid shortId |
| `NOT_OWNER` | Not owner | Different company |
| `INVALID_STATUS` | Cannot edit | Status not DRAFT/PUBLISHED |

**Example:**
```typescript
const result = await updateShortMetadataAction(shortId, {
  title: 'Updated Title',
  tags: ['new', 'tags'],
  ctaLink: 'https://example.com'
})
```

---

## publishShortAction

Initiate publication (deduct credit or redirect to payment).

**File:** `src/app/actions/shorts/publish.ts`

**Signature:**
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

**Flow:**
1. Check company verification (`viesVerified`)
2. Check credit balance
3. If credits > 0: deduct and start transcoding
4. If credits = 0: return `requiresPayment: true`

**Returns:**
```typescript
// Has credits
{ success: true, data: { processing: true, redirectUrl: '/panel/shorts/xyz/publishing' } }

// No credits
{ success: true, data: { requiresPayment: true } }

// Not verified
{ success: false, error: 'Company not verified', data: { requiresVerification: true } }
```

**Errors:**
| Code | Message | Cause |
|------|---------|-------|
| `NOT_DRAFT` | Not a draft | Status !== DRAFT |
| `COMPANY_NOT_VERIFIED` | Not verified | viesVerified === false |
| `NO_VIDEO` | No video uploaded | rawVideoKey missing |

---

## archiveShortAction

Archive a published short before 30-day expiry.

**File:** `src/app/actions/shorts/archive.ts`

**Signature:**
```typescript
export async function archiveShortAction(
  shortId: string
): Promise<ActionResult<Short>>
```

**Required Status:** PUBLISHED

**Effects:**
- Status -> ARCHIVED
- archivedAt = now()
- Removed from public feed
- Still accessible via direct link

**Example:**
```typescript
const result = await archiveShortAction(shortId)
if (result.success) {
  toast.success('Short archived')
}
```

---

## deleteShortAction

Permanently delete a draft short.

**File:** `src/app/actions/shorts/delete.ts`

**Signature:**
```typescript
export async function deleteShortAction(
  shortId: string
): Promise<ActionResult<{ success: boolean }>>
```

**Required Status:** DRAFT only

**Effects:**
- Short deleted from database
- Raw video deleted from R2
- Tags usage counts decremented
- ShortStats deleted

**Example:**
```typescript
const result = await deleteShortAction(shortId)
if (result.success) {
  router.push('/panel/shorts')
}
```

---

## duplicateShortAction

Create a copy of any short as a new draft.

**File:** `src/app/actions/shorts/duplicate.ts`

**Signature:**
```typescript
export async function duplicateShortAction(
  shortId: string
): Promise<ActionResult<{ shortId: string }>>
```

**Behavior by Source:**

| Source Status | Video Copied | Need New Upload |
|---------------|--------------|-----------------|
| DRAFT | Yes (rawVideoKey) | No |
| PUBLISHED | No | Yes |
| ARCHIVED | No | Yes |

**What Gets Copied:**
- Title (+ " (Copy)" suffix)
- Description
- Category
- Tags
- Location
- CTA Link

**What Gets Reset:**
- Status = DRAFT
- hlsPlaylistUrl = null
- qencodeTaskId = null
- Stats = zeroed

**Example:**
```typescript
const result = await duplicateShortAction(shortId)
if (result.success) {
  router.push(`/panel/shorts/${result.data.shortId}`)
}
```

---

## renewShortAction

Renew an archived short for another 30 days.

**File:** `src/app/actions/shorts/renew.ts`

**Signature:**
```typescript
export async function renewShortAction(
  shortId: string
): Promise<ActionResult<{
  processing?: boolean
  requiresPayment?: boolean
  redirectUrl?: string
}>>
```

**Required Status:** ARCHIVED

**Flow:**
1. Check credits
2. If credits > 0: deduct, update dates, republish
3. If credits = 0: redirect to payment

**Effects on Success:**
- Status -> PUBLISHED
- publishedAt = now()
- expiresAt = now() + 30 days
- archivedAt = null

**Example:**
```typescript
const result = await renewShortAction(shortId)
if (result.success && result.data.processing) {
  toast.success('Short renewed for 30 days')
}
```

---

## Common Patterns

### Error Handling

All actions return `ActionResult<T>`:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

### Authentication Check

```typescript
const session = await auth()
if (!session?.user?.id) {
  return createError('errors.unauthorized', 'UNAUTHORIZED')
}
```

### Ownership Check

```typescript
const short = await prisma.short.findFirst({
  where: {
    id: shortId,
    company: { userId: session.user.id }
  }
})

if (!short) {
  return createError('errors.notFound', 'NOT_FOUND')
}
```

### Revalidation

```typescript
revalidatePath('/[locale]/panel/shorts', 'page')
```

---

## Related Documentation

- [Shorts Feature Documentation](../../features/shorts/README.md)
- [Shorts API Routes](../routes/shorts.md)

---

**Last Updated:** 2026-01-01
