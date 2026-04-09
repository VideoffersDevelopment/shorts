"use client"

import { useState } from "react"
import { MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DataTableRowActionsProps } from "./types"

export function DataTableRowActions<TData>({
  row,
  actions,
}: DataTableRowActionsProps<TData>) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const visibleActions = actions.filter((action) => {
    if (typeof action.hidden === "function") {
      return !action.hidden(row.original)
    }
    return !action.hidden
  })

  if (visibleActions.length === 0) {
    return null
  }

  const handleAction = async (action: (typeof actions)[0]) => {
    const isDisabled =
      typeof action.disabled === "function"
        ? action.disabled(row.original)
        : action.disabled

    if (isDisabled || loadingAction) return

    setLoadingAction(action.id)
    try {
      await action.onClick(row.original)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {visibleActions.map((action) => {
          const isDisabled =
            typeof action.disabled === "function"
              ? action.disabled(row.original)
              : action.disabled
          const isLoading = loadingAction === action.id

          return (
            <DropdownMenuItem
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isDisabled || isLoading}
              className={cn(
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive"
              )}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                action.icon && (
                  <span className="mr-2 h-4 w-4">{action.icon}</span>
                )
              )}
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
