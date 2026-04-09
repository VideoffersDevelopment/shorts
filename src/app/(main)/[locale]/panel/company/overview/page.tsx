import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { CompanyOwnerProfile } from '@/components/companies/company-owner-profile'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function CompanyOverviewPage({ params }: PageProps) {
  const { locale } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Load company profile with category
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      category: true
    }
  })

  // If no company profile exists, redirect to upgrade page
  if (!companyProfile) {
    redirect(`/${locale}/settings/upgrade`)
  }

  const t = await getTranslations('companies')

  // TODO: In the future, fetch real stats from analytics
  const mockStats = {
    viewsThisWeek: 0,
    viewsChange: 0,
    activeCampaigns: 0,
    walletBalance: 0
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('profile.overview.title')}</h1>
      </div>

      <CompanyOwnerProfile
        company={companyProfile}
        stats={mockStats}
        locale={locale}
      />
    </div>
  )
}
