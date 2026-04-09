"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  User,
  Building2,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  UserCog,
  Trash2,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "../data-table/data-table-column-header"
import { DataTableRowActions } from "../data-table/data-table-row-actions"
import type { RowAction } from "../data-table/types"
import { formatDate } from "@/lib/utils"

export interface UserRow {
  id: string
  email: string
  role: "USER" | "COMPANY" | "ADMIN"
  isBlocked: boolean
  emailVerified: Date | null
  createdAt: Date
  profile?: { displayName: string | null } | null
  companyProfile?: { companyName: string } | null
  walletBalance?: number
}

interface GetUsersColumnsOptions {
  t: (key: string) => string
  locale: string
  currentUserId: string
  onDetails: (id: string) => void
  onChangeRole: (id: string, currentRole: string) => void
  onToggleBlock: (id: string, isBlocked: boolean) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onWallet?: (id: string) => void
}

const roleIcons = {
  USER: User,
  COMPANY: Building2,
  ADMIN: Shield,
}

const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
  USER: "secondary",
  COMPANY: "outline",
  ADMIN: "default",
}

export function getUsersColumns({
  t,
  locale,
  currentUserId,
  onDetails,
  onChangeRole,
  onToggleBlock,
  onDelete,
  onWallet,
}: GetUsersColumnsOptions): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("users.table.email")} />
      ),
      cell: ({ row }) => {
        const user = row.original
        const displayName = user.profile?.displayName
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("email")}</span>
            {displayName && (
              <span className="text-xs text-muted-foreground">{displayName}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("users.table.role")} />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as keyof typeof roleIcons
        const Icon = roleIcons[role]
        return (
          <Badge variant={roleVariants[role]}>
            <Icon className="mr-1 h-3 w-3" />
            {t(`users.role.${role}`)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isBlocked",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("users.table.status")} />
      ),
      cell: ({ row }) => {
        const isBlocked = row.original.isBlocked
        return isBlocked ? (
          <Badge variant="destructive">
            <Ban className="mr-1 h-3 w-3" />
            {t("users.status.blocked")}
          </Badge>
        ) : (
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("users.status.active")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("users.table.emailVerified")}
        />
      ),
      cell: ({ row }) => {
        const verified = row.getValue("emailVerified") as Date | null
        return verified ? (
          <span className="text-sm text-muted-foreground">
            {formatDate(verified, locale)}
          </span>
        ) : (
          <span className="flex items-center text-sm text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3 text-destructive" />
            {t("users.details.notVerified")}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("users.table.createdAt")} />
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt"), locale),
    },
    {
      accessorKey: "walletBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("users.table.balance")} />
      ),
      cell: ({ row }) => {
        const balance = row.original.walletBalance ?? 0
        return (
          <span className="font-mono text-sm font-medium">
            {balance.toLocaleString()} pts
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId

        const actions: RowAction<UserRow>[] = [
          {
            id: "details",
            label: t("users.actions.details"),
            icon: <Eye className="h-4 w-4" />,
            onClick: () => onDetails(user.id),
          },
          {
            id: "changeRole",
            label: t("users.actions.changeRole"),
            icon: <UserCog className="h-4 w-4" />,
            onClick: () => onChangeRole(user.id, user.role),
            disabled: isSelf,
          },
        ]

        // Wallet action
        if (onWallet) {
          actions.push({
            id: "wallet",
            label: t("users.actions.wallet"),
            icon: <Wallet className="h-4 w-4" />,
            onClick: () => onWallet(user.id),
          })
        }

        // Block/Unblock action (not for self)
        if (!isSelf) {
          if (user.isBlocked) {
            actions.push({
              id: "unblock",
              label: t("users.actions.unblock"),
              icon: <CheckCircle className="h-4 w-4" />,
              onClick: () => onToggleBlock(user.id, user.isBlocked),
            })
          } else {
            actions.push({
              id: "block",
              label: t("users.actions.block"),
              icon: <Ban className="h-4 w-4" />,
              variant: "destructive",
              onClick: () => onToggleBlock(user.id, user.isBlocked),
            })
          }
        }

        // Delete action (not for self)
        if (onDelete && !isSelf) {
          actions.push({
            id: "delete",
            label: t("users.actions.delete"),
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => onDelete(user.id),
          })
        }

        return <DataTableRowActions row={row} actions={actions} />
      },
    },
  ]
}
