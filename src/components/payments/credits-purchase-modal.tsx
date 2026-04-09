"use client"

import { useState, useCallback, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, CreditCard, Building2, Coins, FlaskConical, CheckCircle2, XCircle } from "lucide-react"
import { POINT_PACKAGES, type PointPackageId } from "@/lib/wallet/wallet-constants"
import { formatAmount } from "@/lib/payments"

type ProviderType = "PRZELEWY24" | "TPAY" | "OTHER"

interface CreditsPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Pre-selected package — hides package selector when provided */
  initialPackageId?: PointPackageId
}

export function CreditsPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  initialPackageId
}: CreditsPurchaseModalProps) {
  const { t } = useTranslations("payments")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PointPackageId>(initialPackageId ?? "starter")
  const [provider, setProvider] = useState<ProviderType>("PRZELEWY24")

  // Testing Gate state
  const [testingPaymentId, setTestingPaymentId] = useState<string | null>(null)
  const [testingResult, setTestingResult] = useState<"success" | "failure" | null>(null)

  const selectedPkg = POINT_PACKAGES.find(p => p.id === selectedPackage) ?? POINT_PACKAGES[0]

  // Sync initialPackageId when it changes (e.g., opening modal from different package cards)
  useEffect(() => {
    if (initialPackageId) {
      setSelectedPackage(initialPackageId)
    }
  }, [initialPackageId])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setTestingPaymentId(null)
      setTestingResult(null)
    }
  }, [isOpen])

  const handlePackageChange = useCallback((value: string) => {
    setSelectedPackage(value as PointPackageId)
  }, [])

  const handleProviderChange = useCallback((value: string) => {
    setProvider(value as ProviderType)
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

      const data = await response.json() as { checkoutUrl: string; paymentId: string }

      // Testing Gate — stay in modal, show simulation buttons
      if (data.checkoutUrl.startsWith("__testing__:")) {
        setTestingPaymentId(data.paymentId)
        setIsLoading(false)
        return
      }

      // Real providers — redirect to external gateway
      window.location.href = data.checkoutUrl
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.checkoutFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [provider, selectedPackage, onSuccess, t])

  const handleTestingSimulate = useCallback(async (result: "success" | "failure") => {
    if (!testingPaymentId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/testing/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: testingPaymentId,
          result
        })
      })

      if (!response.ok) {
        const data = await response.json() as { error: string }
        throw new Error(data.error || "Simulation failed")
      }

      setTestingResult(result)

      if (result === "success") {
        // Brief delay to show success state, then redirect
        setTimeout(() => {
          router.push(`/pl/panel/credits?paymentId=${testingPaymentId}&status=completed`)
          router.refresh()
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed")
    } finally {
      setIsLoading(false)
    }
  }, [testingPaymentId, router, onSuccess])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null)
      setTestingPaymentId(null)
      setTestingResult(null)
      onClose()
    }
  }, [isLoading, onClose])

  const showPackageSelector = !initialPackageId

  // Testing Gate simulation view
  if (testingPaymentId && !testingResult) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-yellow-500" />
              Testing Gate
            </DialogTitle>
            <DialogDescription>
              Symulacja bramki platnosci
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Payment summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("form.total")}</span>
                <span className="text-2xl font-bold">
                  {formatAmount(selectedPkg.pricePLN)} PLN
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPkg.label}
              </p>
              <p className="text-xs text-yellow-500 mt-2 font-medium">
                Payment ID: {testingPaymentId}
              </p>
            </div>

            {/* Simulate buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white h-auto py-4"
                onClick={() => handleTestingSimulate("success")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                <div className="text-left">
                  <div className="font-medium">Udana platnosc</div>
                  <div className="text-xs opacity-80">Symuluj sukces</div>
                </div>
              </Button>

              <Button
                variant="destructive"
                className="h-auto py-4"
                onClick={() => handleTestingSimulate("failure")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                <div className="text-left">
                  <div className="font-medium">Nieudana platnosc</div>
                  <div className="text-xs opacity-80">Symuluj blad</div>
                </div>
              </Button>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              {t("purchase.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Testing Gate result view
  if (testingResult) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-yellow-500" />
              Testing Gate — Wynik
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {testingResult === "success" ? (
              <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950 p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
                  Platnosc udana!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  +{selectedPkg.points.toLocaleString()} pkt dodane do portfela MAIN
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Przekierowanie...
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 p-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
                  Platnosc nieudana
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Symulacja bledu bramki platnosci
                </p>
              </div>
            )}

            <Button variant="outline" onClick={handleClose} className="w-full">
              Zamknij
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Main purchase form view
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

          {/* Point Packages — hidden when pre-selected */}
          {showPackageSelector && (
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
          )}

          {/* Payment Provider — with Testing Gate */}
          <div className="space-y-3">
            <Label>{t("purchase.selectProvider")}</Label>
            <RadioGroup
              value={provider}
              onValueChange={handleProviderChange}
              className="grid grid-cols-3 gap-3"
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
                  <span className="font-medium text-sm">Przelewy24</span>
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
                  <span className="font-medium text-sm">Tpay</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("providers.tpayDescription")}
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="OTHER"
                  id="testing"
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="testing"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-yellow-500 cursor-pointer"
                >
                  <FlaskConical className="mb-2 h-6 w-6 text-yellow-500" />
                  <span className="font-medium text-sm">Testing</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Symulacja
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
