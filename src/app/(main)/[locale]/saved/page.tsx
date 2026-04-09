import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Bookmark } from "lucide-react"

interface SavedPageProps {
  params: Promise<{ locale: string }>
}

export default async function SavedPage({ params }: SavedPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations("sidebar")

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">{t("saved")}</h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bookmark className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t("savedEmpty")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground/70">
          {t("savedEmptyDescription")}
        </p>
      </div>
    </div>
  )
}
