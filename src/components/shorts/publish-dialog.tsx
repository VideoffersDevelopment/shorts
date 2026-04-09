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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreditsDisplay } from "@/components/payments/credits-display"
import { PaymentForm } from "@/components/payments/payment-form"
import {
  AlertCircle,
  CheckCircle,
  Coins,
  Loader2,
  ShieldCheck
} from "lucide-react"
import { publishShortAction } from "@/app/actions/shorts/publish"
import type { PointPackageId } from "@/lib/wallet/wallet-constants"

interface PublishDialogProps {
  shortId: string
  shortTitle: string
  companyVerified: boolean
  credits: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locale: string
}

type DialogState = "initial" | "payment" | "processing" | "success" | "error"

/**
 * PublishDialog - Dialog for publishing a short with credits or payment
 *
 * Features:
 * - Company verification check
 * - Credits balance display
 * - Use credits option (if available)
 * - Payment form (if no credits)
 * - Loading states
 * - Success/error handling
 */
export function PublishDialog({
  shortId,
  shortTitle,
  companyVerified,
  credits,
  isOpen,
  onClose,
  onSuccess,
  locale
}: PublishDialogProps) {
  const { t } = useTranslations("payments")
  const router = useRouter()
  const [state, setState] = useState<DialogState>("initial")
  const [error, setError] = useState<string | null>(null)

  const handleUseCredits = useCallback(async () => {
    setState("processing")
    setError(null)

    try {
      const result = await publishShortAction(shortId)

      if (!result.success) {
        setError(result.error)
        setState("error")
        return
      }

      if (result.data.processing) {
        setState("success")
        // Close dialog and refresh page after a short delay
        // The ProcessingStatusBar on detail page will show progress
        setTimeout(() => {
          onSuccess()
          router.refresh()
        }, 1500)
      }
    } catch {
      setError(t("errors.publishFailed"))
      setState("error")
    }
  }, [shortId, router, onSuccess, t])

  const handlePaymentSubmit = useCallback(
    async (provider: "PRZELEWY24" | "TPAY", packageId: PointPackageId) => {
      setState("processing")
      setError(null)

      try {
        const response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            packageId,
            locale
          })
        })

        if (!response.ok) {
          const data = await response.json() as { error: string }
          throw new Error(data.error || "Checkout failed")
        }

        const data = await response.json() as { checkoutUrl: string }

        // Redirect to payment provider
        window.location.href = data.checkoutUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.checkoutFailed"))
        setState("error")
      }
    },
    [locale, t]
  )

  const handleShowPayment = useCallback(() => {
    setState("payment")
  }, [])

  const handleBack = useCallback(() => {
    setState("initial")
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    setState("initial")
    setError(null)
    onClose()
  }, [onClose])

  // Verification required state
  if (!companyVerified) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("publish.title")}</DialogTitle>
            <DialogDescription>{shortTitle}</DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("publish.verificationRequired")}</AlertTitle>
            <AlertDescription>
              {t("publish.verificationDescription")}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => router.push(`/${locale}/panel/company/verify`)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("publish.verifyCompany")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Success state
  if (state === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex flex-col items-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-center mb-2">
              {t("publish.success.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("publish.success.description")}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Processing state
  if (state === "processing") {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent>
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <DialogTitle className="text-center mb-2">
              {t("publish.processing")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("publish.processingDescription")}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Payment form state
  if (state === "payment") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("publish.buyCredits")}</DialogTitle>
            <DialogDescription>
              {t("publish.buyCreditsDescription")}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <PaymentForm
            onSubmit={handlePaymentSubmit}
            isLoading={false}
          />

          <Button variant="ghost" onClick={handleBack} className="mt-2">
            {t("common.back")}
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  // Initial/error state
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("publish.title")}</DialogTitle>
          <DialogDescription>{shortTitle}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Credits Balance */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {t("publish.yourCredits")}
          </span>
          <CreditsDisplay credits={credits} size="lg" />
        </div>

        {credits > 0 ? (
          <>
            {/* Use Credits Option */}
            <div className="space-y-4">
              <Alert>
                <Coins className="h-4 w-4" />
                <AlertTitle>{t("publish.useCreditsTitle")}</AlertTitle>
                <AlertDescription>
                  {t("publish.useCreditsDescription")}
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleUseCredits}
                className="w-full"
                size="lg"
              >
                <Coins className="mr-2 h-4 w-4" />
                {t("publish.useCredit")}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* No Credits - Payment Required */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("publish.noCredits")}</AlertTitle>
              <AlertDescription>
                {t("publish.noCreditsDescription", {
                  price: "15.00"
                })}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleShowPayment}
              className="w-full"
              size="lg"
            >
              {t("publish.buyAndPublish", {
                price: "15.00"
              })}
            </Button>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
