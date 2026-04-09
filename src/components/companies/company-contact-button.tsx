"use client"

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n/client'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface CompanyContactButtonProps {
  companyId: string
  companyName: string
  className?: string
}

export function CompanyContactButton({
  companyId,
  companyName,
  className
}: CompanyContactButtonProps) {
  const { t } = useTranslations('companies')
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error(t('contact.errors.emptyMessage'))
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement contact form action
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(t('contact.success'))
      setOpen(false)
      setSubject('')
      setMessage('')
    } catch {
      toast.error(t('contact.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Mail className="h-4 w-4 mr-2" />
          {t('contact.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('contact.title')}</DialogTitle>
          <DialogDescription>
            {t('contact.description', { companyName })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">{t('contact.fields.subject')}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('contact.placeholders.subject')}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="message">{t('contact.fields.message')}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('contact.placeholders.message')}
              rows={5}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t('contact.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('contact.sending')}
                </>
              ) : (
                t('contact.send')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
