import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { FollowingPageContent } from "@/components/following/following-page-content"

interface FollowingPageProps {
  params: Promise<{ locale: string }>
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations("following")

  const translations = {
    title: t("title"),
    follow: t("follow"),
    following: t("following"),
    unfollow: t("unfollow"),
    loginRequired: t("loginRequired"),
    followers: t("followers"),
    shorts: t("shorts"),
    verified: t("verified"),
    emptyTitle: t("empty.title"),
    emptyDescription: t("empty.description"),
    loading: t("loading"),
    error: t("error"),
  }

  return <FollowingPageContent locale={locale} translations={translations} />
}
