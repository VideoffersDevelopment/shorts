"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard, Building2 } from "lucide-react"
import { POINT_PACKAGES, type PointPackageId } from "@/lib/wallet/wallet-constants"
import { formatAmount } from "@/lib/payments"

interface PaymentFormProps {
  onSubmit: (provider: "PRZELEWY24" | "TPAY", packageId: PointPackageId) => Promise<void>
  isLoading?: boolean
  defaultPackageId?: PointPackageId
}

/**
 * PaymentForm - Provider selection and point package form
 *
 * Features:
 * - Payment provider selection (Przelewy24 or Tpay)
 * - Point package selection (starter/standard/premium/business)
 * - Price display with discount info
 * - Loading state during checkout
 */
export function PaymentForm({
  onSubmit,
  isLoading = false,
  defaultPackageId = "starter"
}: PaymentFormProps) {
  const { t } = useTranslations("payments")
  const [provider, setProvider] = useState<"PRZELEWY24" | "TPAY">("PRZELEWY24")
  const [packageId, setPackageId] = useState<PointPackageId>(defaultPackageId)

  const selectedPkg = POINT_PACKAGES.find(p => p.id === packageId) ?? POINT_PACKAGES[0]

  const handleSubmit = useCallback(async () => {
    await onSubmit(provider, packageId)
  }, [onSubmit, provider, packageId])

  const handleProviderChange = useCallback((value: string) => {
    setProvider(value as "PRZELEWY24" | "TPAY")
  }, [])

  const handlePackageChange = useCallback((value: string) => {
    setPackageId(value as PointPackageId)
  }, [])

  return (
    <div className="space-y-6">
      {/* Point Package Selector */}
      <div className="space-y-3">
        <Label>{t("form.package")}</Label>
        <RadioGroup
          value={packageId}
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
                <span className="text-lg font-bold">{pkg.label}</span>
                <span className="text-xs text-muted-foreground mb-2">
                  {pkg.description}
                </span>
                <span className="font-medium text-primary">
                  {formatAmount(pkg.pricePLN)} PLN
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label>{t("form.provider")}</Label>
        <RadioGroup
          value={provider}
          onValueChange={handleProviderChange}
          disabled={isLoading}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value="PRZELEWY24"
              id="przelewy24"
              className="peer sr-only"
            />
            <Label
              htmlFor="przelewy24"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Building2 className="mb-3 h-6 w-6" />
              <span className="font-medium">Przelewy24</span>
              <span className="text-xs text-muted-foreground">
                {t("providers.p24Description")}
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="TPAY"
              id="tpay"
              className="peer sr-only"
            />
            <Label
              htmlFor="tpay"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <CreditCard className="mb-3 h-6 w-6" />
              <span className="font-medium">Tpay</span>
              <span className="text-xs text-muted-foreground">
                {t("providers.tpayDescription")}
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Price Summary */}
      <div className="rounded-lg bg-muted p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t("form.total")}</span>
          <span className="text-2xl font-bold">{formatAmount(selectedPkg.pricePLN)} PLN</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {selectedPkg.label}
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("form.processing")}
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {t("form.pay", { amount: formatAmount(selectedPkg.pricePLN) })}
          </>
        )}
      </Button>

      {/* Security Note */}
      <p className="text-xs text-center text-muted-foreground">
        {t("form.securityNote")}
      </p>
    </div>
  )
}
