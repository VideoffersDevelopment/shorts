# Task 07: Lifecycle + Public View

## Overview

**Priority:** MEDIUM
**Dependencies:** Task 04, Task 06
**Complexity:** Medium (14 files, ~14k tokens)
**Status:** pending

## What to Build

Short lifecycle management and public viewing:
1. Auto-archive cron job (30-day expiry)
2. Expiry reminder emails (7 days before)
3. Published notification email
4. Renewal flow for archived shorts
5. Public short view page
6. SEO/OpenGraph optimization
7. Short sharing components
8. Company card for public view

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/inngest/functions/archive-expired.ts` | Create | Daily cron to archive expired shorts |
| `src/lib/inngest/functions/expiry-reminder.ts` | Create | Daily cron to send 7-day reminders |
| `src/lib/email/templates/expiry-reminder.tsx` | Create | Email template for expiry warning |
| `src/lib/email/templates/short-published.tsx` | Create | Email template for "Your short is live!" |
| `src/app/actions/shorts/renew.ts` | Create | Renew archived short action |
| `src/components/shorts/renew-dialog.tsx` | Create | Renewal confirmation dialog |
| `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Create | Public short view page |
| `src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx` | Create | Dynamic OG image generation |
| `src/components/shorts/public-short-view.tsx` | Create | Public view layout component |
| `src/components/shorts/short-company-card.tsx` | Create | Company info card for public view |
| `src/components/shorts/short-cta-button.tsx` | Create | CTA button with tracking |
| `src/components/shorts/short-location-map.tsx` | Create | Location map for public view |
| `src/components/shorts/short-share-button.tsx` | Create | Share button (placeholder) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/api/inngest/route.ts` | Add archive-expired and expiry-reminder functions |
| `src/lib/email/index.ts` | Add sendExpiryReminderEmail and sendShortPublishedEmail |

## Implementation Details

### 1. Auto-Archive Cron Job

**File:** `src/lib/inngest/functions/archive-expired.ts`

```typescript
export const archiveExpiredShorts = inngest.createFunction(
  { id: "archive-expired-shorts", name: "Auto-Archive Expired Shorts" },
  { cron: "0 3 * * *" },  // Daily at 3 AM
  async ({ step }) => {
    // 1. Find all PUBLISHED shorts where expiresAt <= now()
    // 2. Update status -> ARCHIVED, archivedAt = now()
    // 3. Return count of archived shorts
  }
)
```

### 2. Expiry Reminder Cron Job

**File:** `src/lib/inngest/functions/expiry-reminder.ts`

```typescript
export const sendExpiryReminders = inngest.createFunction(
  { id: "send-expiry-reminders", name: "Send 7-Day Expiry Reminders" },
  { cron: "0 9 * * *" },  // Daily at 9 AM
  async ({ step }) => {
    // 1. Calculate date 7 days from now
    // 2. Find PUBLISHED shorts expiring that day
    // 3. Send reminder email to each company owner
    // 4. Return count of reminders sent
  }
)
```

### 3. Email Templates

**expiry-reminder.tsx:**
```typescript
interface ExpiryReminderEmailProps {
  shortTitle: string
  shortId: string
  expiresAt: Date
  renewUrl: string
}

// Content:
// "Your short '[title]' expires in 7 days"
// "Renew now to keep it visible in the feed"
// [Renew Now] button -> renewUrl
```

**short-published.tsx:**
```typescript
interface ShortPublishedEmailProps {
  shortTitle: string
  shortId: string
  publicUrl: string
  expiresAt: Date
}

// Content:
// "Your short '[title]' is now live!"
// "It will be visible for 30 days until [date]"
// [View Your Short] button -> publicUrl
```

### 4. Renew Action

**File:** `src/app/actions/shorts/renew.ts`

```typescript
export async function renewShortAction(
  shortId: string
): Promise<ActionResult<{ redirectUrl: string }>>

