# Code Analysis: Shorts Upload + Payments (Stage 03)

**Project:** videoshorts-stage-03-shorts-payments
**Date:** 2025-12-31
**Iteration:** v1

---

## 1. Component Inventory

### 1.1 Existing UI Components (Reusable)

| Component | Path | Status | API Compatible | Notes |
|-----------|------|--------|----------------|-------|
| VideoCard | `src/components/home/video-card.tsx` | EXISTS | YES | Thumbnail display with company info, stats badges |
| VideoGrid | `src/components/home/video-grid.tsx` | EXISTS | YES | Grid layout for video cards |
| AvatarUpload | `src/components/profile/avatar-upload.tsx` | EXISTS | PARTIAL | R2 presigned URL pattern - can adapt for thumbnails |
| BannerUpload | `src/components/companies/banner-upload.tsx` | EXISTS | YES | Drag & drop, crop modal, R2 upload pattern |
| LogoUpload | `src/components/companies/logo-upload.tsx` | EXISTS | YES | R2 presigned URL pattern |
| CompanyProfileForm | `src/components/companies/company-profile-form.tsx` | EXISTS | YES | React Hook Form + Zod pattern example |
| LocationMap | `src/components/companies/location-map.tsx` | EXISTS | YES | Leaflet map component |
| AddressLocation | `src/components/companies/address-location.tsx` | EXISTS | YES | Location picker with geocoding |
| CategoryCombobox | `src/components/companies/category-combobox.tsx` | EXISTS | YES | Combobox with hierarchical categories |
| LoadingSpinner | `src/components/shared/loading-spinner.tsx` | EXISTS | YES | Universal loading component |
| ErrorBoundary | `src/components/shared/error-boundary.tsx` | EXISTS | YES | Error handling wrapper |
| Dialog | `src/components/ui/dialog.tsx` | EXISTS | YES | Radix-based modal component |
| Button/Input/etc | `src/components/ui/*.tsx` | EXISTS | YES | Full shadcn/ui component library |

### 1.2 Components to Create

| Component | Purpose | Base Pattern |
|-----------|---------|--------------|
| **VideoUploadWizard** | Multi-step upload wizard (video -> metadata -> thumbnail -> review) | New (use existing form patterns) |
| **VideoDropzone** | Drag & drop video upload with validation | Base on `BannerUpload` drag & drop pattern |
| **VideoPreview** | HLS video player for previews | Requires @vidstack/react (NOT installed) |
| **ShortPlayer** | Full HLS player for public pages | Requires @vidstack/react |
| **TagsAutocomplete** | Tag input with autocomplete | New (use cmdk for search) |
| **ShortMetadataForm** | Metadata form (title, description, category, tags, location, CTA) | Base on `CompanyProfileForm` |
| **ThumbnailSelector** | Thumbnail preview/upload component | Base on `AvatarUpload` |
| **ProcessingStatusTimeline** | Status timeline (draft -> payment -> processing -> published) | New component |
| **ShortCard** | Short card for dashboard list | Extend `VideoCard` |
| **ShortsTable** | DataTable for shorts management | Base on `UsersDataTable` pattern |
| **PaymentButton** | Payment initiation button | New component |
| **CreditsDisplay** | Display available publication credits | New component |
| **StepIndicator** | Wizard step indicator | New component (no stepper exists) |

---

## 2. API Inventory

### 2.1 Existing API Routes

| Endpoint | Path | Status | Notes |
|----------|------|--------|-------|
| POST /api/users/me/avatar | `src/app/api/users/me/avatar/route.ts` | EXISTS | R2 presigned URL pattern |
| DELETE /api/users/me/avatar | `src/app/api/users/me/avatar/route.ts` | EXISTS | R2 delete pattern |
| POST /api/companies/banner | `src/app/api/companies/banner/route.ts` | EXISTS | R2 presigned URL + company auth |
| DELETE /api/companies/banner | `src/app/api/companies/banner/route.ts` | EXISTS | R2 delete |
| POST /api/companies/logo | `src/app/api/companies/logo/route.ts` | EXISTS | R2 presigned URL |
| GET /api/categories/[categoryId]/subcategories | `src/app/api/categories/[categoryId]/subcategories/route.ts` | EXISTS | Category fetch |
| NextAuth routes | `src/app/api/auth/[...nextauth]/route.ts` | EXISTS | Authentication |

