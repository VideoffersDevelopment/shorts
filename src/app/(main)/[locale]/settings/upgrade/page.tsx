import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyUpgradeForm } from "@/components/companies/company-upgrade-form"

export default async function UpgradeToCompanyPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { locale } = await params
  const { success } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  // Check if user already has company profile BEFORE rendering form
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })

  // CRITICAL: If success param is present, we're showing the success modal
  // In this case, we should NOT check alreadyHasCompany because:
  // 1. The user just completed upgrade
  // 2. They need to see the success confirmation
  // 3. They will click "Continue" to go to profile
  const successParam = success === "verified" || success === "pending" ? success : null

  // Only pass alreadyHasCompany if NOT showing success modal
  // This prevents the redirect logic in the form from triggering
  const alreadyHasCompany = successParam ? false : Boolean(existing || session.user.role === 'COMPANY')

  const t = await getTranslations("companies")

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("upgrade.heading")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("upgrade.description")}
        </p>
      </div>
      <CompanyUpgradeForm
        initialAlreadyCompany={alreadyHasCompany}
        initialSuccess={successParam}
      />
    </div>
  )
}
