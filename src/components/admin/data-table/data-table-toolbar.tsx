"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { X, Search, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "@/lib/i18n/client"
import { toast } from "sonner"
import type { DataTableToolbarProps, BulkAction } from "./types"

interface ConfirmDialogState {
  open: boolean
  title: string
  message: string
  action: BulkAction<unknown> | null
  requiresReason: boolean
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder,
  filterOptions,
  bulkActions,
  selectedCount,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslations("admin")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    action: null,
    requiresReason: false,
  })

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) {
        params.set("search", searchValue)
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchValue, pathname, router, searchParams])

  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(filterId, value)
      } else {
        params.delete(filterId)
      }
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const handleClearFilters = useCallback(() => {
    setSearchValue("")
    router.push(pathname)
  }, [pathname, router])

  const handleBulkAction = useCallback(
    async (action: BulkAction<TData>) => {
      if (action.requiresConfirmation) {
        setConfirmDialog({
          open: true,
          title: action.confirmationTitle || t("dataTable.bulkActions.confirmTitle"),
          message:
            action.confirmationMessage ||
            t("dataTable.bulkActions.confirmMessage"),
          action: action as BulkAction<unknown>,
          requiresReason: action.requiresReason || false,
        })
        return
      }

      await executeBulkAction(action)
    },
    [selectedCount, t]
  )

  const executeBulkAction = async (action: BulkAction<TData>, actionReason?: string) => {
    const selectedRows = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original)

    setIsProcessing(true)
    try {
      const result = await action.action(selectedRows, actionReason)
      if (result.success) {
        toast.success(
          t("dataTable.bulkActions.success", { count: selectedRows.length })
        )
        table.toggleAllRowsSelected(false)
      } else {
        toast.error(t(`errors.${result.error.split(".").pop()}`))
      }
    } catch {
      toast.error(t("dataTable.bulkActions.error"))
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ ...confirmDialog, open: false })
      setReason("")
    }
  }

  const handleConfirmAction = async () => {
    if (confirmDialog.action) {
      await executeBulkAction(
        confirmDialog.action as BulkAction<TData>,
        confirmDialog.requiresReason ? reason : undefined
      )
    }
  }

  const hasActiveFilters =
    searchValue ||
    filterOptions?.some((filter) => searchParams.has(filter.id))

  return (
    <>
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {searchKey && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || t("dataTable.search")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8"
              />
            </div>
          )}

          {filterOptions?.map((filter) => (
            <Select
              key={filter.id}
              value={searchParams.get(filter.id) || "all"}
              onValueChange={(value) => handleFilterChange(filter.id, value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dataTable.filterAll")}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="h-8 px-2 lg:px-3"
            >
              {t("dataTable.clearFilters")}
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("dataTable.selected", { count: selectedCount })}
            </span>

            {bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                size="icon"
                onClick={() => handleBulkAction(action)}
                disabled={isProcessing}
                title={action.label}
                className="h-8 w-8"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  action.icon
                )}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              {t("dataTable.clearSelection")}
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
          </DialogHeader>

          {confirmDialog.requiresReason && (
            <div className="py-4">
              <Textarea
                placeholder={
                  (confirmDialog.action as BulkAction<TData>)?.reasonPrompt ||
                  t("dataTable.bulkActions.reasonPlaceholder")
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog({ ...confirmDialog, open: false })
                setReason("")
              }}
            >
              {t("dataTable.bulkActions.cancel")}
            </Button>
            <Button
              variant={
                (confirmDialog.action as BulkAction<TData>)?.variant === "destructive"
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirmAction}
              disabled={isProcessing || (confirmDialog.requiresReason && !reason.trim())}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("dataTable.bulkActions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