### 2.2 APIs to Create

| Endpoint | Method | Purpose | Response Format |
|----------|--------|---------|-----------------|
| `/api/shorts/upload-url` | POST | Get R2 presigned URL for video upload | `{ uploadUrl, key }` |
| `/api/shorts` | POST | Create short draft | `{ shortId }` |
| `/api/shorts` | GET | List user's shorts | `{ shorts: Short[] }` |
| `/api/shorts/[id]` | GET | Get short details | `Short` |
| `/api/shorts/[id]` | PATCH | Update short metadata | `Short` |
| `/api/shorts/[id]` | DELETE | Soft delete short | `{ success }` |
| `/api/shorts/[id]/publish` | POST | Initiate publish (check credits or redirect to payment) | `{ redirectUrl } or { processing: true }` |
| `/api/shorts/[id]/renew` | POST | Renew archived short | `{ redirectUrl }` |
| `/api/shorts/[id]/duplicate` | POST | Duplicate short as draft | `{ shortId }` |
| `/api/thumbnails/upload-url` | POST | Get R2 presigned URL for custom thumbnail | `{ uploadUrl, key }` |
| `/api/tags/search` | GET | Search existing tags | `{ tags: Tag[] }` |
| `/api/webhooks/qencode` | POST | Qencode transcoding callback | Webhook handler |
| `/api/webhooks/przelewy24` | POST | Przelewy24 payment webhook | Webhook handler |
| `/api/webhooks/tpay` | POST | Tpay payment webhook | Webhook handler |
| `/api/payments/checkout` | POST | Create payment checkout session | `{ checkoutUrl, provider }` |
| `/api/credits` | GET | Get user's publication credits | `{ credits, history }` |
| `/api/credits/purchase` | POST | Purchase credits package | `{ checkoutUrl }` |

---

## 3. Database Analysis

### 3.1 Existing Models (Relevant)

| Model | Key Fields | Notes |
|-------|------------|-------|
| **User** | `id (cuid)`, `publicationCredits (Int)`, `role` | Has `publicationCredits` field already |
| **CompanyProfile** | `id (cuid)`, `userId`, `status`, `viesVerified`, `categoryId` | Shorts linked via `companyId` |
| **Category** | `id (cuid)`, `name`, `slug`, `parentId` | Hierarchical categories |
| **Short** | Full model exists | See below |
| **ShortStats** | `shortId`, `views`, `likes`, `comments`, `ctaClicks` | Statistics tracking |
| **Tag** | `id`, `name`, `slug`, `usageCount` | Tag management |
| **ShortTag** | `shortId`, `tagId` | Many-to-many junction |
| **Payment** | Full model exists | See below |
| **CreditTransaction** | Full model exists | Credit audit trail |

### 3.2 Short Model Analysis

```prisma
model Short {
  id                 String              @id @default(cuid())
  companyId          String
  muxAssetId         String?             @unique  // ISSUE: Should be qencodeTaskId
  muxPlaybackId      String?             @unique  // ISSUE: Should be hlsPlaylistUrl
  muxUploadId        String?                      // ISSUE: Should be rawVideoKey
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
  publishedAt        DateTime?
  archivedAt         DateTime?
  expiresAt          DateTime?
  processingError    String?
  retryCount         Int                 @default(0)
  // ... timestamps and relations
}
```

**ISSUES FOUND:**

| Issue | Field | Problem | Required Fix |
|-------|-------|---------|--------------|
| Field naming | `muxAssetId` | Named for Mux, should be `qencodeTaskId` | RENAME (migration) |
| Field naming | `muxPlaybackId` | Named for Mux, should be `hlsPlaylistUrl` | RENAME (migration) |
| Field naming | `muxUploadId` | Named for Mux, should be `rawVideoKey` | RENAME (migration) |

