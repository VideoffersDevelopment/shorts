'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n/client'
import { verifyEmailAction } from '@/app/actions/auth/verify-email'

export default function VerifyEmailPage() {
  const { t } = useTranslations('auth')
  const searchParams = useSearchParams()
  const { locale } = useParams<{ locale: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    verifyEmailAction(token).then((result) => {
      if (result.error) {
        setStatus('error')
      } else {
        setStatus('success')
      }
    })
  }, [searchParams])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('verifyEmail.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'loading' && (
          <div className="text-center text-muted-foreground">
            {t('verifyEmail.verifying')}
          </div>
        )}

        {status === 'success' && (
          <>
            <Alert>
              <div className="font-medium">{t('verifyEmail.success')}</div>
            </Alert>
            <div className="text-center">
              <Button asChild>
                <Link href={`/${locale}/login`}>{t('verifyEmail.loginNow')}</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert variant="destructive">
              <div className="font-medium">{t('verifyEmail.error')}</div>
            </Alert>
            <div className="text-center">
              <Button asChild variant="outline">
                <Link href={`/${locale}/signup`}>{t('login.signupLink')}</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
