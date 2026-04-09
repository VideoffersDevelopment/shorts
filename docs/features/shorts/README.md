# Shorts Feature Documentation

Video shorts upload, management, publishing, and public viewing.

---

## Overview

The Shorts feature is the core business functionality of VideoShorts, allowing companies to upload, publish, and manage short-form video content for 30-day periods.

---

## Feature Sections

### [Upload](./upload.md)

Multi-step wizard for uploading video shorts:
- Drag & drop video upload
- Direct-to-R2 upload with presigned URLs
- Client-side validation (format, size, duration)
- Metadata form (title, description, category, tags)
- Custom thumbnail upload

### [Management](./management.md)

Complete CRUD operations for shorts:
- Dashboard with table/grid views
- Status filtering and search
- Edit metadata
- Archive published shorts
- Delete drafts
- Duplicate as new draft

### [Publishing](./publishing.md)

Publication workflow with credits/payments:
- Company verification check
- Credit-based publication
- Payment integration (if no credits)
- Qencode HLS transcoding
- Processing status tracking
- Email notifications

### [Public View](./public-view.md)

Public-facing short pages:
- HLS video player (@vidstack/react)
- Company information card
- CTA button with click tracking
- Location map
- Share functionality
- SEO optimization

---

## Short Lifecycle

```
                    +----------------+
                    |   Video        |
                    |   Upload       |
                    +-------+--------+
                            |
                            v
+----------+        +-------+--------+
|  DRAFT   |<-------|   Create       |
|          |        |   Metadata     |
+----+-----+        +----------------+
     |
     | Publish
     v
+----+-----+        +----------------+
| PENDING  |------->|   Payment      |
| PAYMENT  |        |   (if needed)  |
+----+-----+        +----------------+
     |
     | Payment Complete
     v
+----+-----+        +----------------+
|PROCESSING|<-------|   Qencode      |
|          |        |   Transcode    |
+----+-----+        +----------------+
     |
     | Transcode Complete
     v
+----+-----+
|PUBLISHED |<---------- 30 days ------+
|          |                          |
+----+-----+                          |
     |                                |
     | Expiry or Manual               | Renew
     v                                |
+----+-----+                          |
| ARCHIVED |--------------------------+
|          |
+----------+
```

---

## Status Reference

| Status | Description | User Actions |
|--------|-------------|--------------|
| DRAFT | Initial state, not published | Edit, Publish, Delete, Duplicate |
| PENDING_PAYMENT | Waiting for payment | Complete payment |
| PROCESSING | Video being transcoded | View status (no actions) |
| PUBLISHED | Live and visible | Edit, Archive, Duplicate |
| ARCHIVED | Expired or manually archived | Renew, Duplicate |
| DELETED | Soft deleted | (hidden from UI) |

---

## Components

| Component | Purpose | File |
|-----------|---------|------|
| VideoUploadWizard | Multi-step upload wizard | `video-upload-wizard.tsx` |
| VideoDropzone | Drag & drop upload | `video-dropzone.tsx` |
| ShortMetadataForm | Metadata input form | `short-metadata-form.tsx` |
| ShortPlayer | HLS video player | `short-player.tsx` |
| ShortsTable | Management table | `shorts-table.tsx` |
| PublishDialog | Publication confirmation | `publish-dialog.tsx` |
| PublicShortView | Public page layout | `public-short-view.tsx` |

---

## Server Actions

| Action | File | Purpose |
|--------|------|---------|
| createShortAction | `create.ts` | Create draft |
| updateShortMetadataAction | `update.ts` | Update metadata |
| publishShortAction | `publish.ts` | Initiate publication |
| archiveShortAction | `archive.ts` | Archive published |
| deleteShortAction | `delete.ts` | Delete draft |
| duplicateShortAction | `duplicate.ts` | Duplicate as draft |
| renewShortAction | `renew.ts` | Renew archived |

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shorts/upload-url` | POST | Video upload URL |
| `/api/shorts/thumbnail-url` | POST | Thumbnail upload URL |
| `/api/shorts` | GET/POST | List/create |
| `/api/shorts/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/shorts/[id]/status` | GET | Processing status |
| `/api/shorts/[id]/track` | POST | Stats tracking |

---

## Database

| Model | Purpose |
|-------|---------|
| Short | Main short entity |
| ShortStats | View/engagement tracking |
| Tag | Content tags |
| ShortTag | Many-to-many junction |

---

## External Services

| Service | Purpose |
|---------|---------|
| Cloudflare R2 | Video storage (raw + HLS) |
| Qencode | HLS transcoding |
| @vidstack/react | Video player |
| Inngest | Background jobs |

---

## Related Documentation

- [Credits System](../payments/credits.md)
- [Payment Checkout](../payments/checkout.md)
- [Server Actions](../../api/server-actions/shorts.md)
- [Webhooks](../../api/webhooks/README.md)
- [Database Models](../../database/models/short.md)
- [Qencode Integration](../../guides/qencode-integration.md)
- [Inngest Jobs](../../guides/inngest-jobs.md)

---

**Implemented:** Stage 03 (2026-01-01)
**Last Updated:** 2026-01-01
