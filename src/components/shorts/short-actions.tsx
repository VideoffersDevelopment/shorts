"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublishDialog } from "./publish-dialog"
import { useTranslations } from "@/lib/i18n/client"

interface ShortActionsProps {
  shortId: string
  shortTitle: string
  companyVerified: boolean
  credits: number
  locale: string
}

/**
 * ShortActions - Action buttons for DRAFT shorts
 *
 * Displays:
 * - Publish button (opens PublishDialog)
 * - Edit button (link to edit page)
 */
export function ShortActions({
  shortId,
  shortTitle,
  companyVerified,
  credits,
  locale
}: ShortActionsProps) {
  const { t } = useTranslations("shorts")
  const [isPublishOpen, setIsPublishOpen] = useState(false)

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              onClick={() => setIsPublishOpen(true)}
            >
              {t("actions.publish")}
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/${locale}/panel/shorts/${shortId}/edit`}>
                {t("actions.edit")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PublishDialog
        shortId={shortId}
        shortTitle={shortTitle}
        companyVerified={companyVerified}
        credits={credits}
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onSuccess={() => setIsPublishOpen(false)}
        locale={locale}
      />
    </>
  )
}
