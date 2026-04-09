"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n/client"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { CompanyStatus } from "@prisma/client"

interface AddShortButtonProps {
  userRole: string
  companyStatus: CompanyStatus | null
  locale: string
}

/**
 * AddShortButton - Navbar button for adding shorts
 *
 * Behavior:
 * - COMPANY role + ACTIVE status → Direct link to upload wizard
 * - COMPANY role + PENDING status → Dialog: "Wait for verification"
 * - Other roles → Dialog: "Upgrade to company account"
 */
export function AddShortButton({
  userRole,
  companyStatus,
  locale
}: AddShortButtonProps) {
  const { t } = useTranslations("shorts")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isCompany = userRole === "COMPANY"
  const isActive = companyStatus === "ACTIVE"
  const isPending = companyStatus === "PENDING"

  // For active company users, just render a link
  if (isCompany && isActive) {
    return (
      <Link href={`/${locale}/panel/shorts/new`}>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("addShort.button")}</span>
        </Button>
      </Link>
    )
  }

  // For pending company or non-company users, render button with dialog
  return (
    <>
      <Button
        size="sm"
        className="gap-2"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t("addShort.button")}</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isPending
                ? t("addShort.pendingTitle")
                : t("addShort.upgradeTitle")}
            </DialogTitle>
            <DialogDescription>
              {isPending
                ? t("addShort.pendingDescription")
                : t("addShort.upgradeDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {isPending ? (
              <Button onClick={() => setIsDialogOpen(false)}>
                {t("addShort.pendingAction")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t("addShort.cancel")}
                </Button>
                <Link href={`/${locale}/settings/upgrade`}>
                  <Button>{t("addShort.upgradeAction")}</Button>
                </Link>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
