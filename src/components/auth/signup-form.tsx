'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n/client'
import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { OAuthButtons } from './oauth-buttons'
import { signupAction } from '@/app/actions/auth/signup'

export function SignupForm() {
  const { t } = useTranslations('auth')
  const { locale } = useParams<{ locale: string }>()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = useCallback(async (data: SignupInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const result = await signupAction(data)

    if (result.error) {
      // Map error codes to translated messages
      if (result.error === 'ACCOUNT_BLOCKED') {
        setError(t('signup.errors.accountBlocked'))
      } else if (result.error === 'EMAIL_EXISTS') {
        setError(t('signup.errors.emailExists'))
      } else {
        setError(result.error)
      }
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
          <div className="font-medium">{t('signup.success')}</div>
        </Alert>
        <p className="text-center text-sm text-muted-foreground">
          {t('signup.hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-primary hover:underline">
            {t('signup.loginLink')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OAuthButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('login.orContinueWith')}
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="email">{t('signup.email')}</Label>
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

        <div className="space-y-2">
          <Label htmlFor="password">{t('signup.password')}</Label>
          <Input
            id="password"
            type="password"
            {...form.register('password')}
            disabled={isLoading}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '...' : t('signup.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('signup.hasAccount')}{' '}
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          {t('signup.loginLink')}
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t('signup.companySignup')}{' '}
        <Link href={`/${locale}/signup/company`} className="text-primary hover:underline">
          {t('signup.companySignupLink')}
        </Link>
      </p>
    </div>
  )
}
