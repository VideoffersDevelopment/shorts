"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Rocket, Coins, Clock } from "lucide-react"
import { toast } from "sonner"

interface BoostModalProps {
  isOpen: boolean
  onClose: () => void
  shortId: string
  shortTitle: string
  credits: number
  boostCost?: number
}

export function BoostModal({
  isOpen,
  onClose,
  shortId,
  shortTitle,
  credits,
  boostCost = 80
}: BoostModalProps) {
  const { t } = useTranslations("shorts")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAfford = credits >= boostCost

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shorts/${shortId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 402) {
          setError(t("boost.insufficientCredits"))
        } else {
          setError(data.error || t("boost.failed"))
        }
        return
      }

      toast.success(t("boost.success"))
      onClose()
      router.refresh()
    } catch {
      setError(t("boost.failed"))
    } finally {
      setIsLoading(false)
    }
  }, [shortId, onClose, router, t])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }, [isLoading, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-500" />
            {t("boost.title")}
          </DialogTitle>
          <DialogDescription>
            {t("boost.description", { title: shortTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Boost info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4" />
                {t("boost.cost")}
              </span>
              <span className="font-bold text-lg">
                {boostCost.toLocaleString()} {t("boost.points")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("boost.duration")}
              </span>
              <span>{t("boost.durationValue")}</span>
            </div>
          </div>

          {/* Balance info */}
          <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("boost.yourBalance")}
            </span>
            <span className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}>
              {credits.toLocaleString()} {t("boost.points")}
            </span>
          </div>

          {/* What boost does */}
          <p className="text-xs text-muted-foreground">
            {t("boost.info")}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t("boost.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !canAfford}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {canAfford ? t("boost.confirm") : t("boost.insufficientShort")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
