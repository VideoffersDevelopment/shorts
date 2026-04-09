"use client"

import { useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n/client"
import { signupCompanyAction } from "@/app/actions/auth/signup-company"
import { useNipValidationPublic } from "@/hooks/use-nip-validation-public"
import { NipValidationStatus } from "@/components/companies/nip-validation-status"
import { ViesStatusBadge } from "@/components/companies/vies-status-badge"
import { OAuthButtons } from "./oauth-buttons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { CheckCircle } from "lucide-react"

export function CompanySignupForm() {
  const { t } = useTranslations("auth")
  const { t: tCompanies } = useTranslations("companies")
  const { locale } = useParams<{ locale: string }>()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    viesStatus: "verified" | "pending_manual_review"
  } | null>(null)

  // NIP real-time validation (public version - no auth required)
  const {
    status: nipStatus,
    validationResult,
    validateNip,
    reset: resetNipValidation,
    setValidationResult
  } = useNipValidationPublic()

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Block submission if NIP validation failed
    if (
      nipStatus === "error" ||
      (validationResult && (!validationResult.isValid || !validationResult.isUnique))
    ) {
      setError(tCompanies("nipValidation.errors.pleaseFixErrors"))
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = await signupCompanyAction(data)

    if (!result.success) {
      // Handle specific error codes
      if (result.error === "EMAIL_EXISTS") {
        setError(t("signup.errors.emailExists"))
      } else if (result.error === "ACCOUNT_BLOCKED") {
        setError(t("signup.errors.accountBlocked"))
      } else if (result.error === "errors.nipExists" || result.code === "NIP_EXISTS") {
        // Handle race condition: NIP became non-unique between validation and submission
        setValidationResult({
          isValid: false,
          isUnique: false,
          viesStatus: "invalid",
          error: "nipValidation.errors.alreadyExists"
        })
        setError(tCompanies("errors.nipExists"))
      } else {
        setError(result.error)
      }
      setIsLoading(false)
      return
    }

    setSuccess({ viesStatus: result.data.viesStatus })
    setIsLoading(false)
  }, [nipStatus, validationResult, setValidationResult, t, tCompanies])

  // Success screen
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold">{t("companySignup.success.title")}</h2>
        <ViesStatusBadge status={success.viesStatus} />
        <p className="text-muted-foreground">
          {t("companySignup.success.checkEmail")}
        </p>
        <p className="text-sm text-muted-foreground">
          {success.viesStatus === "verified"
            ? t("companySignup.success.verified")
            : t("companySignup.success.pending")}
        </p>
        <Link href={`/${locale}/login`} className="mt-4">
          <Button>{t("companySignup.success.loginButton")}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OAuthButtons callbackUrl={`/${locale}/signup/company/complete`} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("login.orContinueWith")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* EMAIL */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("signup.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            placeholder={t("signup.placeholders.email")}
          />
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("signup.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            disabled={isLoading}
            placeholder={t("signup.placeholders.password")}
          />
        </div>

        {/* COMPANY NAME */}
        <div className="space-y-2">
          <Label htmlFor="companyName">{tCompanies("upgrade.fields.companyName")}</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            minLength={2}
            maxLength={100}
            disabled={isLoading}
            placeholder={tCompanies("upgrade.placeholders.companyName")}
          />
        </div>

        {/* NIP */}
        <div className="space-y-2">
          <Label htmlFor="nip">{tCompanies("upgrade.fields.nip")}</Label>
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
            {tCompanies("upgrade.hints.nip")}
          </p>
          <NipValidationStatus
            status={nipStatus}
            validationResult={validationResult}
          />
        </div>

        {/* ADDRESS */}
        <div className="space-y-2">
          <Label htmlFor="address">{tCompanies("upgrade.fields.address")}</Label>
          <Input
            id="address"
            name="address"
            required
            minLength={5}
            maxLength={200}
            disabled={isLoading}
            placeholder={tCompanies("upgrade.placeholders.address")}
          />
        </div>

        {/* PHONE */}
        <div className="space-y-2">
          <Label htmlFor="phone">{tCompanies("upgrade.fields.phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            disabled={isLoading}
            placeholder={tCompanies("upgrade.placeholders.phone")}
          />
          <p className="text-xs text-muted-foreground">
            {tCompanies("upgrade.hints.phone")}
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
          {isLoading ? t("companySignup.submitting") : t("companySignup.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("companySignup.hasAccount")}{" "}
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          {t("signup.loginLink")}
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t("companySignup.userSignup")}{" "}
        <Link href={`/${locale}/signup`} className="text-primary hover:underline">
          {t("companySignup.userSignupLink")}
        </Link>
      </p>
    </div>
  )
}
