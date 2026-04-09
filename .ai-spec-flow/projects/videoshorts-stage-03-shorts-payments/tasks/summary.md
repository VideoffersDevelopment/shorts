# Tasks Summary: Shorts Upload + Payments (Stage 03)

> **For Coder Agents** - Quick reference for task execution

---

## Task Execution Order

```
01 -> 02 -> 03 (parallel) -> 06 -> 07
            04 (parallel) ---^
      05 (parallel) --------^
```

**Recommended sequence:**
1. Task 01 (foundation)
2. Task 02 (R2 + APIs)
3. Task 03, 04, 05 (can run in parallel after 02)
4. Task 06 (after 03 + 05)
5. Task 07 (after 04 + 06)

---

## Quick Task Reference

### Task 01: Database + Infrastructure
**Files:** 8 | **Tokens:** ~8k | **Deps:** None

```
CREATE:
- src/lib/validation/shorts.ts
- src/lib/validation/payments.ts
- src/lib/inngest/client.ts
- src/lib/inngest/events.ts

MODIFY:
- prisma/schema.prisma (rename mux* -> qencode*)
- package.json (add @vidstack/react, inngest)
- i18n.ts (add shorts, payments namespaces)
- .env.example (add new env vars)

COMMANDS:
npm install @vidstack/react inngest
npx prisma migrate dev --name rename_mux_to_qencode
npm run build
```

---

### Task 02: R2 Video + Upload API
**Files:** 9 | **Tokens:** ~9k | **Deps:** Task 01

```
CREATE:
- src/lib/r2-video.ts
- src/app/api/shorts/upload-url/route.ts
- src/app/api/shorts/thumbnail-url/route.ts
- src/app/api/tags/search/route.ts
- src/lib/locales/{en,pl,de,es,ru,uk}/shorts.json (6 files)

VERIFY:
curl -X POST /api/shorts/upload-url -d '{"contentType":"video/mp4","fileSize":1000000}'
```

---

### Task 03: Upload Wizard UI
**Files:** 18 | **Tokens:** ~18k | **Deps:** Task 02

```
CREATE (components):
- src/components/shorts/video-dropzone.tsx
- src/components/shorts/video-preview.tsx
- src/components/shorts/short-metadata-form.tsx
- src/components/shorts/tags-autocomplete.tsx
- src/components/shorts/thumbnail-selector.tsx
- src/components/shorts/step-indicator.tsx
- src/components/shorts/video-upload-wizard.tsx

CREATE (actions/pages):
- src/app/actions/shorts/create.ts
- src/app/(main)/[locale]/panel/shorts/page.tsx
- src/app/(main)/[locale]/panel/shorts/new/page.tsx

MODIFY:
- src/components/layout/app-sidebar.tsx (add shorts, credits links)
- src/lib/locales/{en,pl,de,es,ru,uk}/sidebar.json (6 files)

REUSE:
- CategoryCombobox from companies
- AddressLocation from companies
- BannerUpload pattern for drag/drop
```

---

### Task 04: Qencode + Inngest
**Files:** 12 | **Tokens:** ~12k | **Deps:** Task 02

```
CREATE:
- src/lib/qencode.ts
- src/lib/inngest/functions/process-video.ts
- src/lib/inngest/functions/cleanup-video.ts
- src/app/api/inngest/route.ts
- src/app/api/webhooks/qencode/route.ts
- src/app/api/shorts/[id]/status/route.ts
- src/components/shorts/processing-status-timeline.tsx
- src/components/shorts/short-player.tsx
- src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx
- src/app/actions/shorts/publish.ts
- src/lib/email/templates/processing-complete.tsx

MODIFY:
- src/lib/email/index.ts

REQUIRES:
- Inngest dev server: npx inngest-cli@latest dev
- @vidstack/react styles imported
```

---

### Task 05: Payments + Credits
**Files:** 16 | **Tokens:** ~16k | **Deps:** Task 01

