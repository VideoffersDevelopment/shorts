# FeedCard Component

Card component for displaying a short thumbnail in the feed grid.

**File:** `src/components/feed/feed-card.tsx`
**Type:** Client Component

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `short` | `FeedShort` | Yes | - | Short data to display |

---

## Usage

### Basic Usage

```tsx
import { FeedCard } from '@/components/feed/feed-card'

<FeedCard short={short} />
```

### In Grid

```tsx
import { FeedCard } from '@/components/feed/feed-card'

<div className="grid grid-cols-3 gap-4">
  {shorts.map(short => (
    <FeedCard key={short.id} short={short} />
  ))}
</div>
```

---

## Features

- Thumbnail with aspect ratio (9:16)
- Hover preview animation
- Duration badge
- Company info (name, logo, verified badge)
- Location with distance
- Stats (views, likes)
- Click to navigate to detail page

---

## Visual Structure

```
+---------------------------+
|                           |
|       Thumbnail           |
|       (9:16 ratio)        |
|                           |
|  [Duration]               |
+---------------------------+
| [Logo] Company Name  [V]  |
| Location  |  2.5 km away  |
| 1.2K views  |  89 likes   |
+---------------------------+
```

---

## Implementation

```tsx
export function FeedCard({ short }: FeedCardProps) {
  const locale = useLocale()
  const t = useTranslations('feed')

  return (
    <Link href={`/${locale}/shorts/${short.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-[9/16]">
          {short.thumbnailUrl ? (
            <Image
              src={short.thumbnailUrl}
              alt={short.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Duration badge */}
          {short.duration && (
            <Badge className="absolute bottom-2 right-2">
              {formatDuration(short.duration)}
            </Badge>
          )}
        </div>

        {/* Card content */}
        <CardContent className="p-3">
          {/* Company info */}
          <div className="flex items-center gap-2 mb-2">
            {short.company.logo ? (
              <Image
                src={short.company.logo}
                alt={short.company.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted" />
            )}
            <span className="font-medium truncate">{short.company.name}</span>
            {short.company.verified && (
              <BadgeCheck className="h-4 w-4 text-blue-500" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium line-clamp-2 mb-2">
            {short.title}
          </h3>

          {/* Location & distance */}
          {(short.location || short.distance !== null) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              {short.location}
              {short.distance !== null && (
                <span>| {t('card.distance', { distance: `${short.distance} km` })}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(short.views)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatNumber(short.likes)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

---

## Helper Functions

### Format Duration

```typescript
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

### Format Number

```typescript
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}
```

---

## Styling

Uses shadcn/ui components:
- `Card`, `CardContent` for container
- `Badge` for duration
- `Image` from next/image for optimized images

Tailwind classes:
- `aspect-[9/16]` for vertical video ratio
- `line-clamp-2` for title truncation
- `hover:shadow-lg transition-shadow` for hover effect

---

## Accessibility

- Link wraps entire card for clickability
- Alt text for images
- Semantic heading for title
- Color contrast for text

---

## Dependencies

- `@/components/ui/card` - Card components
- `@/components/ui/badge` - Badge component
- `next/image` - Optimized images
- `next/link` - Client-side navigation
- `next-intl` - Translations
- `lucide-react` - Icons

---

## Related

- [FeedGrid Component](./feed-grid.md)
- [Feed Feature](../../features/feed/overview.md)
- [Short Detail Page](../../features/shorts/public-view.md)

---

**Last Updated:** 2026-01-11
