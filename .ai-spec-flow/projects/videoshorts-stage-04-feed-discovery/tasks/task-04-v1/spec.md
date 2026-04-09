# Task 04: Filter Components

## Overview

**Priority:** HIGH
**Dependencies:** task-03
**Complexity:** Medium (12 files, ~12k tokens)
**Status:** pending

## What to Build

Create filter UI components for the feed:
1. FilterPanel (Sheet on mobile, Popover on desktop)
2. LocationPicker with geolocation detection
3. CategoryMultiSelect (hierarchical, max 5)
4. TagFilter autocomplete
5. SortDropdown with 5 options
6. Supporting components (RadiusSelector, VerifiedToggle, ActiveFiltersBar)
7. Header integration

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/feed/filter-panel.tsx` | Create | Main filter container |
| `src/components/feed/location-picker.tsx` | Create | Location + radius picker |
| `src/components/feed/category-multi-select.tsx` | Create | Hierarchical category picker |
| `src/components/feed/tag-filter.tsx` | Create | Tag autocomplete filter |
| `src/components/feed/sort-dropdown.tsx` | Create | Sort options dropdown |
| `src/components/feed/radius-selector.tsx` | Create | Radius dropdown |
| `src/components/feed/verified-toggle.tsx` | Create | Verified only switch |
| `src/components/feed/active-filters-bar.tsx` | Create | Active filter pills |
| `src/hooks/use-geolocation.ts` | Create | Browser geolocation hook |
| `src/hooks/use-feed-filters.ts` | Create | Filter state management |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/header.tsx` | Add SortDropdown, FilterButton, SearchBar placeholder |

## Implementation Details

### 1. useGeolocation Hook

```typescript
// src/hooks/use-geolocation.ts
"use client"

import { useState, useCallback } from 'react'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  loading: boolean
  error: string | null
  permissionDenied: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  detect: () => Promise<{ lat: number; lng: number } | null>
  clear: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
  })

  const detect = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: 'Geolocation is not supported by your browser',
      }))
      return null
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setState({
            location,
            loading: false,
            error: null,
            permissionDenied: false,
          })
          resolve(location)
        },
        (error) => {
          const permissionDenied = error.code === error.PERMISSION_DENIED
          setState((s) => ({
            ...s,
            loading: false,
            error: error.message,
            permissionDenied,
          }))
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      )
    })
  }, [])

  const clear = useCallback(() => {
    setState({
      location: null,
      loading: false,
      error: null,
      permissionDenied: false,
    })
  }, [])

  return { ...state, detect, clear }
}
```

### 2. useFeedFilters Hook

```typescript
// src/hooks/use-feed-filters.ts
"use client"

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { FeedFilters, FeedSortOption } from '@/lib/types/feed'

interface UseFeedFiltersReturn {
  filters: FeedFilters
  setFilters: (newFilters: Partial<FeedFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
}

export function useFeedFilters(): UseFeedFiltersReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo<FeedFilters>(() => ({
    sort: (searchParams.get('sort') as FeedSortOption) ?? 'algorithmic',
    categoryIds: searchParams.get('categoryIds')?.split(',').filter(Boolean),
    tags: searchParams.get('tags')?.split(',').filter(Boolean),
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
  }), [searchParams])

  const setFilters = useCallback((newFilters: Partial<FeedFilters>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false ||
          (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else if (typeof value === 'boolean') {
        if (value) params.set(key, 'true')
        else params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.categoryIds?.length ||
      filters.tags?.length ||
      filters.lat !== undefined ||
      filters.verifiedOnly
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categoryIds?.length) count += filters.categoryIds.length
    if (filters.tags?.length) count += filters.tags.length
    if (filters.lat !== undefined) count += 1
    if (filters.verifiedOnly) count += 1
    return count
  }, [filters])

  return { filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount }
}
```

### 3. RadiusSelector Component

```typescript
// src/components/feed/radius-selector.tsx
"use client"

import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RadiusSelectorProps {
  value: number | undefined
  onChange: (radius: number | undefined) => void
  disabled?: boolean
}

const RADIUS_OPTIONS = [1, 5, 10, 25, 50] as const

export function RadiusSelector({ value, onChange, disabled }: RadiusSelectorProps) {
  const t = useTranslations('feed')

  return (
    <Select
      value={value?.toString() ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : parseInt(v))}
      disabled={disabled}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder={t('filters.location.radius')} />
      </SelectTrigger>
      <SelectContent>
        {RADIUS_OPTIONS.map((radius) => (
          <SelectItem key={radius} value={radius.toString()}>
            {t(`filters.location.radiusOptions.${radius}km`)}
          </SelectItem>
        ))}
        <SelectItem value="all">
          {t('filters.location.radiusOptions.all')}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### 4. VerifiedToggle Component

```typescript
// src/components/feed/verified-toggle.tsx
"use client"

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BadgeCheck } from 'lucide-react'

