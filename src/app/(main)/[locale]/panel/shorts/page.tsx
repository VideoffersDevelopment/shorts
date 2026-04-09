import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShortsManagement } from "@/components/shorts/shorts-management"
import { getWalletBalance } from "@/lib/wallet/wallet-service"

interface ShortsPageProps {
  params: Promise<{ locale: string }>
}

export default async function ShortsPage({ params }: ShortsPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Check if user is a company
  if (session.user.role !== "COMPANY") {
    redirect(`/${locale}/panel`)
  }

  const t = await getTranslations("shorts")

  // Get company profile
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, viesVerified: true, status: true }
  })

  if (!companyProfile) {
    redirect(`/${locale}/panel`)
  }

  // Get user credits
  const wallet = await getWalletBalance(session.user.id)

  // Fetch shorts for this company
  const shorts = await prisma.short.findMany({
    where: {
      companyId: companyProfile.id,
      status: { not: "DELETED" }
    },
    include: {
      category: true,
      stats: true,
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("meta.title")}</h1>
          <p className="text-muted-foreground">{t("meta.description")}</p>
        </div>
        <Link href={`/${locale}/panel/shorts/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("list.empty.action")}
          </Button>
        </Link>
      </div>

      {companyProfile.status !== "ACTIVE" && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("verification.pendingTitle")}</AlertTitle>
          <AlertDescription>{t("verification.pendingDescription")}</AlertDescription>
        </Alert>
      )}

      <ShortsManagement
        initialShorts={shorts}
        companyVerified={companyProfile.viesVerified}
        credits={wallet.total}
        locale={locale}
      />
    </div>
  )
}
