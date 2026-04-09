"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "@/lib/i18n/client"
import { upgradeToCompanyAction } from "@/app/actions/companies/upgrade"
import { useNipValidation } from "@/hooks/use-nip-validation"
import { NipValidationStatus } from "./nip-validation-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { ViesStatusBadge } from "./vies-status-badge"
import { CheckCircle, Gift } from "lucide-react"

interface CompanyUpgradeFormProps {
  initialAlreadyCompany?: boolean
  initialSuccess?: "verified" | "pending" | null
}

export function CompanyUpgradeForm({
  initialAlreadyCompany = false,
  initialSuccess = null
}: CompanyUpgradeFormProps) {
  const { t } = useTranslations("companies")
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const { update: updateSession } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // NIP real-time validation
  const {
    status: nipStatus,
    validationResult,
    validateNip,
    reset: resetNipValidation,
    setValidationResult
  } = useNipValidation()

  // Local state for success - this persists across re-renders and is NOT affected by server props
  // Once we set this to true, it stays true until user navigates away
  const [localSuccess, setLocalSuccess] = useState<"verified" | "pending" | null>(initialSuccess)

  // Show success modal if EITHER server says so (URL param) OR local state says so
  const showSuccessModal = localSuccess === "verified" || localSuccess === "pending"

  const successData = showSuccessModal ? {
    viesStatus: localSuccess === "verified" ? "verified" as const : "pending_manual_review" as const
  } : null

  // Redirect if user already has company (and we're NOT showing success modal)
  // This useEffect runs ONLY for the alreadyCompany case, never when showing success
  useEffect(() => {
    // CRITICAL: Check localSuccess (not just initialSuccess) to ensure we never redirect
    // when the success modal should be shown
    if (initialAlreadyCompany && !localSuccess) {
      router.push(`/${locale}/panel/company/profile`)
    }
  }, [initialAlreadyCompany, localSuccess, locale, router])

  // Define handlers BEFORE any conditional returns (JavaScript hoisting requirement)
  async function handleContinue() {
    // Update session first (this updates JWT token with new COMPANY role)
    // IMPORTANT: Pass empty object to trigger JWT callback in NextAuth v5
    await updateSession({})
    // Force Server Components to re-render with new session data
    router.refresh()
    // Navigate to company profile - useSession in UserMenu will reactively update the menu
    router.push(`/${locale}/panel/company/profile`)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Block submission if NIP validation failed
    if (
      nipStatus === "error" ||
      (validationResult && (!validationResult.isValid || !validationResult.isUnique))
    ) {
      setError("nipValidation.errors.pleaseFixErrors")
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = await upgradeToCompanyAction(data)

    if (!result.success) {
      // Handle race condition: NIP became non-unique between validation and submission
      if (result.error === "errors.nipExists" || result.code === "NIP_EXISTS") {
        setValidationResult({
          isValid: false,
          isUnique: false,
          viesStatus: "invalid",
          error: "nipValidation.errors.alreadyExists"
        })
      }
      setError(result.error)
      setIsLoading(false)
    } else {
      // Set LOCAL state to show success modal
      // This is NOT affected by any server re-renders or revalidations
      const successValue = result.data.viesStatus === "verified" ? "verified" : "pending"
      setLocalSuccess(successValue)
      setIsLoading(false)
    }
  }

  // PRIORITY 1: Show success screen (must be checked FIRST)
  // This uses props from Server Component, so it's immediately available
  // NO useEffect redirect here - we handle redirect in PRIORITY 2 after success check
  if (showSuccessModal && successData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">{t("upgrade.success.title")}</h2>
            <ViesStatusBadge status={successData.viesStatus} />
            <p className="text-muted-foreground">
              {successData.viesStatus === "verified"
                ? t("upgrade.success.verified")
                : t("upgrade.success.pending")}
            </p>
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950 p-4 w-full max-w-sm">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-purple-800 dark:text-purple-200">
                    {t("upgrade.success.promoTitle")}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {t("upgrade.success.promoDescription")}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleContinue} className="mt-4">
              {t("upgrade.success.continueButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // PRIORITY 2: Show loading state while redirecting (redirect is triggered by useEffect above)
  if (initialAlreadyCompany && !showSuccessModal) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <LoadingSpinner className="h-8 w-8" />
            <p className="text-muted-foreground">
              {t("upgrade.alreadyCompany")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // PRIORITY 3: Show the upgrade form (default)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upgrade.title")}</CardTitle>
        <CardDescription>{t("upgrade.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{t(error)}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyName">{t("upgrade.fields.companyName")}</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              minLength={2}
              maxLength={100}
              disabled={isLoading}
              placeholder={t("upgrade.placeholders.companyName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nip">{t("upgrade.fields.nip")}</Label>
            <Input
              id="nip"
              name="nip"
              required
              pattern="\d{10}|\d{2}-\d{3}-\d{3}-\d{2}"
              placeholder="1234567890"
              disabled={isLoading}
              onBlur={(e) => validateNip(e.target.value)}
              onChange={() => {
                if (nipStatus !== "idle") {
                  resetNipValidation()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("upgrade.hints.nip")}
            </p>
            <NipValidationStatus
              status={nipStatus}
              validationResult={validationResult}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("upgrade.fields.address")}</Label>
            <Input
              id="address"
              name="address"
              required
              minLength={5}
              maxLength={200}
              disabled={isLoading}
              placeholder={t("upgrade.placeholders.address")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("upgrade.fields.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              disabled={isLoading}
              placeholder={t("upgrade.placeholders.phone")}
            />
            <p className="text-xs text-muted-foreground">
              {t("upgrade.hints.phone")}
            </p>
          </div>

          <Button
            type="submit"
            disabled={
              isLoading ||
              nipStatus === "validating" ||
              nipStatus === "error" ||
              !!(validationResult && (!validationResult.isValid || !validationResult.isUnique))
            }
            className="w-full"
          >
            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {isLoading ? t("upgrade.submitting") : t("upgrade.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
