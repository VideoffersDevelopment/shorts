"use client"

import { useCallback } from 'react'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('feed')

  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value)
  const CurrentIcon = currentOption?.icon ?? Sparkles

  const handleValueChange = useCallback((v: string) => {
    onChange(v as FeedSortOption)
  }, [onChange])

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
        <DropdownMenuRadioGroup value={value} onValueChange={handleValueChange}>
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
