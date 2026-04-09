'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n/client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { resetPasswordAction } from '@/app/actions/auth/reset-password'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslations('auth')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' }
  })

  const onSubmit = useCallback(async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setError(null)

    const result = await resetPasswordAction(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push('/login')
  }, [router])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="password">{t('resetPassword.password')}</Label>
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...form.register('confirmPassword')}
          disabled={isLoading}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '...' : t('resetPassword.submit')}
      </Button>
    </form>
  )
}
