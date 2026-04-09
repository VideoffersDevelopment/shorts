"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2, XCircle, Eye, CheckCheck, X, Trash2, AlertCircle, Clock, Search, Pencil, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "../data-table/data-table-column-header"
import { DataTableRowActions } from "../data-table/data-table-row-actions"
import type { RowAction } from "../data-table/types"
import { formatDate } from "@/lib/utils"
import { type CompanyStatus } from "@prisma/client"

export interface CompanyRow {
  id: string
  companyName: string
  slug: string
  nip: string
  viesVerified: boolean
  status: CompanyStatus
  createdAt: Date
  user: {
    email: string
  }
  userId: string
}

interface GetCompaniesColumnsOptions {
  t: (key: string) => string
  locale: string
  onVerify: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onView: (slug: string) => void
  onEdit: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  onCheckVies?: (id: string) => Promise<void>
  onWallet?: (userId: string) => void
}

export function getCompaniesColumns({
  t,
  locale,
  onVerify,
  onReject,
  onView,
  onEdit,
  onDelete,
  onCheckVies,
  onWallet,
}: GetCompaniesColumnsOptions): ColumnDef<CompanyRow>[] {
  return [
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.name")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("companyName")}</span>
      ),
    },
    {
      accessorKey: "nip",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.nip")} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("nip")}</span>
      ),
    },
    {
      accessorKey: "user.email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.email")} />
      ),
      cell: ({ row }) => row.original.user.email,
    },
    {
      accessorKey: "viesVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.status")} />
      ),
      cell: ({ row }) => {
        const verified = row.getValue("viesVerified") as boolean
        return verified ? (
          <Badge variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {t("companies.status.verified")}
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            {t("companies.status.pending")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.accountStatus")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as CompanyStatus
        const statusConfig = {
          PENDING: {
            variant: "secondary" as const,
            icon: <Clock className="mr-1 h-3 w-3" />,
          },
          ACTIVE: {
            variant: "default" as const,
            icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
          },
          SUSPENDED: {
            variant: "destructive" as const,
            icon: <AlertCircle className="mr-1 h-3 w-3" />,
          },
        }
        const config = statusConfig[status]
        return (
          <Badge variant={config.variant}>
            {config.icon}
            {t(`companies.companyStatus.${status}`)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("companies.table.createdAt")} />
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt"), locale),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original
        const actions: RowAction<CompanyRow>[] = [
          {
            id: "view",
            label: t("companies.actions.view"),
            icon: <Eye className="h-4 w-4" />,
            onClick: () => onView(company.slug),
          },
          {
            id: "edit",
            label: t("companies.actions.edit"),
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => onEdit(company.id),
          },
        ]

        // Check VIES action - available for all companies
        if (onCheckVies) {
          actions.push({
            id: "checkVies",
            label: t("companies.actions.checkVies"),
            icon: <Search className="h-4 w-4" />,
            onClick: () => onCheckVies(company.id),
          })
        }

        // Verify/Reject actions - always available (admin can approve/suspend any company)
        actions.push(
          {
            id: "verify",
            label: t("companies.actions.verify"),
            icon: <CheckCheck className="h-4 w-4" />,
            onClick: () => onVerify(company.id),
          },
          {
            id: "reject",
            label: t("companies.actions.reject"),
            icon: <X className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => onReject(company.id),
          }
        )

        // Wallet action - link to owner's wallet
        if (onWallet) {
          actions.push({
            id: "wallet",
            label: t("companies.actions.wallet"),
            icon: <Wallet className="h-4 w-4" />,
            onClick: () => onWallet(company.userId),
          })
        }

        if (onDelete) {
          actions.push({
            id: "delete",
            label: t("companies.actions.delete"),
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => onDelete(company.id),
          })
        }

        return <DataTableRowActions row={row} actions={actions} />
      },
    },
  ]
}
