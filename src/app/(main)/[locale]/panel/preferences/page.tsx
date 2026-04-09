import * as React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getText } from "@/lib/i18n/server"
import { type Locale } from "@/lib/i18n/config"
import { PreferencesForm } from "@/components/profile/preferences-form"

interface PreferencesPageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function PreferencesPage({ params }: PreferencesPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const title = await getText("title", "preferences", locale)

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      <PreferencesForm locale={locale} />
    </div>
  )
}
