import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const tSidebar = await getTranslations("sidebar")
  const t = await getTranslations("common")

  const userName = session.user?.name || session.user?.email || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{tSidebar("home")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcome", { name: userName })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">{t("dashboard.gettingStarted.title")}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t("dashboard.gettingStarted.description")}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">{t("dashboard.yourVideos.title")}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t("dashboard.yourVideos.empty")}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">{t("dashboard.statistics.title")}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t("dashboard.statistics.description")}
          </p>
        </div>
      </div>
    </div>
  )
}
