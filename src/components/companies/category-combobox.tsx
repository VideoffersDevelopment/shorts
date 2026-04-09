"use client"

import { useState, useMemo } from 'react'
import { Check, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { useTranslations } from '@/lib/i18n/client'
import type { Category } from '@prisma/client'

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface CategoryComboboxProps {
  categories: CategoryWithChildren[]
  value?: string
  onValueChange: (categoryId: string, parentId: string | null) => void
  disabled?: boolean
}

export function CategoryCombobox({
  categories,
  value,
  onValueChange,
  disabled = false
}: CategoryComboboxProps) {
  const { t } = useTranslations('companies')
  const [open, setOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Find selected category label for display
  const selectedLabel = useMemo(() => {
    if (!value) return null

    for (const cat of categories) {
      if (cat.id === value) {
        return cat.name
      }
      const sub = cat.children?.find(c => c.id === value)
      if (sub) {
        return `${cat.name} → ${sub.name}`
      }
    }
    return null
  }, [value, categories])

  // Toggle accordion expansion
  const handleCategoryClick = (categoryId: string, hasChildren: boolean) => {
    if (hasChildren) {
      // Toggle expansion
      setExpandedCategory(prev => prev === categoryId ? null : categoryId)
    } else {
      // Select category without children
      onValueChange(categoryId, null)
      setOpen(false)
    }
  }

  // Select main category (when clicking the category name, not just expanding)
  const handleMainCategorySelect = (categoryId: string) => {
    onValueChange(categoryId, null)
    setOpen(false)
  }

  // Select subcategory
  const handleSubcategorySelect = (subcategoryId: string, parentId: string) => {
    onValueChange(subcategoryId, parentId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedLabel ?? t('category.placeholder')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={t('category.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('category.noResults')}</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => {
                const hasChildren = category.children && category.children.length > 0
                const isExpanded = expandedCategory === category.id

                return (
                  <div key={category.id}>
                    {/* Main category row */}
                    <CommandItem
                      value={category.name}
                      onSelect={() => handleCategoryClick(category.id, !!hasChildren)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === category.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span
                          className={cn(
                            "cursor-pointer",
                            hasChildren && "hover:underline"
                          )}
                          onClick={(e) => {
                            if (hasChildren) {
                              e.stopPropagation()
                              handleMainCategorySelect(category.id)
                            }
                          }}
                        >
                          {category.name}
                        </span>
                      </div>
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      )}
                    </CommandItem>

                    {/* Subcategories (accordion content) */}
                    {hasChildren && isExpanded && (
                      <div className="ml-6 border-l border-border pl-2">
                        {category.children?.map((sub) => (
                          <CommandItem
                            key={sub.id}
                            value={`${category.name} ${sub.name}`}
                            onSelect={() => handleSubcategorySelect(sub.id, category.id)}
                            className="py-1.5"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                value === sub.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {sub.name}
                          </CommandItem>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