```
CREATE:
- src/lib/payments/index.ts
- src/lib/payments/przelewy24.ts
- src/lib/payments/tpay.ts
- src/lib/publication/publication-controller.ts
- src/app/api/payments/checkout/route.ts
- src/app/api/payments/status/[id]/route.ts
- src/app/api/webhooks/przelewy24/route.ts
- src/app/api/webhooks/tpay/route.ts
- src/components/payments/payment-form.tsx
- src/components/payments/credits-display.tsx
- src/components/shorts/publish-dialog.tsx
- src/app/(main)/[locale]/panel/credits/page.tsx
- src/lib/locales/{en,pl,de,es,ru,uk}/payments.json (6 files)

ENV VARS:
PRZELEWY24_MERCHANT_ID, PRZELEWY24_CRC, PRZELEWY24_API_KEY
TPAY_MERCHANT_ID, TPAY_SECURITY_CODE, TPAY_API_KEY
```

---

### Task 06: Management UI
**Files:** 19 | **Tokens:** ~19k | **Deps:** Task 03, Task 05

```
CREATE:
- src/components/shorts/shorts-table.tsx
- src/components/shorts/shorts-filters.tsx
- src/components/shorts/short-card.tsx
- src/components/shorts/edit-short-dialog.tsx
- src/components/shorts/archive-dialog.tsx
- src/components/shorts/delete-dialog.tsx
- src/components/payments/credits-history.tsx
- src/components/payments/credits-purchase-modal.tsx
- src/app/actions/shorts/update.ts
- src/app/actions/shorts/delete.ts
- src/app/actions/shorts/archive.ts
- src/app/actions/shorts/duplicate.ts
- src/app/api/shorts/route.ts
- src/app/api/shorts/[id]/route.ts
- src/app/api/credits/route.ts
- src/app/(main)/[locale]/panel/shorts/[id]/page.tsx

MODIFY:
- src/app/(main)/[locale]/panel/shorts/page.tsx
- src/app/(main)/[locale]/panel/credits/page.tsx
```

---

### Task 07: Lifecycle + Public View
**Files:** 14 | **Tokens:** ~14k | **Deps:** Task 04, Task 06

```
CREATE:
- src/lib/inngest/functions/archive-expired.ts
- src/lib/inngest/functions/expiry-reminder.ts
- src/lib/email/templates/expiry-reminder.tsx
- src/lib/email/templates/short-published.tsx
- src/app/actions/shorts/renew.ts
- src/components/shorts/renew-dialog.tsx
- src/app/(main)/[locale]/shorts/[id]/page.tsx
- src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx
- src/components/shorts/public-short-view.tsx
- src/components/shorts/short-company-card.tsx
- src/components/shorts/short-cta-button.tsx
- src/components/shorts/short-location-map.tsx
- src/components/shorts/short-share-button.tsx

MODIFY:
- src/app/api/inngest/route.ts (add new functions)
- src/lib/email/index.ts (add new email functions)
```

---

## Key Patterns

### Server Action Pattern
```typescript
"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createError, createSuccess, formatZodError } from "@/lib/types/action-result"
import { revalidatePath } from "next/cache"

export async function actionName(data: unknown): Promise<ActionResult<T>> {
  const session = await auth()
  if (!session?.user?.id) return createError("errors.unauthorized")
  // ... validation, db operation, revalidatePath
  return createSuccess(result)
}
```

### API Route Pattern
```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... process request
  return NextResponse.json(data)
}
```

### R2 Upload Pattern
```typescript
const key = `shorts/${companyId}/${nanoid()}`
const uploadUrl = await getVideoUploadUrl({ key, contentType })
return { uploadUrl, key }
```

---

## Validation Commands

```bash
# After each task:
npm run build
npx tsc --noEmit

# After Task 01:
npx prisma migrate dev --name rename_mux_to_qencode
npx prisma generate

# Test Inngest (Task 04+):
npx inngest-cli@latest dev
```

---

## Environment Variables (Full List)

```env
# R2 Video
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

---

## Component Reuse Map

| New Component | Reuse From |
|---------------|------------|
| VideoDropzone | BannerUpload (drag/drop pattern) |
| ShortMetadataForm | CompanyProfileForm (RHF + Zod) |
| TagsAutocomplete | CategoryCombobox (cmdk) |
| ThumbnailSelector | AvatarUpload (R2 upload) |
| ShortsTable | Admin DataTable pattern |
| ShortLocationMap | LocationMap component |