### 3.3 Payment Model Analysis

```prisma
model Payment {
  id                 String              @id @default(cuid())
  userId             String
  shortId            String?             @unique
  provider           PaymentProvider     @default(PRZELEWY24)
  providerPaymentId  String              @unique
  providerSessionId  String?             @unique
  amount             Decimal             @db.Decimal(10, 2)
  currency           String              @default("PLN")
  status             PaymentStatus       @default(PENDING)
  invoiceUrl         String?
  metadata           Json?
  creditsGranted     Int                 @default(0)
  // ... timestamps and relations
}
```

**STATUS:** Model is properly designed for multi-provider payments.

### 3.4 Enums Analysis

```prisma
enum ShortStatus {
  DRAFT
  PENDING_PAYMENT
  PROCESSING
  PUBLISHED
  ARCHIVED
  DELETED
}

enum PaymentProvider {
  PRZELEWY24
  TPAY
  OTHER
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum CreditSource {
  PACKAGE
  GIFT
  PROMO
  REFUND
  ADMIN
  PUBLICATION
  OTHER
}
```

**STATUS:** All enums properly defined.

### 3.5 Required Schema Changes (ADDITIVE)

```prisma
// RENAME fields (migration required)
model Short {
  // Rename muxAssetId -> qencodeTaskId
  // Rename muxPlaybackId -> hlsPlaylistUrl
  // Rename muxUploadId -> rawVideoKey
}
```

**Note:** The schema has Mux-named fields that need migration to Qencode naming.

---

## 4. Routing Analysis

### 4.1 Existing Routes

| Route | File | Status |
|-------|------|--------|
| `/[locale]/panel` | `src/app/(main)/[locale]/panel/page.tsx` | EXISTS |
| `/[locale]/panel/profile` | `src/app/(main)/[locale]/panel/profile/page.tsx` | EXISTS |
| `/[locale]/panel/settings` | `src/app/(main)/[locale]/panel/settings/page.tsx` | EXISTS |
| `/[locale]/panel/company/profile` | `src/app/(main)/[locale]/panel/company/profile/page.tsx` | EXISTS |
| `/[locale]/panel/company/overview` | `src/app/(main)/[locale]/panel/company/overview/page.tsx` | EXISTS |
| `/[locale]/companies/[slug]` | `src/app/(main)/[locale]/companies/[slug]/page.tsx` | EXISTS |
| `/[locale]/admin` | `src/app/(admin)/[locale]/admin/page.tsx` | EXISTS |

### 4.2 Routes to Create

| Route | Purpose | Layout |
|-------|---------|--------|
| `/[locale]/panel/shorts` | Shorts list (dashboard) | Panel layout |
| `/[locale]/panel/shorts/new` | Create new short wizard | Panel layout |
| `/[locale]/panel/shorts/[id]` | Short detail/edit (dashboard) | Panel layout |
| `/[locale]/panel/shorts/[id]/publishing` | Processing status page | Panel layout |
| `/[locale]/panel/credits` | Credits management | Panel layout |
| `/[locale]/shorts/[id]` | Public short view | Main layout |
| `/api/webhooks/qencode` | Qencode webhook | API route |
| `/api/webhooks/przelewy24` | Przelewy24 webhook | API route |
| `/api/webhooks/tpay` | Tpay webhook | API route |

---

## 5. Frontend Patterns

### 5.1 Form Pattern (React Hook Form + Zod)

**Example:** `src/components/companies/company-profile-form.tsx`

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companyProfileSchema } from '@/lib/validation'

const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})
```

### 5.2 Server Action Pattern

**Example:** `src/app/actions/companies/update.ts`

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"

export async function updateCompanyProfileAction(data: unknown): Promise<ActionResult<T>> {
  // 1. AUTH check
  const session = await auth()
  if (!session?.user?.id) return createError("errors.unauthorized")

  // 2. AUTHORIZATION check (ownership)
  // 3. VALIDATION with Zod
  // 4. DB operation
  // 5. revalidatePath
  // 6. Return ActionResult
}
```

