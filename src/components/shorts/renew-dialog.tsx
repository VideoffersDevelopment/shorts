"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw, CreditCard, Calendar } from "lucide-react"
import { renewShortAction } from "@/app/actions/shorts/renew"
import type { Short } from "@prisma/client"

interface RenewDialogProps {
  short: Short | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  credits: number
}

export function RenewDialog({
  short,
  isOpen,
  onClose,
  onSuccess,
  credits
}: RenewDialogProps) {
  const { t } = useTranslations("shorts")
  const { t: tPayments } = useTranslations("payments")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate new expiry date (30 days from now)
  const newExpiryDate = new Date()
  newExpiryDate.setDate(newExpiryDate.getDate() + 30)

  const handleRenew = useCallback(async () => {
    if (!short) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await renewShortAction(short.id)

      if (!result.success) {
        setError(result.error)
        return
      }

      if (result.data.needsPayment) {
        // Redirect to credits/payment page
        router.push("/panel/credits?action=buy")
        onClose()
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError(t("errors.renewFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [short, onSuccess, onClose, router, t])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }, [isLoading, onClose])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t("renew.title")}
          </DialogTitle>
          <DialogDescription>
            {t("renew.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {short && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{short.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t("renew.newExpiry", { date: formatDate(newExpiryDate) })}
                </span>
              </div>
            </div>
          )}

          {/* Credits info */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span>{tPayments("credits.available")}</span>
              </div>
              <span className="font-bold text-lg">{credits}</span>
            </div>

            {credits > 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                {t("renew.useCredit")}
              </p>
            ) : (
              <p className="text-sm text-amber-600 mt-2">
                {t("renew.needsPayment")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("renew.cancel")}
          </Button>
          <Button
            onClick={handleRenew}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {credits > 0 ? t("renew.confirm") : tPayments("credits.buy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
