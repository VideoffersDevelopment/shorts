'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { emailSchema, type EmailInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n/client'
import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { forgotPasswordAction } from '@/app/actions/auth/forgot-password'

export function ForgotPasswordForm() {
  const { t } = useTranslations('auth')
  const { locale } = useParams<{ locale: string }>()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  })

  const onSubmit = useCallback(async (data: EmailInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const result = await forgotPasswordAction(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    form.reset()
  }, [form])

  if (success) {
    return (
      <div className="space-y-4">
        <Alert>
          <div className="font-medium">{t('forgotPassword.success')}</div>
        </Alert>
        <div className="text-center">
          <Link href={`/${locale}/login`} className="text-sm text-primary hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="email">{t('forgotPassword.email')}</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          disabled={isLoading}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '...' : t('forgotPassword.submit')}
      </Button>

      <div className="text-center">
        <Link href={`/${locale}/login`} className="text-sm text-primary hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    </form>
  )
}
