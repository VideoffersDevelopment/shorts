"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { useTranslations } from "@/lib/i18n/client"

interface AlreadyCompanyRedirectProps {
  locale: string
}

/**
 * Client component that redirects to company profile.
 * Used instead of server-side redirect to avoid infinite loop
 * when session is being updated after upgrade.
 */
export function AlreadyCompanyRedirect({ locale }: AlreadyCompanyRedirectProps) {
  const { t } = useTranslations("companies")

  useEffect(() => {
    // Use window.location for full page reload with fresh session
    window.location.href = `/${locale}/panel/company/profile`
  }, [locale])

  return (
    <div className="container max-w-2xl py-8">
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
    </div>
  )
}