### 5.3 R2 Upload Pattern

**Example:** `src/app/api/companies/banner/route.ts`

```typescript
// 1. Auth check
// 2. Authorization (company profile check)
// 3. Generate unique key: `companies/${companyId}/banner-${nanoid()}.${ext}`
// 4. Get presigned URL: await getUploadUrl({ key, contentType })
// 5. Return { uploadUrl, publicUrl }
```

### 5.4 Translation Pattern (next-intl)

**Client:** `useTranslations('namespace')` from `@/lib/i18n/client`
**Server:** `getTranslations('namespace')` from `@/lib/i18n/server`
**Files:** `src/lib/locales/{de,en,es,pl,ru,uk}/[namespace].json`

### 5.5 Sidebar Navigation Pattern

**File:** `src/components/layout/app-sidebar.tsx`
- Role-based menu items (`userRole === "COMPANY"`)
- Active state based on `usePathname()`
- Locale-aware links (`/${locale}/panel/...`)

---

## 6. Backend Patterns

### 6.1 ActionResult Type

**File:** `src/lib/types/action-result.ts`

```typescript
export type ActionResult<T> = ActionSuccess<T> | ActionError

export function createError(error: string, code?: string): ActionError
export function createSuccess<T>(data: T, message?: string): ActionSuccess<T>
export function formatZodError(error: ZodError): ActionError
```

### 6.2 R2 Utility Functions

**File:** `src/lib/r2.ts`

```typescript
export async function getUploadUrl({ key, contentType, expiresIn }): Promise<string>
export async function getDownloadUrl({ key, expiresIn }): Promise<string>
export function getPublicUrl(key: string): string
export async function deleteObject(key: string): Promise<void>
```

### 6.3 Inngest Setup

**STATUS:** NOT INSTALLED

Inngest is NOT installed in package.json. This is a gap that needs to be addressed for:
- Background job processing (transcoding status polling)
- Cron jobs (auto-archive 30-day shorts)
- Email notifications (7-day expiry reminders)

---

## 7. Gap Analysis

### 7.1 NPM Packages to Install

| Package | Purpose | Version |
|---------|---------|---------|
| `@vidstack/react` | HLS video player | Latest |
| `inngest` | Background jobs, cron | Latest |
| `nanoid` | Already installed (in banner-upload) | - |

### 7.2 Components to Create

| Priority | Component | Complexity | Base Pattern |
|----------|-----------|------------|--------------|
| P0 | VideoUploadWizard | HIGH | New multi-step wizard |
| P0 | VideoDropzone | MEDIUM | BannerUpload drag & drop |
| P0 | ShortPlayer | MEDIUM | @vidstack/react HLS |
| P0 | ProcessingStatusTimeline | LOW | New component |
| P1 | ShortMetadataForm | MEDIUM | CompanyProfileForm |
| P1 | TagsAutocomplete | MEDIUM | cmdk combobox |
| P1 | ThumbnailSelector | LOW | AvatarUpload |
| P1 | ShortsTable | MEDIUM | UsersDataTable |
| P1 | PaymentButton | LOW | New |
| P2 | CreditsDisplay | LOW | New |
| P2 | StepIndicator | LOW | New |

### 7.3 APIs to Create

| Priority | Endpoint | Complexity |
|----------|----------|------------|
| P0 | POST /api/shorts/upload-url | LOW |
| P0 | POST /api/shorts | MEDIUM |
| P0 | GET /api/shorts | LOW |
| P0 | POST /api/webhooks/qencode | HIGH |
| P0 | POST /api/webhooks/przelewy24 | HIGH |
| P0 | POST /api/webhooks/tpay | HIGH |
| P0 | POST /api/payments/checkout | HIGH |
| P1 | PATCH /api/shorts/[id] | LOW |
| P1 | POST /api/shorts/[id]/publish | MEDIUM |
| P1 | GET /api/credits | LOW |
| P2 | POST /api/shorts/[id]/renew | MEDIUM |
| P2 | POST /api/shorts/[id]/duplicate | LOW |

