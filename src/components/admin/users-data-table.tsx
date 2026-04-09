"use client"

import { useMemo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle, UserCog, Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { Role } from "@prisma/client"
import { useTranslations } from "@/lib/i18n/client"
import { DataTable, type BulkAction, type FilterOption, type PaginationMeta } from "./data-table"
import { getUsersColumns, type UserRow } from "./columns/users-columns"
import { toggleBlockAction } from "@/app/actions/admin/users/toggle-block"
import { changeRoleAction } from "@/app/actions/admin/users/change-role"
import {
  bulkBlockUsersAction,
  bulkUnblockUsersAction,
  bulkChangeRoleAction,
  bulkDeleteUsersAction,
} from "@/app/actions/admin/bulk/users"
import { exportToCSV, exportToExcel } from "@/lib/data-table/export-utils"
import { UserDetailsDialog } from "./user-details-dialog"
import { ChangeRoleDialog } from "./change-role-dialog"

interface UsersDataTableProps {
  users: UserRow[]
  pagination: PaginationMeta
  locale: string
  currentUserId: string
}

export function UsersDataTable({
  users,
  pagination,
  locale,
  currentUserId,
}: UsersDataTableProps) {
  const { t } = useTranslations("admin")
  const router = useRouter()

  // Dialog states
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)
  const [changeRoleUserId, setChangeRoleUserId] = useState<string | null>(null)
  const [changeRoleCurrentRole, setChangeRoleCurrentRole] = useState<string | null>(null)

  // Bulk change role dialog state
  const [bulkChangeRoleOpen, setBulkChangeRoleOpen] = useState(false)
  const [bulkChangeRoleIds, setBulkChangeRoleIds] = useState<string[]>([])

  const handleWallet = useCallback(
    (id: string) => {
      router.push(`/${locale}/admin/users/${id}/wallet`)
    },
    [router, locale]
  )

  const handleDetails = useCallback((id: string) => {
    setDetailsUserId(id)
  }, [])

  const handleChangeRole = useCallback((id: string, currentRole: string) => {
    setChangeRoleUserId(id)
    setChangeRoleCurrentRole(currentRole)
  }, [])

  const handleToggleBlock = useCallback(
    async (id: string, isBlocked: boolean) => {
      const result = await toggleBlockAction(id, !isBlocked)
      if (!result.success) {
        toast.error(t(`admin.errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(
          isBlocked ? t("users.unblock.success") : t("users.block.success")
        )
      }
    },
    [t]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      // Single user delete - using bulk action with single ID
      const result = await bulkDeleteUsersAction([id])
      if (!result.success) {
        toast.error(t(`admin.errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(t("users.delete.success"))
      }
    },
    [t]
  )

  const handleSingleRoleChange = useCallback(
    async (newRole: Role) => {
      if (!changeRoleUserId) return

      const result = await changeRoleAction(changeRoleUserId, newRole)
      if (!result.success) {
        toast.error(t(`admin.errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(t("users.changeRole.success"))
      }
      setChangeRoleUserId(null)
      setChangeRoleCurrentRole(null)
    },
    [changeRoleUserId, t]
  )

  const handleBulkRoleChange = useCallback(
    async (newRole: Role) => {
      const result = await bulkChangeRoleAction(bulkChangeRoleIds, newRole)
      if (!result.success) {
        toast.error(t(`admin.errors.${result.error.split(".").pop()}`))
      } else if (result.data) {
        const { processedCount, failedIds } = result.data
        if (failedIds.length > 0) {
          toast.warning(
            t("users.bulkActions.partialSuccess", {
              success: processedCount,
              failed: failedIds.length,
            })
          )
        } else {
          toast.success(
            t("users.bulkActions.changeRoleSuccess", { count: processedCount })
          )
        }
      }
      setBulkChangeRoleOpen(false)
      setBulkChangeRoleIds([])
    },
    [bulkChangeRoleIds, t]
  )

  const columns = useMemo(
    () =>
      getUsersColumns({
        t,
        locale,
        currentUserId,
        onDetails: handleDetails,
        onChangeRole: handleChangeRole,
        onToggleBlock: handleToggleBlock,
        onDelete: handleDelete,
        onWallet: handleWallet,
      }),
    [t, locale, currentUserId, handleDetails, handleChangeRole, handleToggleBlock, handleDelete, handleWallet]
  )

  const filterOptions: FilterOption[] = useMemo(
    () => [
      {
        id: "role",
        label: t("users.filter.role"),
        options: [
          { label: t("users.role.USER"), value: "USER" },
          { label: t("users.role.COMPANY"), value: "COMPANY" },
          { label: t("users.role.ADMIN"), value: "ADMIN" },
        ],
      },
      {
        id: "status",
        label: t("users.filter.status"),
        options: [
          { label: t("users.status.active"), value: "active" },
          { label: t("users.status.blocked"), value: "blocked" },
        ],
      },
    ],
    [t]
  )

  const bulkActions: BulkAction<UserRow>[] = useMemo(
    () => [
      {
        id: "block",
        label: t("users.bulkActions.block"),
        icon: <Ban className="h-4 w-4" />,
        variant: "destructive",
        requiresConfirmation: true,
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("users.bulkActions.confirmBlock", {
          count: "{count}",
        }),
        action: async (selectedRows) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkBlockUsersAction(ids)
          if (result.success) {
            return { success: true, data: undefined }
          }
          return result
        },
      },
      {
        id: "unblock",
        label: t("users.bulkActions.unblock"),
        icon: <CheckCircle className="h-4 w-4" />,
        requiresConfirmation: true,
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("users.bulkActions.confirmUnblock", {
          count: "{count}",
        }),
        action: async (selectedRows) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkUnblockUsersAction(ids)
          if (result.success) {
            return { success: true, data: undefined }
          }
          return result
        },
      },
      {
        id: "changeRole",
        label: t("users.bulkActions.changeRole"),
        icon: <UserCog className="h-4 w-4" />,
        // Custom action that opens role selection dialog
        action: async (selectedRows) => {
          setBulkChangeRoleIds(selectedRows.map((row) => row.id))
          setBulkChangeRoleOpen(true)
          // Return success immediately - actual action happens in dialog
          return { success: true, data: undefined }
        },
      },
      {
        id: "delete",
        label: t("users.bulkActions.delete"),
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive",
        requiresConfirmation: true,
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("users.bulkActions.confirmDelete", {
          count: "{count}",
        }),
        action: async (selectedRows) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkDeleteUsersAction(ids)
          if (result.success) {
            return { success: true, data: undefined }
          }
          return result
        },
      },
      {
        id: "exportCSV",
        label: t("dataTable.bulkActions.exportCSV"),
        icon: <Download className="h-4 w-4" />,
        variant: "outline",
        action: async (selectedRows) => {
          exportToCSV(
            selectedRows,
            [
              { key: "email", header: t("users.table.email") },
              {
                key: "role",
                header: t("users.table.role"),
                accessor: (row) => t(`users.role.${row.role}`),
              },
              {
                key: "isBlocked",
                header: t("users.table.status"),
                accessor: (row) =>
                  row.isBlocked
                    ? t("users.status.blocked")
                    : t("users.status.active"),
              },
              {
                key: "emailVerified",
                header: t("users.table.emailVerified"),
                accessor: (row) =>
                  row.emailVerified
                    ? new Date(row.emailVerified).toLocaleDateString()
                    : t("users.details.notVerified"),
              },
              { key: "createdAt", header: t("users.table.createdAt") },
            ],
            `users-${new Date().toISOString().split("T")[0]}`
          )
          return { success: true, data: undefined }
        },
      },
      {
        id: "exportExcel",
        label: t("dataTable.bulkActions.exportExcel"),
        icon: <Download className="h-4 w-4" />,
        variant: "outline",
        action: async (selectedRows) => {
          exportToExcel(
            selectedRows,
            [
              { key: "email", header: t("users.table.email") },
              {
                key: "role",
                header: t("users.table.role"),
                accessor: (row) => t(`users.role.${row.role}`),
              },
              {
                key: "isBlocked",
                header: t("users.table.status"),
                accessor: (row) =>
                  row.isBlocked
                    ? t("users.status.blocked")
                    : t("users.status.active"),
              },
              {
                key: "emailVerified",
                header: t("users.table.emailVerified"),
                accessor: (row) =>
                  row.emailVerified
                    ? new Date(row.emailVerified).toLocaleDateString()
                    : t("users.details.notVerified"),
              },
              { key: "createdAt", header: t("users.table.createdAt") },
            ],
            `users-${new Date().toISOString().split("T")[0]}`
          )
          return { success: true, data: undefined }
        },
      },
    ],
    [t]
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        searchKey="search"
        searchPlaceholder={t("users.search.placeholder")}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        getRowId={(row) => row.id}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        userId={detailsUserId}
        onClose={() => setDetailsUserId(null)}
      />

      {/* Single User Change Role Dialog */}
      <ChangeRoleDialog
        open={!!changeRoleUserId}
        onOpenChange={(open) => {
          if (!open) {
            setChangeRoleUserId(null)
            setChangeRoleCurrentRole(null)
          }
        }}
        currentRole={changeRoleCurrentRole as Role | null}
        onConfirm={handleSingleRoleChange}
        title={t("users.changeRole.title")}
        description={t("users.changeRole.description")}
      />

      {/* Bulk Change Role Dialog */}
      <ChangeRoleDialog
        open={bulkChangeRoleOpen}
        onOpenChange={setBulkChangeRoleOpen}
        currentRole={null}
        onConfirm={handleBulkRoleChange}
        title={t("users.bulkActions.changeRoleTitle")}
        description={t("users.bulkActions.changeRoleDescription", {
          count: bulkChangeRoleIds.length,
        })}
      />
    </>
  )
}
