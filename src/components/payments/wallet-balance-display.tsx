"use client"

import { useTranslations } from "@/lib/i18n/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Gift, Wallet, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { pointsToApproxPLN } from "@/lib/wallet/wallet-constants"

interface WalletBalanceDisplayProps {
  promo: {
    balance: number
    expiresAt: string | null
    daysRemaining: number | null
  }
  main: {
    balance: number
    expiresAt: string | null
    isMaintenanceFeeActive: boolean
  }
  total: number
  className?: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

function getExpiryColor(daysRemaining: number | null): string {
  if (daysRemaining === null) return "bg-muted"
  if (daysRemaining <= 7) return "bg-red-500"
  if (daysRemaining <= 30) return "bg-amber-500"
  return "bg-green-500"
}

function getExpiryProgress(daysRemaining: number | null, totalDays: number): number {
  if (daysRemaining === null) return 0
  return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100))
}

export function WalletBalanceDisplay({
  promo,
  main,
  total,
  className
}: WalletBalanceDisplayProps) {
  const { t } = useTranslations("payments")

  return (
    <div className={cn("space-y-4", className)}>
      {/* Total balance header */}
      <div className="text-center pb-4 border-b">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Coins className="h-6 w-6 text-primary" />
          <span className="text-3xl font-bold">{total.toLocaleString()}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("wallet.totalBalance")} (~{pointsToApproxPLN(total)} PLN)
        </p>
      </div>

      {/* Dual wallet cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* PROMO Wallet */}
        <Card className={cn(
          "border-l-4",
          promo.balance > 0 ? "border-l-purple-500" : "border-l-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              {t("wallet.promo.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xl font-bold">
              {promo.balance.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {t("wallet.points")}
              </span>
            </div>

            {promo.balance > 0 && promo.daysRemaining !== null && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("wallet.promo.expiresIn", { days: promo.daysRemaining })}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(promo.expiresAt)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        getExpiryColor(promo.daysRemaining)
                      )}
                      style={{ width: `${getExpiryProgress(promo.daysRemaining, 60)}%` }}
                    />
                  </div>
                </div>

                {promo.daysRemaining <= 7 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {t("wallet.promo.expiryWarning")}
                  </div>
                )}
              </>
            )}

            {promo.balance === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("wallet.promo.empty")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* MAIN Wallet */}
        <Card className={cn(
          "border-l-4",
          main.balance > 0 ? "border-l-blue-500" : "border-l-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              {t("wallet.main.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xl font-bold">
              {main.balance.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {t("wallet.points")}
              </span>
            </div>

            {main.balance > 0 && main.expiresAt && (
              <div className="text-xs text-muted-foreground">
                {t("wallet.main.expiresAt", { date: formatDate(main.expiresAt) })}
              </div>
            )}

            {main.isMaintenanceFeeActive && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t("wallet.main.maintenanceWarning")}
              </Badge>
            )}

            {main.balance === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("wallet.main.empty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
