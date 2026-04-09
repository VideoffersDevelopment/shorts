"use client"

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('feed')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  // Sync local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters)
    setOpen(false)
  }, [localFilters, onFiltersChange])

  const handleClear = useCallback(() => {
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
  }, [filters, onFiltersChange])

  const handleLocationChange = useCallback((lat: number | undefined, lng: number | undefined, radius: number | undefined) => {
    setLocalFilters((f) => ({ ...f, lat, lng, radius }))
  }, [])

  const handleCategoriesChange = useCallback((ids: string[]) => {
    setLocalFilters((f) => ({ ...f, categoryIds: ids }))
  }, [])

  const handleTagsChange = useCallback((tags: string[]) => {
    setLocalFilters((f) => ({ ...f, tags }))
  }, [])

  const handleVerifiedChange = useCallback((checked: boolean) => {
    setLocalFilters((f) => ({ ...f, verifiedOnly: checked }))
  }, [])

  const content = (
    <div className="space-y-6 py-4">
      {/* Location */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.location.label')}</h4>
        <LocationPicker
          lat={localFilters.lat}
          lng={localFilters.lng}
          radius={localFilters.radius}
          onChange={handleLocationChange}
        />
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.categories.label')}</h4>
        <CategoryMultiSelect
          selected={localFilters.categoryIds ?? []}
          onChange={handleCategoriesChange}
          max={5}
        />
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('filters.tags.label')}</h4>
        <TagFilter
          selected={localFilters.tags ?? []}
          onChange={handleTagsChange}
          max={5}
        />
      </div>

      <Separator />

      {/* Verified only */}
      <VerifiedToggle
        checked={localFilters.verifiedOnly ?? false}
        onChange={handleVerifiedChange}
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
