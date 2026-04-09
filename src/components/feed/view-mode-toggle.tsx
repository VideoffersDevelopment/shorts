"use client"

import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/types/feed'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
      <button
        onClick={() => onChange('grid')}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          viewMode === 'grid'
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          viewMode === 'list'
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}
