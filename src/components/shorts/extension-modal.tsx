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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Clock, Coins } from "lucide-react"
import { toast } from "sonner"

interface ExtensionPeriod {
  id: string
  label: string
  cost: number
  days: number
}

const EXTENSION_PERIODS: ExtensionPeriod[] = [
  { id: "30D", label: "+30 days", cost: 500, days: 30 },
  { id: "3M", label: "+3 months", cost: 1350, days: 90 },
  { id: "6M", label: "+6 months", cost: 2500, days: 180 },
  { id: "12M", label: "+12 months", cost: 4500, days: 365 },
]

interface ExtensionModalProps {
  isOpen: boolean
  onClose: () => void
  shortId: string
  shortTitle: string
  currentExpiresAt: string | null
  credits: number
}

export function ExtensionModal({
  isOpen,
  onClose,
  shortId,
  shortTitle,
  currentExpiresAt,
  credits
}: ExtensionModalProps) {
  const { t } = useTranslations("shorts")
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState("30D")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = EXTENSION_PERIODS.find(p => p.id === selectedPeriod) ?? EXTENSION_PERIODS[0]
  const canAfford = credits >= selected.cost

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shorts/${shortId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod })
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 402) {
          setError(t("extension.insufficientCredits"))
        } else {
          setError(data.error || t("extension.failed"))
        }
        return
      }

      toast.success(t("extension.success"))
      onClose()
      router.refresh()
    } catch {
      setError(t("extension.failed"))
    } finally {
      setIsLoading(false)
    }
  }, [shortId, selectedPeriod, onClose, router, t])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }, [isLoading, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("extension.title")}
          </DialogTitle>
          <DialogDescription>
            {t("extension.description", { title: shortTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current expiry info */}
          {currentExpiresAt && (
            <div className="text-sm text-muted-foreground">
              {t("extension.currentExpiry", {
                date: new Date(currentExpiresAt).toLocaleDateString()
              })}
            </div>
          )}

          {/* Period selection */}
          <RadioGroup
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            className="space-y-2"
          >
            {EXTENSION_PERIODS.map((period) => (
              <div key={period.id} className="relative">
                <RadioGroupItem
                  value={period.id}
                  id={`period-${period.id}`}
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <Label
                  htmlFor={`period-${period.id}`}
                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <span className="font-medium">{period.label}</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Coins className="h-3.5 w-3.5" />
                    {period.cost.toLocaleString()} {t("extension.points")}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Balance info */}
          <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("extension.yourBalance")}
            </span>
            <span className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}>
              {credits.toLocaleString()} {t("extension.points")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t("extension.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !canAfford}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {canAfford
                ? t("extension.extend", { cost: selected.cost.toLocaleString() })
                : t("extension.insufficientShort")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
