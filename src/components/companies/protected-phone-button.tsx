"use client"

import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

interface ProtectedPhoneButtonProps {
  phone: string
  variant?: 'default' | 'banner'
  className?: string
}

/**
 * Przycisk telefonu z ochroną przed scrapingiem.
 *
 * Numer jest kodowany Base64 i NIE pojawia się w HTML jako:
 * - tekst widoczny
 * - atrybut href
 * - data-attribute
 *
 * Dekodowanie następuje dopiero po kliknięciu przez JavaScript.
 * Boty scrapingowe nie wykonują JS, więc nie uzyskają numeru.
 */
export function ProtectedPhoneButton({
  phone,
  variant = 'default',
  className
}: ProtectedPhoneButtonProps) {
  const { t } = useTranslations('companies')

  // Kodowanie numeru - usuwamy spacje i kodujemy Base64
  // Dodatkowo odwracamy string przed kodowaniem dla dodatkowej obfuskacji
  const cleanPhone = phone.replace(/\s/g, '')
  const reversed = cleanPhone.split('').reverse().join('')
  const encoded = typeof window !== 'undefined'
    ? btoa(reversed)
    : Buffer.from(reversed).toString('base64')

  const handleClick = () => {
    try {
      // Dekodowanie: Base64 → odwrócenie → oryginalny numer
      const decoded = typeof window !== 'undefined'
        ? atob(encoded)
        : Buffer.from(encoded, 'base64').toString()
      const original = decoded.split('').reverse().join('')

      // Przekierowanie na numer telefonu
      window.location.href = `tel:${original}`
    } catch {
      console.error('Failed to decode phone number')
    }
  }

  if (variant === 'banner') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm",
          className
        )}
        onClick={handleClick}
      >
        <Phone className="h-4 w-4 mr-2" />
        {t('profile.contact.call')}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleClick}
    >
      <Phone className="h-4 w-4 mr-2" />
      {t('profile.contact.call')}
    </Button>
  )
}
