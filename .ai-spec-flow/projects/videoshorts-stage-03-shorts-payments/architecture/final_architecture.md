# Final Architecture: Stage 03 - Shorts Upload + Payments

**Project:** videoshorts-stage-03-shorts-payments
**Date:** 2025-12-31
**Status:** Approved
**Iterations:** 2

---

## Documents

This final architecture consists of two documents:

1. **`response_v1.md`** - Main architecture document containing:
   - Database schema design with Mux → Qencode migration
   - Frontend architecture (navigation, routing, components)
   - Backend architecture (server actions, API routes)
   - External service integrations (R2, Qencode, Przelewy24, Tpay)
   - Inngest background jobs
   - Data flow diagrams
   - Security considerations
   - Translations for EN and PL locales

2. **`response_v2.md`** - Addendum containing:
   - Complete translations for DE (German) locale
   - Complete translations for ES (Spanish) locale
   - Complete translations for RU (Russian) locale
   - Complete translations for UK (Ukrainian) locale

---

## Architecture Summary

### Database Changes
- Field rename migration: `muxAssetId` → `qencodeTaskId`, `muxPlaybackId` → `hlsPlaylistUrl`, `muxUploadId` → `rawVideoKey`
- Using `@map` decorator for non-destructive migration

### New Pages (6)
- `/[locale]/panel/shorts` - Shorts dashboard
- `/[locale]/panel/shorts/new` - Upload wizard
- `/[locale]/panel/shorts/[id]` - Short detail/edit
- `/[locale]/panel/shorts/[id]/publishing` - Processing status
- `/[locale]/panel/credits` - Credits management
- `/[locale]/shorts/[id]` - Public short view

### New Components (15+)
- VideoUploadWizard, VideoDropzone, ShortPlayer
- ShortMetadataForm, TagsAutocomplete, ThumbnailSelector
- ProcessingStatusTimeline, ShortsTable, ShortCard
- PublishDialog, ArchiveDialog, DeleteDialog, RenewDialog
- PaymentForm, CreditsPurchaseModal, CreditsHistory

### Server Actions (6)
- createShortAction, updateShortMetadataAction
- publishShortAction, archiveShortAction
- deleteShortAction, renewShortAction

### API Routes (8)
- POST /api/shorts/upload-url
- POST /api/shorts/thumbnail-url
- POST /api/webhooks/qencode
- POST /api/webhooks/przelewy24
- POST /api/webhooks/tpay
- POST /api/payments/checkout
- GET /api/payments/status/[id]
- GET /api/tags/search

### Inngest Jobs (4)
- shorts/transcode.started
- shorts/transcode.completed
- shorts/auto-archive (cron)
- shorts/expiry-reminder (cron)

### Translation Files (12 total)
- shorts.json (6 locales: de, en, es, pl, ru, uk)
- payments.json (6 locales: de, en, es, pl, ru, uk)

### NPM Packages
```bash
npm install @vidstack/react inngest
```

---

## Implementation Priority

### P0 (Critical)
1. Database migration
2. NPM packages installation
3. R2 video module
4. Translation files
5. Video upload flow
6. Qencode integration
7. Payment providers
8. Publishing flow

### P1 (High)
9. ShortsTable component
10. Short detail page
11. Navigation updates
12. Edit metadata

### P2 (Normal)
13. Auto-archive cron
14. Expiry reminders
15. Renewal flow
16. Archive/delete

---

## Approval

- **Critic Review:** OK (iteration 2)
- **Issues Resolved:** Missing translations for 4 locales (DE, ES, RU, UK)
- **Ready for:** Task Planning Phase
