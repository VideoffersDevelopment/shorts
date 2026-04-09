import type { ColumnDef, Column, Table, Row } from "@tanstack/react-table"
import type { ActionResult } from "@/lib/types/action-result"

/**
 * Server-side pagination metadata
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/**
 * URL params for server-side operations
 */
export interface DataTableUrlParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  filters?: Record<string, string>
}

/**
 * Filter dropdown option configuration
 */
export interface FilterOption {
  id: string
  label: string
  options: { label: string; value: string }[]
}

/**
 * Bulk action definition - supports both sync and async actions
 */
export interface BulkAction<TData> {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary"
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationMessage?: string
  /** Optional - if true, prompts for reason before executing */
  requiresReason?: boolean
  reasonPrompt?: string
  action: (selectedRows: TData[], reason?: string) => Promise<ActionResult<void>>
}

/**
 * Props for the main DataTable component
 */
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination: PaginationMeta
  /** Key used for search filtering */
  searchKey?: string
  searchPlaceholder?: string
  /** Filter dropdown configurations */
  filterOptions?: FilterOption[]
  /** Bulk actions available when rows are selected */
  bulkActions?: BulkAction<TData>[]
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void
  /** Show loading skeleton */
  isLoading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Row ID accessor for selection */
  getRowId?: (row: TData) => string
}

/**
 * Props for sortable column header
 */
export interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  enableSorting?: boolean
}

/**
 * Props for toolbar component
 */
export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  bulkActions?: BulkAction<TData>[]
  selectedCount: number
}

/**
 * Props for pagination component
 */
export interface DataTablePaginationProps {
  pagination: PaginationMeta
  pageSizeOptions?: number[]
}

/**
 * Props for row actions dropdown
 */
export interface RowAction<TData> {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  onClick: (row: TData) => void | Promise<void>
  disabled?: boolean | ((row: TData) => boolean)
  hidden?: boolean | ((row: TData) => boolean)
}

export interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: RowAction<TData>[]
}

/**
 * Export column configuration
 */
export interface ExportColumn<TData> {
  key: keyof TData | string
  header: string
  accessor?: (row: TData) => string | number | boolean | null | undefined
}
