# FeedGrid Component

Responsive grid layout component for displaying shorts in the feed.

**File:** `src/components/feed/feed-grid.tsx`
**Type:** Client Component

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `shorts` | `FeedShort[]` | Yes | - | Array of shorts to display |
| `onLoadMore` | `() => void` | No | - | Callback for infinite scroll |
| `hasMore` | `boolean` | No | `false` | Whether more items exist |
| `loading` | `boolean` | No | `false` | Loading state |

---

## Usage

### Basic Usage

```tsx
import { FeedGrid } from '@/components/feed/feed-grid'

export default function FeedPage() {
  const shorts = await fetchFeedShorts()

  return <FeedGrid shorts={shorts} />
}
```

### With Infinite Scroll

```tsx
import { FeedGrid } from '@/components/feed/feed-grid'
import { useFeed } from '@/hooks/use-feed'

export default function InfiniteFeed() {
  const { shorts, loadMore, hasMore, loading } = useFeed()

  return (
    <FeedGrid
      shorts={shorts}
      onLoadMore={loadMore}
      hasMore={hasMore}
      loading={loading}
    />
  )
}
```

### Empty State

When `shorts` is empty, shows EmptyState component:

```tsx
// Automatically rendered when shorts.length === 0
<EmptyState variant="no-shorts" />
```

---

## Features

- Responsive grid (1-5 columns based on viewport)
- Infinite scroll with intersection observer
- Loading skeletons
- Empty state handling
- Smooth animations

---

## Responsive Grid

| Viewport | Columns | Gap |
|----------|---------|-----|
| < 640px (mobile) | 1 | 16px |
| 640-768px (sm) | 2 | 24px |
| 768-1024px (md) | 3 | 24px |
| 1024-1280px (lg) | 4 | 24px |
| > 1280px (xl) | 5 | 24px |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
  {shorts.map(short => (
    <FeedCard key={short.id} short={short} />
  ))}
</div>
```

---

## Infinite Scroll

Uses `useIntersectionObserver` hook:

```tsx
const loadMoreRef = useRef<HTMLDivElement>(null)
const entry = useIntersectionObserver(loadMoreRef, {
  threshold: 0.1,
  rootMargin: '100px',
})

useEffect(() => {
  if (entry?.isIntersecting && hasMore && !loading) {
    onLoadMore?.()
  }
}, [entry?.isIntersecting, hasMore, loading, onLoadMore])

return (
  <>
    <div className="grid ...">
      {/* cards */}
    </div>
    {hasMore && (
      <div ref={loadMoreRef} className="h-10">
        {loading && <Spinner />}
      </div>
    )}
  </>
)
```

---

## Dependencies

- `@/components/feed/feed-card` - Individual short card
- `@/components/feed/feed-skeleton` - Loading skeleton
- `@/components/feed/empty-state` - No results display
- `@/hooks/use-intersection-observer` - Infinite scroll hook

---

## Related

- [FeedCard Component](./feed-card.md)
- [FeedSkeleton Component](./feed-skeleton.md)
- [EmptyState Component](./empty-state.md)
- [Feed Feature](../../features/feed/overview.md)

---

**Last Updated:** 2026-01-11