interface VerifiedToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function VerifiedToggle({ checked, onChange }: VerifiedToggleProps) {
  const t = useTranslations('feed')

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-blue-500" />
        <div className="space-y-0.5">
          <Label htmlFor="verified-toggle" className="text-sm font-medium">
            {t('filters.verifiedOnly.label')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('filters.verifiedOnly.description')}
          </p>
        </div>
      </div>
      <Switch
        id="verified-toggle"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}
```

### 5. LocationPicker Component

```typescript
// src/components/feed/location-picker.tsx
"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Navigation, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadiusSelector } from './radius-selector'
import { useGeolocation } from '@/hooks/use-geolocation'

interface LocationPickerProps {
  lat?: number
  lng?: number
  radius?: number
  onChange: (lat: number | undefined, lng: number | undefined, radius: number | undefined) => void
}

export function LocationPicker({ lat, lng, radius, onChange }: LocationPickerProps) {
  const t = useTranslations('feed')
  const { location, loading, error, permissionDenied, detect, clear } = useGeolocation()

  const handleDetect = async () => {
    const result = await detect()
    if (result) {
      onChange(result.lat, result.lng, radius ?? 25)
    }
  }

  const handleClear = () => {
    clear()
    onChange(undefined, undefined, undefined)
  }

  const hasLocation = lat !== undefined && lng !== undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={hasLocation ? 'secondary' : 'outline'}
          size="sm"
          onClick={hasLocation ? handleClear : handleDetect}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('filters.location.detecting')}
            </>
          ) : hasLocation ? (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              {t('filters.location.nearMe', { distance: `${radius ?? 25} km` })}
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              {t('filters.location.detectLocation')}
            </>
          )}
        </Button>

        <RadiusSelector
          value={radius}
          onChange={(r) => onChange(lat, lng, r)}
          disabled={!hasLocation}
        />
      </div>

      {error && !permissionDenied && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {permissionDenied && (
        <p className="text-xs text-muted-foreground">
          Location access was denied. Please enable it in your browser settings.
        </p>
      )}
    </div>
  )
}
```

### 6. CategoryMultiSelect Component

```typescript
// src/components/feed/category-multi-select.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
}

interface CategoryMultiSelectProps {
  selected: string[]
  onChange: (ids: string[]) => void
  max?: number
}

