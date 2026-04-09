"use client"

import { useMemo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck, X, Trash2, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/client"
import { DataTable, type BulkAction, type FilterOption, type PaginationMeta } from "./data-table"
import { getCompaniesColumns, type CompanyRow } from "./columns/companies-columns"
import { verifyCompanyAction } from "@/app/actions/admin/companies/verify"
import { rejectCompanyAction } from "@/app/actions/admin/companies/reject"
import { deleteCompanyAction } from "@/app/actions/admin/companies/delete"
import { checkViesAction } from "@/app/actions/admin/companies/check-vies"
import {
  bulkVerifyCompaniesAction,
  bulkRejectCompaniesAction,
  bulkDeleteCompaniesAction,
} from "@/app/actions/admin/bulk/companies"
import { exportToCSV, exportToExcel } from "@/lib/data-table/export-utils"

interface CompaniesDataTableProps {
  companies: CompanyRow[]
  pagination: PaginationMeta
  locale: string
}

export function CompaniesDataTable({
  companies,
  pagination,
  locale,
}: CompaniesDataTableProps) {
  const { t } = useTranslations("admin")
  const router = useRouter()

  // State for reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectCompanyId, setRejectCompanyId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessingReject, setIsProcessingReject] = useState(false)

  const handleVerify = useCallback(
    async (id: string) => {
      const result = await verifyCompanyAction(id)
      if (!result.success) {
        toast.error(t(`errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(t("companies.verify.success"))
        router.refresh()
      }
    },
    [t, router]
  )

  const handleReject = useCallback(async (id: string) => {
    setRejectCompanyId(id)
    setRejectReason("")
    setRejectDialogOpen(true)
  }, [])

  const handleConfirmReject = useCallback(async () => {
    if (!rejectCompanyId || !rejectReason.trim()) return

    setIsProcessingReject(true)
    try {
      const result = await rejectCompanyAction(rejectCompanyId, rejectReason)
      if (!result.success) {
        toast.error(t(`errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(t("companies.reject.success"))
        router.refresh()
      }
    } finally {
      setIsProcessingReject(false)
      setRejectDialogOpen(false)
      setRejectCompanyId(null)
      setRejectReason("")
    }
  }, [rejectCompanyId, rejectReason, t, router])

  const handleWallet = useCallback(
    (userId: string) => {
      router.push(`/${locale}/admin/users/${userId}/wallet`)
    },
    [router, locale]
  )

  const handleView = useCallback(
    (slug: string) => {
      // Navigate to public company profile
      window.open(`/${locale}/companies/${slug}`, '_blank')
    },
    [locale]
  )

  const handleEdit = useCallback(
    (id: string) => {
      // Navigate to admin edit page
      router.push(`/${locale}/admin/companies/${id}/edit`)
    },
    [router, locale]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t("companies.delete.confirmMessage"))) return

      const result = await deleteCompanyAction(id)
      if (!result.success) {
        toast.error(t(`errors.${result.error.split(".").pop()}`))
      } else {
        toast.success(t("companies.delete.success"))
        router.refresh()
      }
    },
    [t, router]
  )

  const handleCheckVies = useCallback(
    async (id: string) => {
      const result = await checkViesAction(id)
      if (!result.success) {
        toast.error(t(`errors.${result.error.split(".").pop()}`))
      } else {
        if (result.data.valid) {
          toast.success(t("companies.checkVies.success"))
        } else {
          toast.warning(t("companies.checkVies.invalid"))
        }
        router.refresh()
      }
    },
    [t, router]
  )

  const columns = useMemo(
    () =>
      getCompaniesColumns({
        t,
        locale,
        onVerify: handleVerify,
        onReject: handleReject,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onCheckVies: handleCheckVies,
        onWallet: handleWallet,
      }),
    [t, locale, handleVerify, handleReject, handleView, handleEdit, handleDelete, handleCheckVies, handleWallet]
  )

  const filterOptions: FilterOption[] = useMemo(
    () => [
      {
        id: "status",
        label: t("companies.filter.status"),
        options: [
          { label: t("companies.filter.verified"), value: "verified" },
          { label: t("companies.filter.pending"), value: "pending" },
        ],
      },
    ],
    [t]
  )

  const bulkActions: BulkAction<CompanyRow>[] = useMemo(
    () => [
      {
        id: "verify",
        label: t("dataTable.bulkActions.verify"),
        icon: <CheckCheck className="h-4 w-4" />,
        requiresConfirmation: true,
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("dataTable.bulkActions.confirmMessage", {
          count: "{count}",
        }),
        action: async (selectedRows) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkVerifyCompaniesAction(ids)
          if (result.success) {
            return { success: true, data: undefined }
          }
          return result
        },
      },
      {
        id: "reject",
        label: t("dataTable.bulkActions.reject"),
        icon: <X className="h-4 w-4" />,
        variant: "destructive",
        requiresConfirmation: true,
        requiresReason: true,
        reasonPrompt: t("companies.reject.reasonPrompt"),
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("dataTable.bulkActions.confirmMessage", {
          count: "{count}",
        }),
        action: async (selectedRows, reason) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkRejectCompaniesAction(ids, reason || "")
          if (result.success) {
            return { success: true, data: undefined }
          }
          return result
        },
      },
      {
        id: "delete",
        label: t("dataTable.bulkActions.delete"),
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive",
        requiresConfirmation: true,
        confirmationTitle: t("dataTable.bulkActions.confirmTitle"),
        confirmationMessage: t("dataTable.bulkActions.confirmMessage", {
          count: "{count}",
        }),
        action: async (selectedRows) => {
          const ids = selectedRows.map((row) => row.id)
          const result = await bulkDeleteCompaniesAction(ids)
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
              { key: "companyName", header: t("companies.table.name") },
              { key: "nip", header: t("companies.table.nip") },
              { key: "user.email", header: t("companies.table.email") },
              {
                key: "viesVerified",
                header: t("companies.table.status"),
                accessor: (row) =>
                  row.viesVerified
                    ? t("companies.status.verified")
                    : t("companies.status.pending"),
              },
              {
                key: "status",
                header: t("companies.table.accountStatus"),
                accessor: (row) => t(`companies.companyStatus.${row.status}`),
              },
              { key: "createdAt", header: t("companies.table.createdAt") },
            ],
            `companies-${new Date().toISOString().split("T")[0]}`
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
              { key: "companyName", header: t("companies.table.name") },
              { key: "nip", header: t("companies.table.nip") },
              { key: "user.email", header: t("companies.table.email") },
              {
                key: "viesVerified",
                header: t("companies.table.status"),
                accessor: (row) =>
                  row.viesVerified
                    ? t("companies.status.verified")
                    : t("companies.status.pending"),
              },
              {
                key: "status",
                header: t("companies.table.accountStatus"),
                accessor: (row) => t(`companies.companyStatus.${row.status}`),
              },
              { key: "createdAt", header: t("companies.table.createdAt") },
            ],
            `companies-${new Date().toISOString().split("T")[0]}`
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
        data={companies}
        pagination={pagination}
        searchKey="search"
        searchPlaceholder={t("companies.search.placeholder")}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        getRowId={(row) => row.id}
      />

      {/* Reject confirmation dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dataTable.bulkActions.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("companies.reject.reasonPrompt")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t("dataTable.bulkActions.reasonPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isProcessingReject}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isProcessingReject || !rejectReason.trim()}
            >
              {isProcessingReject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
