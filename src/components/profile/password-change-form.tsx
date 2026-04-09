"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordChangeSchema, type PasswordChangeInput } from '@/lib/validation'
import { changePasswordAction } from '@/app/actions/profile/change-password'
import { useTranslations } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function PasswordChangeForm() {
  const { t } = useTranslations('settings')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const onSubmit = useCallback(async (data: PasswordChangeInput) => {
    setLoading(true)

    const result = await changePasswordAction(data)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      toast.success(t('password.success'))
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }, [router, t])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t('password.current')}</Label>
        <Input
          id="currentPassword"
          type="password"
          {...form.register('currentPassword')}
          disabled={loading}
        />
        {form.formState.errors.currentPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('password.new')}</Label>
        <Input
          id="newPassword"
          type="password"
          {...form.register('newPassword')}
          disabled={loading}
        />
        {form.formState.errors.newPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('password.confirm')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...form.register('confirmPassword')}
          disabled={loading}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '...' : t('password.submit')}
      </Button>
    </form>
  )
}
