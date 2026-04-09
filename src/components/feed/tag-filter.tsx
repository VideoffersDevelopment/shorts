"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('feed')
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

  const addTag = useCallback((slug: string) => {
    if (selected.length < max && !selected.includes(slug)) {
      onChange([...selected, slug])
    }
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }, [selected, onChange, max])

  const removeTag = useCallback((slug: string) => {
    onChange(selected.filter((s) => s !== slug))
  }, [selected, onChange])

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
