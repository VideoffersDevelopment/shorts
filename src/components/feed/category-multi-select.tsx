"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('feed')
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

  const toggleCategory = useCallback((id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else if (selected.length < max) {
      onChange([...selected, id])
    }
  }, [selected, onChange, max])

  const removeCategory = useCallback((id: string) => {
    onChange(selected.filter((s) => s !== id))
  }, [selected, onChange])

  const getCategoryName = useCallback((id: string): string => {
    for (const cat of categories) {
      if (cat.id === id) return cat.name
      if (cat.children) {
        const child = cat.children.find((c) => c.id === id)
        if (child) return child.name
      }
    }
    return id
  }, [categories])

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {selected.length > 0
              ? t('filters.categories.selected', { count: selected.length })
              : t('filters.categories.placeholder')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t('filters.categories.search')} />
            <CommandList>
              <CommandEmpty>{t('filters.categories.noResults')}</CommandEmpty>
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