### 7.4 Database Migrations Required

1. **Rename Mux fields to Qencode fields:**
   - `muxAssetId` -> `qencodeTaskId`
   - `muxPlaybackId` -> `hlsPlaylistUrl`
   - `muxUploadId` -> `rawVideoKey`

### 7.5 External Service Integrations

| Service | Purpose | Integration Effort |
|---------|---------|-------------------|
| **Cloudflare R2** | Already integrated | LOW (extend for video buckets) |
| **Qencode** | Video transcoding | HIGH (new integration) |
| **Przelewy24** | Payment provider | HIGH (new integration) |
| **Tpay** | Fallback payment | HIGH (new integration) |
| **Inngest** | Background jobs | MEDIUM (setup + functions) |

### 7.6 Translation Files to Create

Create `shorts.json` in all locale folders:
- `src/lib/locales/de/shorts.json`
- `src/lib/locales/en/shorts.json`
- `src/lib/locales/es/shorts.json`
- `src/lib/locales/pl/shorts.json`
- `src/lib/locales/ru/shorts.json`
- `src/lib/locales/uk/shorts.json`

Create `payments.json` in all locale folders for payment-related strings.

---

## 8. Recommendations for Architecture Phase

### 8.1 File Structure Suggestion

```
src/
├── app/
│   ├── (main)/[locale]/
│   │   ├── panel/
│   │   │   ├── shorts/
│   │   │   │   ├── page.tsx           # Shorts list
│   │   │   │   ├── new/page.tsx       # Upload wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Short detail
│   │   │   │       └── publishing/page.tsx
│   │   │   └── credits/page.tsx
│   │   └── shorts/[id]/page.tsx       # Public view
│   └── api/
│       ├── shorts/
│       │   ├── route.ts               # GET/POST shorts
│       │   ├── upload-url/route.ts
│       │   └── [id]/
│       │       ├── route.ts           # GET/PATCH/DELETE
│       │       ├── publish/route.ts
│       │       └── renew/route.ts
│       ├── webhooks/
│       │   ├── qencode/route.ts
│       │   ├── przelewy24/route.ts
│       │   └── tpay/route.ts
│       ├── payments/
│       │   └── checkout/route.ts
│       └── credits/route.ts
├── components/
│   └── shorts/
│       ├── video-upload-wizard.tsx
│       ├── video-dropzone.tsx
│       ├── short-player.tsx
│       ├── short-metadata-form.tsx
│       ├── tags-autocomplete.tsx
│       ├── thumbnail-selector.tsx
│       ├── shorts-table.tsx
│       ├── processing-status-timeline.tsx
│       └── credits-display.tsx
├── lib/
│   ├── qencode.ts                     # Qencode API client
│   ├── payments/
│   │   ├── index.ts                   # Payment abstraction
│   │   ├── przelewy24.ts
│   │   └── tpay.ts
│   ├── publication/
│   │   └── publication-controller.ts  # Credit/publication logic
│   └── inngest/
│       ├── client.ts
│       └── functions/
│           ├── process-video.ts
│           ├── archive-expired.ts
│           └── send-expiry-reminder.ts
└── app/actions/
    └── shorts/
        ├── create.ts
        ├── update.ts
        ├── delete.ts
        ├── publish.ts
        └── renew.ts
```

### 8.2 Critical Path

1. **Database migration** (rename Mux fields)
2. **Install packages** (@vidstack/react, inngest)
3. **R2 video bucket setup** (video-raw, video-hls)
4. **Qencode integration** (API client + webhook)
5. **Payment providers** (Przelewy24 + Tpay)
6. **Upload wizard** (core UI)
7. **Processing status** (real-time updates)
8. **Credits system** (publication controller)

### 8.3 Risk Areas

| Risk | Mitigation |
|------|------------|
| Qencode integration complexity | Start with basic transcoding, add features incrementally |
| Multi-provider payments | Implement adapter pattern for provider abstraction |
| Real-time status updates | Use polling initially (5s), SSE as enhancement |
| Large video uploads | Client-side validation, presigned URLs, progress tracking |
