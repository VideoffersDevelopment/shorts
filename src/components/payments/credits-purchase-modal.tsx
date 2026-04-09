"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, CreditCard, Building2, Coins } from "lucide-react"
import { POINT_PACKAGES, type PointPackageId } from "@/lib/wallet/wallet-constants"
import { formatAmount } from "@/lib/payments"

interface CreditsPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreditsPurchaseModal({
  isOpen,
  onClose,
  onSuccess
}: CreditsPurchaseModalProps) {
  const { t } = useTranslations("payments")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PointPackageId>("starter")
  const [provider, setProvider] = useState<"PRZELEWY24" | "TPAY">("PRZELEWY24")

  const selectedPkg = POINT_PACKAGES.find(p => p.id === selectedPackage) ?? POINT_PACKAGES[0]

  // Clear error when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  const handlePackageChange = useCallback((value: string) => {
    setSelectedPackage(value as PointPackageId)
  }, [])

  const handleProviderChange = useCallback((value: string) => {
    setProvider(value as "PRZELEWY24" | "TPAY")
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          packageId: selectedPackage,
          locale: "pl"
        })
      })

      if (!response.ok) {
        const data = await response.json() as { error: string }
        throw new Error(data.error || "Checkout failed")
      }

      const data = await response.json() as { checkoutUrl: string }

      // Redirect to payment provider
      window.location.href = data.checkoutUrl
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.checkoutFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [provider, selectedPackage, onSuccess, t])

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
            <Coins className="h-5 w-5" />
            {t("purchase.title")}
          </DialogTitle>
          <DialogDescription>
            {t("purchase.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Point Packages */}
          <div className="space-y-3">
            <Label>{t("purchase.package", { credits: "" })}</Label>
            <RadioGroup
              value={selectedPackage}
              onValueChange={handlePackageChange}
              className="grid grid-cols-2 gap-3"
            >
              {POINT_PACKAGES.map((pkg) => (
                <div key={pkg.id} className="relative">
                  <RadioGroupItem
                    value={pkg.id}
                    id={`pkg-${pkg.id}`}
                    className="peer sr-only"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`pkg-${pkg.id}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="text-2xl font-bold">{pkg.label}</span>
                    <span className="text-xs text-muted-foreground mb-2">
                      {pkg.description}
                    </span>
                    <span className="font-medium">
                      {formatAmount(pkg.pricePLN)} PLN
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Provider */}
          <div className="space-y-3">
            <Label>{t("purchase.selectProvider")}</Label>
            <RadioGroup
              value={provider}
              onValueChange={handleProviderChange}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem
                  value="PRZELEWY24"
                  id="przelewy24"
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="przelewy24"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <Building2 className="mb-2 h-6 w-6" />
                  <span className="font-medium">Przelewy24</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("providers.p24Description")}
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="TPAY"
                  id="tpay"
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="tpay"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span className="font-medium">Tpay</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("providers.tpayDescription")}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("form.total")}
              </span>
              <span className="text-2xl font-bold">
                {formatAmount(selectedPkg.pricePLN)} PLN
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedPkg.label}
            </p>
            <p className="text-xs text-primary mt-2 font-medium">
              {t("purchase.expiryResetInfo")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t("purchase.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("purchase.buy")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
