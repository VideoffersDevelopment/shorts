import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompanyUpgradeForm } from '@/components/companies/company-upgrade-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

interface CompanySignupCompletePageProps {
  params: Promise<{ locale: string }>
}

/**
 * Page for completing company registration after OAuth signup.
 * User has authenticated via Google/Facebook and now needs to provide company details.
 */
export default async function CompanySignupCompletePage({ params }: CompanySignupCompletePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })

  // Check if user is authenticated (should be after OAuth)
  const session = await auth()
  if (!session?.user?.id) {
    // Not authenticated - redirect to company signup
    redirect(`/${locale}/signup/company`)
  }

  // Check if user already has a company profile
  const existingCompany = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (existingCompany) {
    // Already has company - redirect to company profile
    redirect(`/${locale}/panel/company/profile`)
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('companySignup.complete.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('companySignup.complete.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanyUpgradeForm />
      </CardContent>
    </Card>
  )
}