// Steps:
// 1. AUTH + ownership check
// 2. Validate status (ARCHIVED only)
// 3. Check credits:
//    - If credits > 0: deduct, update short, return { processing: true }
//    - If no credits: create payment checkout, return { redirectUrl }
// 4. On renewal:
//    - status -> PUBLISHED
//    - publishedAt = now()
//    - expiresAt = now() + 30 days
//    - Clear archivedAt
```

### 5. RenewDialog Component

```typescript
interface RenewDialogProps {
  short: Short
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Shows:
// - "Renew for another 30 days"
// - Current credits balance
// - If credits: "Use 1 Credit" button
// - If no credits: Provider selection + "Pay 5 PLN" button
```

### 6. Public Short View Page

**File:** `src/app/(main)/[locale]/shorts/[id]/page.tsx`

```typescript
// Server component with metadata
export async function generateMetadata({ params }): Promise<Metadata>
// - title: short.title
// - description: short.description
// - openGraph: thumbnail, video

export default async function PublicShortPage({ params })
// - Fetch short with company
// - Validate status (PUBLISHED or ARCHIVED with direct link)
// - Track view (increment stats)
// - Render PublicShortView component
```

### 7. OpenGraph Image

**File:** `src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx`

```typescript
import { ImageResponse } from 'next/og'

export default async function OpenGraphImage({ params })
// Generate 1200x630 image with:
// - Short thumbnail as background
// - Title overlay
// - Company logo
// - VideoShorts branding
```

### 8. PublicShortView Component

```typescript
interface PublicShortViewProps {
  short: ShortWithCompany
}

// Layout:
// - Full-width video player (9:16 aspect, centered on desktop)
// - Below video:
//   - Title
//   - Description
//   - Category badge
//   - Tags
//   - ShortCompanyCard
//   - ShortLocationMap (if location set)
//   - ShortCtaButton (if CTA link set)
// - ShortShareButton (floating or in toolbar)
```

### 9. ShortCompanyCard Component

```typescript
interface ShortCompanyCardProps {
  company: CompanyProfile
}

// Shows:
// - Company logo
// - Company name
// - Category
// - "View Profile" link -> /companies/[slug]
// - Location (city)
```

### 10. ShortCtaButton Component

```typescript
interface ShortCtaButtonProps {
  shortId: string
  ctaLink: string
  label?: string
}

// Features:
// - Prominent CTA button
// - Opens link in new tab
// - Tracks click (increment ctaClicks stat)
// - UTM parameters added automatically
```

### 11. ShortLocationMap Component

```typescript
interface ShortLocationMapProps {
  latitude: number
  longitude: number
  address?: string
}

// Features:
// - Static map image or mini Leaflet map
// - Click to open in Google Maps
// - Address display
```

### 12. ShortShareButton Component

```typescript
interface ShortShareButtonProps {
  shortId: string
  title: string
}

// Features:
// - Copy link to clipboard
// - Native share API (if available)
// - Social share options (placeholder for post-MVP)
```

## Acceptance Criteria

- [ ] Auto-archive cron runs daily at 3 AM
- [ ] Expired shorts archived correctly
- [ ] Expiry reminder emails sent 7 days before
- [ ] Published notification emails sent
- [ ] Renew dialog works for archived shorts
- [ ] Renewal with credits works
- [ ] Renewal with payment works
- [ ] Public page displays short correctly
- [ ] Video player works (HLS)
- [ ] Company card links to profile
- [ ] CTA button tracks clicks
- [ ] Location map displays correctly
- [ ] OpenGraph image generates correctly
- [ ] SEO metadata correct
- [ ] Archived shorts accessible via direct link
- [ ] `npm run build` passes

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Inngest dev server running
- Published short available
- Archived short available

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to public short | Page loads | `/shorts/[id]` |
| 2 | Verify video player | HLS video plays | `.vidstack-player` |
| 3 | Verify title/description | Content displayed | `h1`, `.description` |
| 4 | Verify company card | Company info shown | `.company-card` |
| 5 | Click "View Profile" | Redirects to company page | `/companies/[slug]` |
| 6 | Verify CTA button | Button visible (if set) | `.cta-button` |
| 7 | Click CTA button | Opens in new tab | |
| 8 | Verify location map | Map displayed (if set) | `.location-map` |
| 9 | Navigate to archived short | Page loads (direct link) | `/shorts/[archived-id]` |
| 10 | Verify archived banner | "Archived" indicator | `.archived-banner` |
| 11 | Go to panel, view archived | Renew button visible | `/panel/shorts/[id]` |
| 12 | Click Renew | Dialog opens | `button:has-text("Renew")` |
| 13 | Confirm renewal | Short renewed | |

### OpenGraph Testing

```bash
# Use online OG debugger or curl
curl -I https://localhost:3000/shorts/[id]
# Check meta tags

# Or use Facebook Sharing Debugger / Twitter Card Validator
```

### Cron Job Testing

```bash
# In Inngest dev UI:
# 1. Trigger "archive-expired-shorts" manually
# 2. Verify expired shorts archived
# 3. Trigger "send-expiry-reminders" manually
# 4. Check email logs for reminder
```

### Screenshot Checkpoints

- `01-public-short-view.png` - Full public page
- `02-video-player.png` - Video playing
- `03-company-card.png` - Company info section
- `04-cta-button.png` - CTA button
- `05-location-map.png` - Location map
- `06-archived-banner.png` - Archived short indicator
- `07-renew-dialog.png` - Renewal dialog

## Notes

- Archived shorts are still accessible via direct link but not in feed
- View tracking uses ShortStats model (increment views)
- CTA click tracking uses ShortStats model (increment ctaClicks)
- OpenGraph image should be cached (revalidate on update)
- Share functionality is placeholder for post-MVP enhancement
- Location map can use static image initially for simplicity
