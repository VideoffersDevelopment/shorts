"use client"

import { useTranslations } from "@/lib/i18n/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Coins,
  Package,
  Gift,
  Tag,
  RefreshCcw,
  Shield,
  Upload,
  MoreHorizontal
} from "lucide-react"
import type { CreditActionType } from "@prisma/client"

interface Transaction {
  id: string
  amount: number
  actionType: CreditActionType
  createdAt: Date
  balanceAfter: number
  short: {
    id: string
    title: string
  } | null
}

interface CreditsHistoryProps {
  transactions: Transaction[]
}

function getActionIcon(actionType: CreditActionType) {
  switch (actionType) {
    case "PUBLICATION":
      return <Upload className="h-4 w-4" />
    case "EXTENSION":
      return <RefreshCcw className="h-4 w-4" />
    case "BOOST_STD":
      return <Tag className="h-4 w-4" />
    case "SUPER_LIKE":
      return <Gift className="h-4 w-4" />
    case "REFUND":
      return <RefreshCcw className="h-4 w-4" />
    case "ADMIN_GRANT":
      return <Shield className="h-4 w-4" />
    case "MAINTENANCE_FEE":
      return <Coins className="h-4 w-4" />
    case "PROMO_EXPIRED":
      return <Package className="h-4 w-4" />
    default:
      return <MoreHorizontal className="h-4 w-4" />
  }
}

function formatDate(date: Date, locale?: string): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function CreditsHistory({ transactions }: CreditsHistoryProps) {
  const { t } = useTranslations("payments")

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Coins className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          {t("history.noTransactions")}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("history.date")}</TableHead>
          <TableHead>{t("history.type")}</TableHead>
          <TableHead className="text-right">{t("history.amount")}</TableHead>
          <TableHead className="text-right">{t("history.balance")}</TableHead>
          <TableHead>{t("history.relatedShort")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            {/* Date */}
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(tx.createdAt)}
            </TableCell>

            {/* Type with icon */}
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full p-1.5 ${
                    tx.amount > 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {getActionIcon(tx.actionType)}
                </div>
                <span>{t(`transactions.actionType.${tx.actionType}`)}</span>
              </div>
            </TableCell>

            {/* Amount */}
            <TableCell className="text-right">
              <span
                className={`font-medium ${
                  tx.amount > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount}
              </span>
            </TableCell>

            {/* Balance after */}
            <TableCell className="text-right">
              <span className="text-muted-foreground">{tx.balanceAfter}</span>
            </TableCell>

            {/* Related short */}
            <TableCell>
              {tx.short ? (
                <span className="text-sm line-clamp-1">{tx.short.title}</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
