"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import { CreditsHistory } from "@/components/payments/credits-history"
import { CreditsPurchaseModal } from "@/components/payments/credits-purchase-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, History, Plus } from "lucide-react"
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

interface CreditsManagementProps {
  transactions: Transaction[]
}

export function CreditsManagement({ transactions }: CreditsManagementProps) {
  const { t } = useTranslations("payments")
  const router = useRouter()
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

  const handleOpenPurchase = useCallback(() => {
    setIsPurchaseModalOpen(true)
  }, [])

  const handleClosePurchase = useCallback(() => {
    setIsPurchaseModalOpen(false)
  }, [])

  const handlePurchaseSuccess = useCallback(() => {
    setIsPurchaseModalOpen(false)
    router.refresh()
  }, [router])

  return (
    <>
      {/* Buy Credits Button */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("credits.buy")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("packages.description")}
                </p>
              </div>
            </div>
            <Button onClick={handleOpenPurchase}>
              <Plus className="mr-2 h-4 w-4" />
              {t("credits.buy")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("history.title")}
          </CardTitle>
          <CardDescription>
            {t("transactions.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CreditsHistory transactions={transactions} />
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      <CreditsPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={handleClosePurchase}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  )
}
