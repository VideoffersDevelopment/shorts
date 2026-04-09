'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n/client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { OAuthButtons } from './oauth-buttons'
import { loginAction } from '@/app/actions/auth/login'

export function LoginForm() {
  const { t } = useTranslations('auth')
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check for blocked user redirect from middleware
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'blocked') {
      setError(t('login.errors.accountBlocked'))
    }
  }, [searchParams, t])

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = useCallback(async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    // Use server action to get proper error codes (bypasses NextAuth v5 CallbackRouteError issue)
    const result = await loginAction(data.email, data.password)

    if (!result.success) {
      switch (result.error) {
        case 'EMAIL_NOT_VERIFIED':
          setError(t('login.errors.emailNotVerified'))
          break
        case 'USER_BLOCKED':
          setError(t('login.errors.accountBlocked'))
          break
        case 'INVALID_CREDENTIALS':
        default:
          setError(t('login.errors.invalidCredentials'))
          break
      }
      setIsLoading(false)
      return
    }

    router.push(`/${locale}/panel`)
    router.refresh() // Refresh to update session state
  }, [router, t, locale])

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
          <Label htmlFor="email">{t('login.email')}</Label>
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
          <Label htmlFor="password">{t('login.password')}</Label>
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
          {isLoading ? '...' : t('login.submit')}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href={`/${locale}/forgot-password`} className="text-primary hover:underline">
          {t('login.forgotPassword')}
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link href={`/${locale}/signup`} className="text-primary hover:underline">
          {t('login.signupLink')}
        </Link>
      </p>
    </div>
  )
}
