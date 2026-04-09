"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { ShortStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

type FilterStatus = ShortStatus | "all"

interface ShortsFiltersProps {
  status: FilterStatus
  search: string
  onStatusChange: (status: FilterStatus) => void
  onSearchChange: (search: string) => void
}

const statusFilters: { value: FilterStatus; labelKey: string }[] = [
  { value: "all", labelKey: "filters.all" },
  { value: "DRAFT", labelKey: "filters.drafts" },
  { value: "PUBLISHED", labelKey: "filters.published" },
  { value: "ARCHIVED", labelKey: "filters.archived" },
]

export function ShortsFilters({
  status,
  search,
  onStatusChange,
  onSearchChange
}: ShortsFiltersProps) {
  const { t } = useTranslations("shorts")
  const [searchValue, setSearchValue] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(searchValue)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchValue, onSearchChange])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchValue("")
    onSearchChange("")
    onStatusChange("all")
  }, [onSearchChange, onStatusChange])

  const hasActiveFilters = status !== "all" || search !== ""

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Status Filter Buttons */}
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              status === filter.value
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50"
            )}
          >
            {t(filter.labelKey)}
          </button>
        ))}
      </div>

      {/* Search and Clear */}
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.search")}
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title={t("filters.sortBy")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
