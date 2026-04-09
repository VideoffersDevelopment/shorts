"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  emoji: string
}

interface CategoryFilterProps {
  categories: Category[]
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

      {/* Category Chips (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            onClick={() =>
              onCategorySelect?.(
                selectedCategory === category.id ? undefined : category.id
              )
            }
            className={cn(
              "shrink-0 h-8 md:h-9 px-3 md:px-4 rounded-full whitespace-nowrap text-xs md:text-sm",
              selectedCategory === category.id &&
                "border-primary bg-primary/10 text-primary"
            )}
          >
            {category.emoji} {category.name}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-8 md:h-9 px-3 md:px-4 rounded-full whitespace-nowrap text-xs md:text-sm"
        >
          {labels.more}
        </Button>
      </div>
    </section>
  )
}

// Sample categories for demo
export const sampleCategories: Category[] = [
  { id: "food-drink", name: "Food & Drink", emoji: "🍽️" },
  { id: "retail", name: "Retail", emoji: "🛍️" },
  { id: "services", name: "Services", emoji: "🔧" },
  { id: "health-fitness", name: "Health & Fitness", emoji: "💪" },
  { id: "real-estate", name: "Real Estate", emoji: "🏠" },
]
