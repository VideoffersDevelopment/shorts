import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { CompanyProfileForm } from '@/components/companies/company-profile-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { locale } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Load company profile with category
  // Note: We check DB directly instead of session.user.role to avoid
  // race conditions when role was just updated (JWT may be stale)
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

  // Load enabled categories with children
  const categories = await prisma.category.findMany({
    where: {
      enabled: true,
      parentId: null
    },
    include: {
      children: {
        where: { enabled: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  })

  const t = await getTranslations('companies')

  return (
    <div className="container max-w-3xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('profile.edit.title')}</h1>
        </div>

        {companyProfile.status === "PENDING" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>{t('status.pendingTitle')}</AlertTitle>
            <AlertDescription>{t('status.pendingDescription')}</AlertDescription>
          </Alert>
        )}

        <CompanyProfileForm profile={companyProfile} categories={categories} />
      </div>
    </div>
  )
}
