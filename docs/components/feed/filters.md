# Feed Filter Components

Filter UI components for the feed with URL state synchronization.

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| SortSelect | `src/components/feed/sort-select.tsx` | Sort dropdown |
| CategoryFilter | `src/components/feed/category-filter.tsx` | Category multi-select |
| DistanceFilter | `src/components/feed/distance-filter.tsx` | Location radius |
| FilterPanel | `src/components/feed/filter-panel.tsx` | Combined filter panel |

---

## SortSelect

Dropdown for selecting feed sort algorithm.

**File:** `src/components/feed/sort-select.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `SortOption` | Yes | Current sort value |
| `onChange` | `(sort: SortOption) => void` | Yes | Change handler |

### Usage

```tsx
import { SortSelect } from '@/components/feed/sort-select'

<SortSelect
  value={currentSort}
  onChange={(sort) => setSort(sort)}
/>
```

### Options

```typescript
type SortOption = 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
```

| Option | Label (en) | Description |
|--------|------------|-------------|
| `algorithmic` | For You | AI-scored |
| `newest` | Newest | Most recent |
| `popular` | Popular | Most engagement |
| `trending` | Trending | Fast growing |
| `following` | Following | Followed companies |

### Implementation

```tsx
export function SortSelect({ value, onChange }: SortSelectProps) {
  const t = useTranslations('feed')

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('sort.label')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="algorithmic">{t('sort.algorithmic')}</SelectItem>
        <SelectItem value="newest">{t('sort.newest')}</SelectItem>
        <SelectItem value="popular">{t('sort.popular')}</SelectItem>
        <SelectItem value="trending">{t('sort.trending')}</SelectItem>
        <SelectItem value="following">{t('sort.following')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

---

## CategoryFilter

Multi-select for filtering by categories.

**File:** `src/components/feed/category-filter.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `categories` | `Category[]` | Yes | - | Available categories |
| `selectedIds` | `string[]` | Yes | - | Selected category IDs |
| `onChange` | `(ids: string[]) => void` | Yes | - | Change handler |
| `maxSelection` | `number` | No | `5` | Max categories to select |

### Usage

```tsx
import { CategoryFilter } from '@/components/feed/category-filter'

<CategoryFilter
  categories={allCategories}
  selectedIds={selectedCategoryIds}
  onChange={(ids) => setSelectedCategoryIds(ids)}
  maxSelection={5}
/>
```

### Implementation

```tsx
export function CategoryFilter({
  categories,
  selectedIds,
  onChange,
  maxSelection = 5,
}: CategoryFilterProps) {
  const t = useTranslations('feed')

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else if (selectedIds.length < maxSelection) {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      <Label>{t('filters.categories.label')}</Label>
      {selectedIds.length >= maxSelection && (
        <p className="text-sm text-muted-foreground">
          {t('filters.categories.maxSelected', { max: maxSelection })}
        </p>
      )}
      <div className="space-y-1">
        {categories.map(category => (
          <div key={category.id} className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.includes(category.id)}
              onCheckedChange={() => handleToggle(category.id)}
              disabled={
                !selectedIds.includes(category.id) &&
                selectedIds.length >= maxSelection
              }
            />
            {category.icon && <CategoryIcon name={category.icon} />}
            <span>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## DistanceFilter

Location radius selector with detection button.

**File:** `src/components/feed/distance-filter.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number \| null` | Yes | Current radius (km) |
| `onChange` | `(radius: number \| null) => void` | Yes | Change handler |
| `userLocation` | `{ lat: number; lng: number } \| null` | Yes | User coordinates |
| `onDetectLocation` | `() => void` | Yes | Detection callback |
| `detecting` | `boolean` | No | Detection in progress |

### Usage

```tsx
import { DistanceFilter } from '@/components/feed/distance-filter'

<DistanceFilter
  value={radius}
  onChange={(r) => setRadius(r)}
  userLocation={userLocation}
  onDetectLocation={handleDetectLocation}
  detecting={isDetecting}
/>
```

### Radius Options

| Label | Value |
|-------|-------|
| 1 km | `1` |
| 5 km | `5` |
| 10 km | `10` |
| 25 km | `25` |
| 50 km | `50` |
| Whole country | `null` |

### Implementation

```tsx
const RADIUS_OPTIONS = [
  { value: 1, label: '1km' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
  { value: 25, label: '25km' },
  { value: 50, label: '50km' },
  { value: null, label: 'all' },
]

export function DistanceFilter({
  value,
  onChange,
  userLocation,
  onDetectLocation,
  detecting = false,
}: DistanceFilterProps) {
  const t = useTranslations('feed')

  return (
    <div className="space-y-3">
      <Label>{t('filters.location.label')}</Label>

      {!userLocation && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDetectLocation}
          disabled={detecting}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {detecting
            ? t('filters.location.detecting')
            : t('filters.location.detectLocation')
          }
        </Button>
      )}

      {userLocation && (
        <RadioGroup value={String(value)} onValueChange={(v) => onChange(v === 'null' ? null : Number(v))}>
          {RADIUS_OPTIONS.map(option => (
            <div key={String(option.value)} className="flex items-center gap-2">
              <RadioGroupItem value={String(option.value)} />
              <Label>
                {t(`filters.location.radiusOptions.${option.label}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  )
}
```

---

## FilterPanel

Combined filter panel with all filters.

**File:** `src/components/feed/filter-panel.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `FeedFilters` | Yes | Current filter state |
| `onChange` | `(filters: FeedFilters) => void` | Yes | Change handler |
| `categories` | `Category[]` | Yes | Available categories |

### Usage

```tsx
import { FilterPanel } from '@/components/feed/filter-panel'

<FilterPanel
  filters={currentFilters}
  onChange={setFilters}
  categories={categories}
/>
```

### Implementation

```tsx
export function FilterPanel({
  filters,
  onChange,
  categories,
}: FilterPanelProps) {
  const t = useTranslations('feed')
  const [userLocation, setUserLocation] = useState<Coords | null>(null)
  const [detecting, setDetecting] = useState(false)

  const activeCount = [
    filters.categoryIds.length > 0,
    filters.radius !== null,
    filters.verifiedOnly,
  ].filter(Boolean).length

  const handleDetectLocation = () => {
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        onChange({
          ...filters,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setDetecting(false)
      },
      () => setDetecting(false)
    )
  }

  const handleClearAll = () => {
    onChange({
      sort: 'algorithmic',
      categoryIds: [],
      radius: null,
      lat: undefined,
      lng: undefined,
      verifiedOnly: false,
    })
  }

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          {t('filters.title')}
          {activeCount > 0 && (
            <Badge className="ml-2">{activeCount}</Badge>
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 p-4 border rounded-lg mt-2">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedIds={filters.categoryIds}
          onChange={(ids) => onChange({ ...filters, categoryIds: ids })}
        />

        {/* Distance Filter */}
        <DistanceFilter
          value={filters.radius}
          onChange={(radius) => onChange({ ...filters, radius })}
          userLocation={userLocation}
          onDetectLocation={handleDetectLocation}
          detecting={detecting}
        />

        {/* Verified Only */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) =>
              onChange({ ...filters, verifiedOnly: !!checked })
            }
          />
          <div>
            <Label>{t('filters.verifiedOnly.label')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('filters.verifiedOnly.description')}
            </p>
          </div>
        </div>

        {/* Clear Button */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            {t('filters.clear')}
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
```

---

## URL State Hook

```typescript
// src/hooks/use-feed-filters.ts
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

  const setFilters = (newFilters: FeedFilters) => {
    const params = new URLSearchParams()

    if (newFilters.sort !== 'algorithmic') {
      params.set('sort', newFilters.sort)
    }
    if (newFilters.categoryIds.length > 0) {
      params.set('categoryIds', newFilters.categoryIds.join(','))
    }
    if (newFilters.radius !== null) {
      params.set('radius', String(newFilters.radius))
    }
    if (newFilters.lat !== undefined) {
      params.set('lat', String(newFilters.lat))
    }
    if (newFilters.lng !== undefined) {
      params.set('lng', String(newFilters.lng))
    }
    if (newFilters.verifiedOnly) {
      params.set('verifiedOnly', 'true')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return { filters, setFilters }
}
```

---

## Related

- [Feed Filtering Feature](../../features/feed/filtering.md)
- [Feed API](../../api/routes/feed.md)

---

**Last Updated:** 2026-01-11
