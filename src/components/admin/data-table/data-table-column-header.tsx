"use client"

import { useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DataTableColumnHeaderProps } from "./types"

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSortBy = searchParams.get("sortBy")
  const currentSortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null

  const isCurrentlySorted = currentSortBy === column.id
  const sortDirection = isCurrentlySorted ? currentSortOrder : null

  const updateSorting = useCallback(
    (sortOrder: "asc" | "desc" | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (sortOrder === null) {
        params.delete("sortBy")
        params.delete("sortOrder")
      } else {
        params.set("sortBy", column.id)
        params.set("sortOrder", sortOrder)
      }

      // Reset to first page when sorting changes
      params.set("page", "1")

      router.push(`${pathname}?${params.toString()}`)
    },
    [column.id, pathname, router, searchParams]
  )

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {sortDirection === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sortDirection === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => updateSorting("asc")}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Rosnąco
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateSorting("desc")}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Malejąco
          </DropdownMenuItem>
          {isCurrentlySorted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateSorting(null)}>
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Wyczyść
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
