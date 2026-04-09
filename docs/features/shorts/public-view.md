# Public Short View

**Status:** Implemented (Stage 03)
**Components:** PublicShortView, ShortPlayer, ShortCompanyCard

---

## Overview

Public-facing page for viewing published shorts with HLS video player, company information, and engagement tracking.

---

## Page Structure

```
+------------------------------------------------------------------+
|                     VIDEO PLAYER (9:16)                          |
|                                                                  |
|                     +------------------+                         |
|                     |                  |                         |
|                     |     HLS Video    |                         |
|                     |                  |                         |
|                     +------------------+                         |
|                                                                  |
+------------------------------------------------------------------+
|  Title: Summer Sale Promotion                                    |
|  Description: Check out our amazing summer deals...              |
|  Category: Fashion | Tags: #sale #summer #fashion                |
+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  | [Logo] Company Name                                        |  |
|  | Category                                                   |  |
|  | City, Poland                          [View Profile]       |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
|  [CTA Button: Visit Website]               [Share]               |
+------------------------------------------------------------------+
|  Location Map (if available)                                     |
+------------------------------------------------------------------+
```

---

## Route

**URL:** `/{locale}/shorts/{id}`

**Example:** `/pl/shorts/clq1234abc567`

---

## Server Component

**File:** `src/app/(main)/[locale]/shorts/[id]/page.tsx`

```typescript
// Metadata generation for SEO
export async function generateMetadata({ params }): Promise<Metadata> {
  const short = await getShortById(params.id)
  return {
    title: short.title,
    description: short.description,
    openGraph: {
      title: short.title,
      description: short.description,
      images: [short.thumbnailUrl],
      videos: [{ url: short.hlsPlaylistUrl, type: 'application/x-mpegURL' }]
    }
  }
}
```

### Visibility Rules

| Status | Direct Link Access | Feed Visibility |
|--------|-------------------|-----------------|
| PUBLISHED | Yes | Yes |
| ARCHIVED | Yes (with banner) | No |
| DRAFT | No (404) | No |
| PROCESSING | No (404) | No |
| DELETED | No (404) | No |

---

## Components

### PublicShortView

Main layout component for public page.

```typescript
interface PublicShortViewProps {
  short: ShortWithCompany
}
```

### ShortPlayer

HLS video player using @vidstack/react.

```typescript
interface ShortPlayerProps {
  hlsUrl: string
  posterUrl?: string
  title: string
  autoPlay?: boolean
  muted?: boolean
  aspectRatio?: '9:16' | '16:9'
  onPlay?: () => void
  onEnded?: () => void
  className?: string
}
```

**Features:**
- Adaptive bitrate streaming (1080p/720p/480p)
- Poster image display
- Playback controls (play/pause, volume, fullscreen)
- Mobile-optimized touch controls
- Autoplay support (muted by default)

### ShortCompanyCard

Company information display.

```typescript
interface ShortCompanyCardProps {
  company: CompanyProfile
}
```

**Displays:**
- Company logo
- Company name
- Category
- City
- "View Profile" link

### ShortCtaButton

Call-to-action button with click tracking.

```typescript
interface ShortCtaButtonProps {
  shortId: string
  ctaLink: string
  label?: string
}
```

**Behavior:**
1. User clicks button
2. Fire-and-forget tracking request
3. Open link in new tab immediately
4. Add UTM parameters automatically

### ShortLocationMap

Location display with map.

```typescript
interface ShortLocationMapProps {
  latitude: number
  longitude: number
  address?: string
}
```

**Features:**
- Static map image (or mini Leaflet)
- Address display
- Click to open in Google Maps

### ShortShareButton

Share functionality.

```typescript
interface ShortShareButtonProps {
  shortId: string
  title: string
}
```

**Features:**
- Copy link to clipboard
- Native share API (mobile)
- Toast confirmation

---

## Stats Tracking

### View Tracking

Server-side tracking in page component (non-blocking).

```typescript
// src/lib/shorts/stats.ts
export async function trackShortView(shortId: string): Promise<void> {
  await db.shortStats.update({
    where: { shortId },
    data: { views: { increment: 1 } }
  })
}
```

### CTA Click Tracking

Client-side via API call.

**Endpoint:** `POST /api/shorts/[id]/track`

```typescript
// Request
{ event: 'cta_click' }

// Response
{ success: true }
```

**Events Tracked:**
| Event | Field Updated |
|-------|---------------|
| `view` | views |
| `cta_click` | ctaClicks |
| `like` | likes |
| `share` | shares |

---

## OpenGraph Image

**File:** `src/app/(main)/[locale]/shorts/[id]/opengraph-image.tsx`

Generates dynamic 1200x630 OG image with:
- Short thumbnail as background
- Title overlay
- Company logo
- VideoShorts branding

```typescript
import { ImageResponse } from 'next/og'

export default async function OpenGraphImage({ params }) {
  const short = await getShortById(params.id)

  return new ImageResponse(
    <div style={{ ... }}>
      <img src={short.thumbnailUrl} />
      <div>{short.title}</div>
      <img src={short.company.logo} />
    </div>,
    { width: 1200, height: 630 }
  )
}
```

---

## SEO Optimization

### Meta Tags

```html
<title>Summer Sale Promotion | VideoShorts</title>
<meta name="description" content="Check out our amazing summer deals..." />
<link rel="canonical" href="https://videoshorts.pl/shorts/clq123" />

<!-- OpenGraph -->
<meta property="og:title" content="Summer Sale Promotion" />
<meta property="og:description" content="Check out our amazing summer deals..." />
<meta property="og:image" content="https://videoshorts.pl/shorts/clq123/opengraph-image" />
<meta property="og:video" content="https://hls.videoshorts.pl/clq123/master.m3u8" />
<meta property="og:video:type" content="application/x-mpegURL" />

<!-- Twitter -->
<meta name="twitter:card" content="player" />
<meta name="twitter:title" content="Summer Sale Promotion" />
<meta name="twitter:player" content="https://videoshorts.pl/shorts/clq123/embed" />
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Summer Sale Promotion",
  "description": "Check out our amazing summer deals...",
  "thumbnailUrl": "https://cdn.videoshorts.pl/thumbnails/clq123.jpg",
  "uploadDate": "2025-12-30T10:00:00Z",
  "duration": "PT45S",
  "contentUrl": "https://hls.videoshorts.pl/clq123/master.m3u8",
  "publisher": {
    "@type": "Organization",
    "name": "Fashion Store",
    "logo": "https://cdn.videoshorts.pl/logos/fashionstore.jpg"
  }
}
```

---

## Archived Short Banner

When viewing an archived short via direct link:

```
+------------------------------------------------------------------+
| This short has been archived and is no longer in the public feed |
+------------------------------------------------------------------+
```

---

## Usage Example

```tsx
// src/app/(main)/[locale]/shorts/[id]/page.tsx
import { PublicShortView } from '@/components/shorts/public-short-view'
import { trackShortView } from '@/lib/shorts/stats'

export default async function ShortPage({ params }) {
  const short = await prisma.short.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      category: true,
      tags: { include: { tag: true } },
      stats: true
    }
  })

  if (!short || !['PUBLISHED', 'ARCHIVED'].includes(short.status)) {
    notFound()
  }

  // Track view (non-blocking)
  trackShortView(short.id).catch(console.error)

  return <PublicShortView short={short} />
}
```

---

## Related Documentation

- [Shorts Management](./management.md)
- [Publishing Workflow](./publishing.md)
- [Short Lifecycle](./lifecycle.md)

---

**Implemented:** 2026-01-01
**Last Updated:** 2026-01-01
