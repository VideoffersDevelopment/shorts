"use client"

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CategoryItem {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface CategoryFilterProps {
  categories: CategoryItem[]
  activeFilter?: "discover" | "nearby" | "following"
  selectedCategory?: string
  onFilterChange?: (filter: "discover" | "nearby" | "following") => void
  onCategorySelect?: (categoryId: string | undefined) => void
  labels: {
    discover: string
    nearby: string
    following: string
    more: string
  }
}

export function CategoryFilter({
  categories,
  activeFilter = "discover",
  selectedCategory,
  onFilterChange,
  onCategorySelect,
  labels,
}: CategoryFilterProps) {
  const locale = useLocale()

  return (
    <section className="flex flex-col gap-3 sticky top-[72px] z-40 bg-background py-2 -mx-4 px-4 md:mx-0 md:px-0">
      {/* Segmented Control - always full width on mobile, auto on desktop */}
      <div className="flex p-1 bg-muted rounded-lg w-full md:w-auto shrink-0">
        {(["discover", "nearby", "following"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange?.(filter)}
            className={cn(
              "cursor-pointer flex-1 md:flex-none md:w-28 lg:w-32 py-2 px-2 md:px-3 rounded-md text-xs md:text-sm font-medium text-center transition-all",
              activeFilter === filter
                ? "bg-background shadow-sm text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {labels[filter]}
          </button>
        ))}
      </div>

      {/* Category Chips (Scrollable) — links to category pages */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            asChild
            className={cn(
              "shrink-0 h-8 md:h-9 px-3 md:px-4 rounded-full whitespace-nowrap text-xs md:text-sm",
              selectedCategory === category.id &&
                "border-primary bg-primary/10 text-primary"
            )}
          >
            <Link href={`/${locale}/category/${category.slug}`}>
              {category.name}
            </Link>
          </Button>
        ))}
      </div>
    </section>
  )
}
