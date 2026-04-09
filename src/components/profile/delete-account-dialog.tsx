"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { deleteAccountSchema } from '@/lib/validation'
import { deleteAccountAction } from '@/app/actions/profile/delete-account'
import { useTranslations } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'

export function DeleteAccountDialog() {
  const { t } = useTranslations('settings')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: '' }
  })

  const onSubmit = useCallback(async (data: { confirmation: string }) => {
    setLoading(true)

    const result = await deleteAccountAction(data)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      // Redirect to login
      router.push('/login')
    }
  }, [router])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }, [form])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">{t('account.deleteAccount')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete.title')}</DialogTitle>
          <DialogDescription>{t('delete.warning')}</DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <p className="text-sm">{t('delete.warning')}</p>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">{t('delete.confirm')}</Label>
            <Input
              id="confirmation"
              {...form.register('confirmation')}
              placeholder="DELETE"
              disabled={loading}
            />
            {form.formState.errors.confirmation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="destructive" disabled={loading} className="w-full">
            {loading ? '...' : t('delete.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
