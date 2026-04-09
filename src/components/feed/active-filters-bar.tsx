"use client"

import { useCallback } from 'react'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('feed')

  const hasFilters = !!(
    filters.categoryIds?.length ||
    filters.tags?.length ||
    filters.lat !== undefined ||
    filters.verifiedOnly
  )

  const handleRemoveLocation = useCallback(() => {
    onRemoveFilter('lat')
  }, [onRemoveFilter])

  const handleRemoveCategory = useCallback((id: string) => {
    onRemoveFilter('categoryIds', id)
  }, [onRemoveFilter])

  const handleRemoveTag = useCallback((slug: string) => {
    onRemoveFilter('tags', slug)
  }, [onRemoveFilter])

  const handleRemoveVerified = useCallback(() => {
    onRemoveFilter('verifiedOnly')
  }, [onRemoveFilter])

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Location filter */}
      {filters.lat !== undefined && (
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          {filters.radius ? `${filters.radius} km` : t('filters.location.wholeCountry')}
          <button
            onClick={handleRemoveLocation}
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
            onClick={() => handleRemoveCategory(id)}
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
            onClick={() => handleRemoveTag(slug)}
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
            onClick={handleRemoveVerified}
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
