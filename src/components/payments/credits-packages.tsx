"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { POINT_PACKAGES, type PointPackageId } from "@/lib/wallet/wallet-constants"
import { CreditsPurchaseModal } from "@/components/payments/credits-purchase-modal"

/**
 * Interactive credit package cards with integrated purchase modal.
 * "Kup teraz" opens the modal with the selected package pre-filled,
 * skipping straight to payment method selection.
 */
export function CreditsPackages() {
  const { t } = useTranslations("payments")
  const router = useRouter()
  const [selectedPackageId, setSelectedPackageId] = useState<PointPackageId | null>(null)

  const handleBuyClick = useCallback((packageId: PointPackageId) => {
    setSelectedPackageId(packageId)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedPackageId(null)
  }, [])

  const handleSuccess = useCallback(() => {
    setSelectedPackageId(null)
    router.refresh()
  }, [router])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="relative rounded-lg border p-4 hover:border-primary transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{pkg.label}</div>
              <div className="text-xs text-muted-foreground mb-3">
                {pkg.description}
              </div>
              <div className="text-lg font-semibold text-primary mb-3">
                {(pkg.pricePLN / 100).toFixed(2)} PLN
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleBuyClick(pkg.id as PointPackageId)}
              >
                {t("packages.buy")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CreditsPurchaseModal
        isOpen={selectedPackageId !== null}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialPackageId={selectedPackageId ?? undefined}
      />
    </>
  )
}
