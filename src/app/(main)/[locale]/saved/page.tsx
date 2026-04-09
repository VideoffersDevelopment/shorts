import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { VideoGrid, sampleVideos } from "@/components/home/video-grid"

interface SavedPageProps {
  params: Promise<{ locale: string }>
}

export default async function SavedPage({ params }: SavedPageProps) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations("sidebar")

  const isLoggedIn = !!session?.user

  const content = (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("saved")}</h1>
      <VideoGrid videos={sampleVideos} />
    </div>
  )

  // Logged-in users: layout already has Header/Sidebar/Footer
  if (isLoggedIn) {
    return content
  }

  // Guest users: wrap with Header/Footer
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-6">
        {content}
      </main>
      <Footer locale={locale} />
    </div>
  )
}
