# Feed Filtering System

**Status:** Implemented
**Stage:** 04 - Feed & Discovery

---

## Overview

The feed filtering system enables users to narrow down shorts by multiple criteria. All filters sync to URL query parameters for shareability and persistence across navigation.

---

## Filter Types

### 1. Sort Options

Control the ordering algorithm for feed results.

| Option | Key | Description |
|--------|-----|-------------|
| For You | `algorithmic` | AI-scored based on engagement, freshness, distance |
| Newest | `newest` | Most recently published first |
| Popular | `popular` | Highest total engagement |
| Trending | `trending` | Fastest growing engagement rate |
| Following | `following` | From followed companies only |

**Component:** `SortSelect`

```typescript
interface SortSelectProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

type SortOption = 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
```

**Usage:**
```tsx
import { SortSelect } from '@/components/feed/sort-select'

<SortSelect
  value={currentSort}
  onChange={(sort) => updateFilters({ sort })}
/>
```

### 2. Category Filter

Multi-select categories (max 5 by default).

**Component:** `CategoryFilter`

```typescript
interface CategoryFilterProps {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  maxSelection?: number  // Default: 5
}
```

**Features:**
- Checkbox multi-select
- Category icons (Lucide React)
- Max selection limit with warning
- Clear selection button

**Usage:**
```tsx
import { CategoryFilter } from '@/components/feed/category-filter'

<CategoryFilter
  categories={allCategories}
  selectedIds={selectedCategoryIds}
  onChange={(ids) => updateFilters({ categoryIds: ids })}
  maxSelection={5}
/>
```

### 3. Distance Filter

Location-based filtering with radius options.

**Component:** `DistanceFilter`

```typescript
interface DistanceFilterProps {
  value: number | null          // Radius in km, null = no filter
  onChange: (radius: number | null) => void
  userLocation: { lat: number; lng: number } | null
  onDetectLocation: () => void
  detecting?: boolean
}
```

**Radius Options:**
| Label | Value |
|-------|-------|
| 1 km | 1 |
| 5 km | 5 |
| 10 km | 10 |
| 25 km | 25 |
| 50 km | 50 |
| Whole country | null |

**Features:**
- Preset radius buttons
- "Detect location" button
- Loading state during detection
- Works without location (shows "Whole country")

**Usage:**
```tsx
import { DistanceFilter } from '@/components/feed/distance-filter'

<DistanceFilter
  value={radius}
  onChange={(r) => updateFilters({ radius: r })}
  userLocation={userLocation}
  onDetectLocation={handleDetectLocation}
  detecting={isDetecting}
/>
```

### 4. Verified Only Toggle

Filter to show only shorts from VIES-verified companies.

**Implementation:**
```tsx
<Checkbox
  checked={verifiedOnly}
  onCheckedChange={(checked) => updateFilters({ verifiedOnly: checked })}
/>
<Label>
  {t('filters.verifiedOnly.label')}
  <span className="text-muted-foreground">
    {t('filters.verifiedOnly.description')}
  </span>
</Label>
```

---

## Combined Filter Panel

The `FilterPanel` component combines all filters in a collapsible panel.

```typescript
interface FilterPanelProps {
  filters: FeedFilters
  onChange: (filters: FeedFilters) => void
  categories: Category[]
}

interface FeedFilters {
  sort: SortOption
  categoryIds: string[]
  radius: number | null
  lat?: number
  lng?: number
  verifiedOnly: boolean
}
```

**Features:**
- Collapsible panel (mobile-friendly)
- Active filters count badge
- "Clear all" button
- "Apply filters" button (mobile)
- Real-time updates (desktop)

**Usage:**
```tsx
import { FilterPanel } from '@/components/feed/filter-panel'

<FilterPanel
  filters={currentFilters}
  onChange={setFilters}
  categories={categories}
/>
```

---

## URL State Synchronization

All filter values sync to URL query parameters.

### URL Format

```
/[locale]?sort=newest&categoryIds=cat1,cat2&radius=10&lat=52.23&lng=21.01&verifiedOnly=true
```

### Parameter Mapping