export function CategoryMultiSelect({
  selected,
  onChange,
  max = 5,
}: CategoryMultiSelectProps) {
  const t = useTranslations('feed')
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else if (selected.length < max) {
      onChange([...selected, id])
    }
  }

  const removeCategory = (id: string) => {
    onChange(selected.filter((s) => s !== id))
  }

  const getCategoryName = (id: string): string => {
    for (const cat of categories) {
      if (cat.id === id) return cat.name
      if (cat.children) {
        const child = cat.children.find((c) => c.id === id)
        if (child) return child.name
      }
    }
    return id
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length > 0
              ? t('filters.categories.placeholder')
              : t('filters.categories.placeholder')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t('filters.categories.placeholder')} />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              {categories.map((category) => (
                <CommandGroup key={category.id} heading={category.name}>
                  <CommandItem
                    value={category.id}
                    onSelect={() => toggleCategory(category.id)}
                    disabled={!selected.includes(category.id) && selected.length >= max}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected.includes(category.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {category.name}
                  </CommandItem>
                  {category.children?.map((child) => (
                    <CommandItem
                      key={child.id}
                      value={child.id}
                      onSelect={() => toggleCategory(child.id)}
                      disabled={!selected.includes(child.id) && selected.length >= max}
                      className="pl-8"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.includes(child.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {child.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {getCategoryName(id)}
              <button
                type="button"
                onClick={() => removeCategory(id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length >= max && (
        <p className="text-xs text-muted-foreground">
          {t('filters.categories.maxSelected', { max })}
        </p>
      )}
    </div>
  )
}
```

### 7. TagFilter Component

```typescript
// src/components/feed/tag-filter.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'

interface TagResult {
  id: string
  name: string
  slug: string
  usageCount: number
}

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
  max?: number
}

export function TagFilter({ selected, onChange, max = 5 }: TagFilterProps) {
  const t = useTranslations('feed')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TagResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    async function searchTags() {
      if (!debouncedQuery) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `/api/tags/search?q=${encodeURIComponent(debouncedQuery)}`
        )
        if (response.ok) {
          const data = await response.json()
          // Filter out already selected tags
          setSuggestions(
            (data.tags ?? []).filter(
              (tag: TagResult) => !selected.includes(tag.slug)
            )
          )
        }
      } catch (error) {
        console.error('Failed to search tags:', error)
      } finally {
        setLoading(false)
      }
    }
    searchTags()
  }, [debouncedQuery, selected])

  const addTag = (slug: string) => {
    if (selected.length < max && !selected.includes(slug)) {
      onChange([...selected, slug])
    }
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const removeTag = (slug: string) => {
    onChange(selected.filter((s) => s !== slug))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t('filters.tags.placeholder')}
          className="pl-10"
          disabled={selected.length >= max}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag.slug)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex justify-between items-center"
              >
                <span>{tag.name}</span>
                <span className="text-xs text-muted-foreground">
                  {tag.usageCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((slug) => (
            <Badge key={slug} variant="secondary" className="gap-1">
              #{slug}
              <button
                type="button"
                onClick={() => removeTag(slug)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 8. SortDropdown Component

```typescript
// src/components/feed/sort-dropdown.tsx
"use client"

import { useTranslations } from 'next-intl'
import {
  Sparkles,
  Clock,
  TrendingUp,
  Flame,
  Users,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FeedSortOption } from '@/lib/types/feed'

interface SortDropdownProps {
  value: FeedSortOption
  onChange: (sort: FeedSortOption) => void
}

const SORT_OPTIONS: Array<{
  value: FeedSortOption
  icon: typeof Sparkles
}> = [
  { value: 'algorithmic', icon: Sparkles },
  { value: 'newest', icon: Clock },
  { value: 'popular', icon: TrendingUp },
  { value: 'trending', icon: Flame },
  { value: 'following', icon: Users },
]

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const t = useTranslations('feed')

  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value)
  const CurrentIcon = currentOption?.icon ?? Sparkles

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t(`sort.${value}`)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as FeedSortOption)}>
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {t(`sort.${option.value}`)}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 9. ActiveFiltersBar Component

```typescript
// src/components/feed/active-filters-bar.tsx
"use client"

import { useTranslations } from 'next-intl'
import { X, MapPin, Tag, Folder, BadgeCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FeedFilters } from '@/lib/types/feed'

interface ActiveFiltersBarProps {
  filters: FeedFilters
  onRemoveFilter: (key: keyof FeedFilters, value?: string) => void
  onClearAll: () => void
  categoryNames?: Record<string, string>
}

export function ActiveFiltersBar({
  filters,
  onRemoveFilter,
  onClearAll,
  categoryNames = {},
}: ActiveFiltersBarProps) {
  const t = useTranslations('feed')

  const hasFilters = !!(
    filters.categoryIds?.length ||
    filters.tags?.length ||
    filters.lat !== undefined ||
    filters.verifiedOnly
  )

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Location filter */}
      {filters.lat !== undefined && (
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          {filters.radius ? `${filters.radius} km` : t('filters.location.wholeCountry')}
          <button
            onClick={() => onRemoveFilter('lat')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Category filters */}
      {filters.categoryIds?.map((id) => (
        <Badge key={id} variant="secondary" className="gap-1">
          <Folder className="h-3 w-3" />
          {categoryNames[id] ?? id}
          <button
            onClick={() => onRemoveFilter('categoryIds', id)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Tag filters */}
      {filters.tags?.map((slug) => (
        <Badge key={slug} variant="secondary" className="gap-1">
          <Tag className="h-3 w-3" />
          #{slug}
          <button
            onClick={() => onRemoveFilter('tags', slug)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Verified filter */}
      {filters.verifiedOnly && (
        <Badge variant="secondary" className="gap-1">
          <BadgeCheck className="h-3 w-3" />
          {t('filters.verifiedOnly.label')}
          <button
            onClick={() => onRemoveFilter('verifiedOnly')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Clear all */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-muted-foreground h-7"
      >
        {t('filters.clear')}
      </Button>
    </div>
  )
}
```

### 10. FilterPanel Component

```typescript
// src/components/feed/filter-panel.tsx
"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LocationPicker } from './location-picker'
import { CategoryMultiSelect } from './category-multi-select'
import { TagFilter } from './tag-filter'
import { VerifiedToggle } from './verified-toggle'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { FeedFilters } from '@/lib/types/feed'

interface FilterPanelProps {
  filters: FeedFilters
  onFiltersChange: (filters: Partial<FeedFilters>) => void
  activeFilterCount?: number
}

export function FilterPanel({
  filters,
  onFiltersChange,
  activeFilterCount = 0,
}: FilterPanelProps) {
  const t = useTranslations('feed')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleClear = () => {
    const cleared: Partial<FeedFilters> = {
      categoryIds: undefined,
      tags: undefined,
      lat: undefined,
      lng: undefined,
      radius: undefined,
      verifiedOnly: false,
    }
    setLocalFilters({ ...filters, ...cleared })
    onFiltersChange(cleared)
    setOpen(false)
  }

  const content = (
    <div className="space-y-6 py-4">
      {/* Location */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.location.label')}</h4>
        <LocationPicker
          lat={localFilters.lat}
          lng={localFilters.lng}
          radius={localFilters.radius}
          onChange={(lat, lng, radius) =>
            setLocalFilters((f) => ({ ...f, lat, lng, radius }))
          }
        />
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.categories.label')}</h4>
        <CategoryMultiSelect
          selected={localFilters.categoryIds ?? []}
          onChange={(ids) =>
            setLocalFilters((f) => ({ ...f, categoryIds: ids }))
          }
          max={5}
        />
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.tags.label')}</h4>
        <TagFilter
          selected={localFilters.tags ?? []}
          onChange={(tags) =>
            setLocalFilters((f) => ({ ...f, tags }))
          }
          max={5}
        />
      </div>

      <Separator />

      {/* Verified only */}
      <VerifiedToggle
        checked={localFilters.verifiedOnly ?? false}
        onChange={(checked) =>
          setLocalFilters((f) => ({ ...f, verifiedOnly: checked }))
        }
      />
    </div>
  )

  const trigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Filter className="h-4 w-4" />
      <span className="hidden sm:inline">{t('filters.title')}</span>
      {activeFilterCount > 0 && (
        <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {activeFilterCount}
        </span>
      )}
    </Button>
  )

  // Mobile: Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filters.title')}</SheetTitle>
          </SheetHeader>
          {content}
          <SheetFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              {t('filters.clear')}
            </Button>
            <Button onClick={handleApply} className="flex-1">
              {t('filters.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {content}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            {t('filters.clear')}
          </Button>
          <Button onClick={handleApply} className="flex-1">
            {t('filters.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### 11. Header Modification

Modify `src/components/layout/header.tsx` to add:
- SortDropdown
- FilterPanel trigger
- Placeholder for SearchBar (implemented in task-06)

```typescript
// Add to header.tsx imports and JSX:
import { SortDropdown } from '@/components/feed/sort-dropdown'
import { FilterPanel } from '@/components/feed/filter-panel'
import { useFeedFilters } from '@/hooks/use-feed-filters'

// In component:
const { filters, setFilters, activeFilterCount } = useFeedFilters()

// In JSX (between logo and user menu):
<div className="flex items-center gap-2">
  {/* SearchBar placeholder - add in task-06 */}
  <SortDropdown
    value={filters.sort}
    onChange={(sort) => setFilters({ sort })}
  />
  <FilterPanel
    filters={filters}
    onFiltersChange={setFilters}
    activeFilterCount={activeFilterCount}
  />
</div>
```

## Acceptance Criteria

- [ ] FilterPanel opens as Sheet on mobile, Popover on desktop
- [ ] LocationPicker detects user location via browser geolocation
- [ ] RadiusSelector shows 1km, 5km, 10km, 25km, 50km, All options
- [ ] CategoryMultiSelect allows max 5 selections
- [ ] CategoryMultiSelect shows hierarchical categories
- [ ] TagFilter autocompletes from API
- [ ] SortDropdown shows 5 sort options with icons
- [ ] VerifiedToggle works correctly
- [ ] ActiveFiltersBar shows pills for active filters
- [ ] Removing filter from ActiveFiltersBar works
- [ ] Clear all filters works
- [ ] Filters are reflected in URL params
- [ ] Header shows SortDropdown and FilterPanel
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user credentials from .env.local

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to home | Header visible | `/` |
| 2 | Click Sort dropdown | Options shown | `button:has-text("For You")` |
| 3 | Select "Newest" | URL updates to ?sort=newest | Check URL |
| 4 | Click Filters button | Panel opens | `button:has-text("Filters")` |
| 5 | Click "Detect location" | Browser prompts | Allow geolocation |
| 6 | Select 10km radius | Radius updates | Select element |
| 7 | Open categories | Hierarchy shown | Command popover |
| 8 | Select category | Badge appears | Badge visible |
| 9 | Click Apply | Panel closes, URL updates | Check URL params |
| 10 | Check ActiveFiltersBar | Pills visible | Filter badges |

### Screenshot Checkpoints
- `01-sort-dropdown.png` - Sort options open
- `02-filter-panel.png` - Filter panel open
- `03-location-detected.png` - After location detection
- `04-categories-selected.png` - With selected categories
- `05-active-filters.png` - ActiveFiltersBar with pills

## Notes

1. **useMediaQuery Hook:** If not already in codebase, create a simple implementation or use existing one.

2. **Categories API:** Assumes `/api/categories` endpoint exists. If not, use existing `getCategories` action via fetch.

3. **Geolocation Permission:** Handle gracefully if user denies permission.

4. **URL State:** All filters sync with URL for shareability and back button support.
