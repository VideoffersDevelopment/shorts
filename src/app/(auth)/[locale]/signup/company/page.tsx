import { CompanySignupForm } from '@/components/auth/company-signup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

interface CompanySignupPageProps {
  params: Promise<{ locale: string }>
}

export default async function CompanySignupPage({ params }: CompanySignupPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('companySignup.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('companySignup.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanySignupForm />
      </CardContent>
    </Card>
  )
}
