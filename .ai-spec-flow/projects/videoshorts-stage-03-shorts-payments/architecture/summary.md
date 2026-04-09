# Architecture Summary: Shorts Upload + Payments (Stage 03)

> **Generated:** 2025-12-31
> **Full Architecture:** `./final_architecture.md` (references `response_v1.md` + `response_v2.md`)

---

## Quick Reference

### Database Migration

```prisma
// Rename fields (use @map for non-destructive):
qencodeTaskId   String?  @unique @map("muxAssetId")
hlsPlaylistUrl  String?  @unique @map("muxPlaybackId")
rawVideoKey     String?  @map("muxUploadId")
```

### NPM Packages

```bash
npm install @vidstack/react inngest
```

---

## Frontend Architecture

### Navigation Update

**File:** `src/components/layout/app-sidebar.tsx`

```typescript
// ADD to companyItems array:
{ href: `/${locale}/panel/shorts`, icon: Video, label: t("company.shorts") },
{ href: `/${locale}/panel/credits`, icon: CreditCard, label: t("company.credits") }
```

### New Pages

| Route                           | File Path                                                       |
| ------------------------------- | --------------------------------------------------------------- |
| `/panel/shorts`                 | `src/app/(main)/[locale]/panel/shorts/page.tsx`                 |
| `/panel/shorts/new`             | `src/app/(main)/[locale]/panel/shorts/new/page.tsx`             |
| `/panel/shorts/[id]`            | `src/app/(main)/[locale]/panel/shorts/[id]/page.tsx`            |
| `/panel/shorts/[id]/publishing` | `src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx` |
| `/panel/credits`                | `src/app/(main)/[locale]/panel/credits/page.tsx`                |
| `/shorts/[id]`                  | `src/app/(main)/[locale]/shorts/[id]/page.tsx`                  |

### Key Components

| Component                | Purpose           | Base Pattern       |
| ------------------------ | ----------------- | ------------------ |
| VideoUploadWizard        | Multi-step upload | New                |
| VideoDropzone            | Drag & drop video | BannerUpload       |
| ShortPlayer              | HLS playback      | @vidstack/react    |
| ShortMetadataForm        | Metadata form     | CompanyProfileForm |
| ProcessingStatusTimeline | Status display    | New                |
| ShortsTable              | Management table  | DataTable          |

### Translation Files

- `src/lib/locales/{de,en,es,pl,ru,uk}/shorts.json`
- `src/lib/locales/{de,en,es,pl,ru,uk}/payments.json`

---

## Backend Architecture

### Server Actions

| Action                    | Purpose                     |
| ------------------------- | --------------------------- |
| createShortAction         | Create draft short          |
| updateShortMetadataAction | Update metadata             |
| publishShortAction        | Publish with credit/payment |
| archiveShortAction        | Archive published short     |
| deleteShortAction         | Delete draft                |
| renewShortAction          | Renew archived short        |

### API Routes

| Endpoint                       | Purpose                        |
| ------------------------------ | ------------------------------ |
| POST /api/shorts/upload-url    | R2 presigned URL for video     |
| POST /api/shorts/thumbnail-url | R2 presigned URL for thumbnail |
| POST /api/webhooks/qencode     | Transcoding status             |
| POST /api/webhooks/przelewy24  | Payment status (P24)           |
| POST /api/webhooks/tpay        | Payment status (Tpay)          |
| POST /api/payments/checkout    | Create payment                 |
| GET /api/tags/search           | Search existing tags           |

### Inngest Background Jobs

| Event                      | Schedule     | Purpose                |
| -------------------------- | ------------ | ---------------------- |
| shorts/transcode.started   | On demand    | Start Qencode job      |
| shorts/transcode.completed | On webhook   | Cleanup raw video      |
| shorts/auto-archive        | 0 3 \* \* \* | Archive expired shorts |
| shorts/expiry-reminder     | 0 9 \* \* \* | Send 7-day warnings    |

---

## External Services

### Cloudflare R2

- **video-raw bucket:** Private, 24h TTL lifecycle
- **video-hls bucket:** Public CDN access

### Qencode

- HLS transcoding (1080p, 720p, 480p)
- Webhook notification on completion

### Przelewy24 (Primary)

- SHA384 signature verification
- BLIK, cards, bank transfer, Google Pay

### Tpay (Secondary)

- MD5 signature verification
- BLIK, cards, bank transfer, Apple Pay

---

## Data Flows

### Video Upload

```
User → VideoDropzone → R2 presigned URL → R2 Raw → createShortAction → DRAFT
```

### Publish (with credits)

```
DRAFT → publishShortAction → deduct credit → PROCESSING → Qencode → PUBLISHED
```

### Publish (payment required)

```
DRAFT → PENDING_PAYMENT → Payment provider → webhook → add credits → PROCESSING → Qencode → PUBLISHED
```

### Auto-Archive

```
Cron daily 3 AM → Find expired → Update status to ARCHIVED
```

---

## Environment Variables

```env
# R2 Video
R2_VIDEO_RAW_BUCKET=videoshorts-raw
R2_VIDEO_HLS_BUCKET=videoshorts-hls
R2_VIDEO_HLS_PUBLIC_URL=https://cdn.videoffers.com

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

---

## Implementation Order

1. **Database** - Migration (Mux → Qencode)
2. **Packages** - @vidstack/react, inngest
3. **Infrastructure** - R2 video module, translations
4. **Upload Flow** - VideoDropzone, wizard, createShortAction
5. **Processing** - Qencode integration, Inngest jobs
6. **Payments** - P24/Tpay, webhooks, credits
7. **UI** - ShortsTable, navigation, pages
8. **Lifecycle** - Auto-archive, reminders, renewal