| Filter | URL Param | Format |
|--------|-----------|--------|
| Sort | `sort` | String |
| Categories | `categoryIds` | Comma-separated |
| Radius | `radius` | Number (km) |
| Latitude | `lat` | Number |
| Longitude | `lng` | Number |
| Verified | `verifiedOnly` | Boolean |

### Implementation

```typescript
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function useFeedFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: FeedFilters = {
    sort: (searchParams.get('sort') as SortOption) || 'algorithmic',
    categoryIds: searchParams.get('categoryIds')?.split(',').filter(Boolean) || [],
    radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : null,
    lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
    lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
  }

  const setFilters = (newFilters: Partial<FeedFilters>) => {
    const params = new URLSearchParams(searchParams.toString())

    // Update each param
    if (newFilters.sort !== undefined) {
      if (newFilters.sort === 'algorithmic') {
        params.delete('sort')
      } else {
        params.set('sort', newFilters.sort)
      }
    }

    if (newFilters.categoryIds !== undefined) {
      if (newFilters.categoryIds.length === 0) {
        params.delete('categoryIds')
      } else {
        params.set('categoryIds', newFilters.categoryIds.join(','))
      }
    }

    // ... similar for other params

    router.push(`${pathname}?${params.toString()}`)
  }

  return { filters, setFilters }
}
```

---

## Location Detection

### Browser Geolocation API

```typescript
function handleDetectLocation() {
  setDetecting(true)

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setFilters({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        radius: radius || 10, // Default 10km if no radius set
      })
      setDetecting(false)
    },
    (error) => {
      console.error('Location error:', error)
      toast.error(t('filters.location.error'))
      setDetecting(false)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes cache
    }
  )
}
```

### Privacy Considerations

- Location only requested on user action (not automatic)
- Not stored on server
- URL params can be removed by user
- "Whole country" option always available

---

## Translations

### Polish (pl)
```json
{
  "filters": {
    "title": "Filtry",
    "apply": "Zastosuj filtry",
    "clear": "Wyczysc wszystkie",
    "location": {
      "label": "Lokalizacja",
      "radius": "Promien",
      "detectLocation": "Wykryj lokalizacje",
      "detecting": "Wykrywanie...",
      "wholeCountry": "Caly kraj",
      "nearMe": "W poblizu ({distance})"
    },
    "categories": {
      "label": "Kategorie",
      "placeholder": "Wybierz kategorie...",
      "maxSelected": "Maksymalnie {max} kategorii"
    },
    "verifiedOnly": {
      "label": "Tylko zweryfikowane",
      "description": "Pokaz tylko shorty od zweryfikowanych firm"
    },
    "activeFilters": "Aktywne filtry: {count}"
  }
}
```

### English (en)
```json
{
  "filters": {
    "title": "Filters",
    "apply": "Apply filters",
    "clear": "Clear all",
    "location": {
      "label": "Location",
      "radius": "Radius",
      "detectLocation": "Detect location",
      "detecting": "Detecting...",
      "wholeCountry": "Whole country",
      "nearMe": "Near me ({distance})"
    },
    "categories": {
      "label": "Categories",
      "placeholder": "Select categories...",
      "maxSelected": "Maximum {max} categories"
    },
    "verifiedOnly": {
      "label": "Verified only",
      "description": "Show only shorts from verified companies"
    },
    "activeFilters": "Active filters: {count}"
  }
}
```

---

## Mobile UX

### Responsive Design

- **Desktop:** Filters displayed inline, real-time updates
- **Mobile:** Filters in collapsible panel, "Apply" button

### Mobile Filter Panel

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4 mr-2" />
      {t('filters.title')}
      {activeCount > 0 && (
        <Badge className="ml-2">{activeCount}</Badge>
      )}
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>{t('filters.title')}</SheetTitle>
    </SheetHeader>
    {/* Filter controls */}
    <SheetFooter>
      <Button onClick={applyFilters}>{t('filters.apply')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## Related Documentation

- [Feed Overview](./overview.md)
- [Feed API Reference](../api/routes/feed.md)
- [Filter Components](../components/feed/filters.md)

---

**Implemented:** 2026-01-02
**Last Updated:** 2026-01-11
