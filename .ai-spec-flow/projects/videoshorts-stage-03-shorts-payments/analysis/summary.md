# Analysis Summary: Shorts Upload + Payments (Stage 03)

> **Generated:** 2025-12-31
> **Full Analysis:** `./final_analysis.md`

---

## Reusable Components

| Component | Path | Reuse For |
|-----------|------|-----------|
| BannerUpload | `src/components/companies/banner-upload.tsx` | Drag & drop video upload pattern |
| AvatarUpload | `src/components/profile/avatar-upload.tsx` | Thumbnail upload, R2 presigned URL pattern |
| CompanyProfileForm | `src/components/companies/company-profile-form.tsx` | React Hook Form + Zod pattern for metadata form |
| CategoryCombobox | `src/components/companies/category-combobox.tsx` | Category selection in metadata |
| AddressLocation | `src/components/companies/address-location.tsx` | Location picker for shorts |
| LocationMap | `src/components/companies/location-map.tsx` | Map display on short page |
| VideoCard | `src/components/home/video-card.tsx` | Base for ShortCard component |
| Dialog | `src/components/ui/dialog.tsx` | Modals for edit, confirm dialogs |

## Patterns Found

### Frontend
- **Forms:** React Hook Form + zodResolver + Server Actions
- **Translation:** next-intl with `useTranslations('namespace')` client-side
- **Sidebar:** Role-based menu in `src/components/layout/app-sidebar.tsx`
- **R2 Upload:** Presigned URL generation + client-side upload

### Backend
- **Server Actions:** Auth → Authorization → Validate → DB → revalidatePath
- **ActionResult:** `createError()` / `createSuccess()` pattern
- **R2:** `getUploadUrl()`, `getPublicUrl()`, `deleteObject()` in `src/lib/r2.ts`

## Database

### Extend Models
- **User:** Already has `publicationCredits` field
- **Short:** Needs field rename migration (Mux → Qencode)

### Models Ready
- `Short`, `ShortStats`, `Tag`, `ShortTag`, `Payment`, `CreditTransaction`
- All required enums: `ShortStatus`, `PaymentProvider`, `PaymentStatus`, `CreditSource`

### Migration Required
```prisma
// Rename fields:
// muxAssetId -> qencodeTaskId
// muxPlaybackId -> hlsPlaylistUrl
// muxUploadId -> rawVideoKey
```

## Components to Create

| Priority | Component | Base Pattern |
|----------|-----------|--------------|
| P0 | VideoUploadWizard | New multi-step |
| P0 | VideoDropzone | BannerUpload |
| P0 | ShortPlayer | @vidstack/react |
| P0 | ProcessingStatusTimeline | New |
| P1 | ShortMetadataForm | CompanyProfileForm |
| P1 | TagsAutocomplete | cmdk combobox |
| P1 | ShortsTable | DataTable pattern |

## APIs to Create

| Priority | Endpoint | Complexity |
|----------|----------|------------|
| P0 | POST /api/shorts/upload-url | LOW |
| P0 | POST /api/shorts | MEDIUM |
| P0 | POST /api/webhooks/qencode | HIGH |
| P0 | POST /api/webhooks/przelewy24 | HIGH |
| P0 | POST /api/payments/checkout | HIGH |

## Missing Dependencies

| Package | Purpose |
|---------|---------|
| `@vidstack/react` | HLS video player |
| `inngest` | Background jobs, cron |

## Translation Files

Create in all locales (de, en, es, pl, ru, uk):
- `shorts.json` - Short-related strings
- `payments.json` - Payment-related strings

## Critical Path

1. Database migration (rename Mux → Qencode fields)
2. Install packages (@vidstack/react, inngest)
3. R2 video buckets setup
4. Qencode integration
5. Payment providers (Przelewy24, Tpay)
6. Upload wizard UI
7. Processing status page
