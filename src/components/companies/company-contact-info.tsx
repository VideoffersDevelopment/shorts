"use client"

import { MapPin, Globe, Phone } from 'lucide-react'
import { sanitizeUrl, getHostname } from '@/lib/utils/url'
import { CompanyContactButton } from './company-contact-button'

interface CompanyContactInfoProps {
  companyId: string
  companyName: string
  street: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  website: string | null
  showContactButton?: boolean
  className?: string
}

export function CompanyContactInfo({
  companyId,
  companyName,
  street,
  postalCode,
  city,
  phone,
  website,
  showContactButton = true,
  className
}: CompanyContactInfoProps) {
  const safeWebsite = sanitizeUrl(website)
  const hasAddress = street || city
  const hasAnyContact = hasAddress || phone || safeWebsite

  if (!hasAnyContact && !showContactButton) return null

  const addressParts = [street, postalCode, city].filter(Boolean)
  const fullAddress = addressParts.join(', ')

  return (
    <div className={className ?? "flex flex-col gap-3"}>
      {/* Address */}
      {hasAddress && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <span>{fullAddress}</span>
        </div>
      )}

      {/* Phone */}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
        >
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{phone}</span>
        </a>
      )}

      {/* Website */}
      {safeWebsite && (
        <a
          href={safeWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>{getHostname(safeWebsite)}</span>
        </a>
      )}

      {/* Contact Button */}
      {showContactButton && (
        <CompanyContactButton
          companyId={companyId}
          companyName={companyName}
          className="mt-2 w-fit"
        />
      )}
    </div>
  )
}
