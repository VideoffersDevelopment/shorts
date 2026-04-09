'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useTranslations } from '@/lib/i18n/client'

export default function ResetPasswordPage() {
  const { t } = useTranslations('auth')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('resetPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <div className="font-medium">{t('resetPassword.error')}</div>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('resetPassword.title')}</CardTitle>
        <CardDescription className="text-center">
          VideoShorts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  )
}
