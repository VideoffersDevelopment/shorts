"use client"

import Image from 'next/image'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle2, MapPin, Globe, Facebook, Instagram, Linkedin, Youtube, Flag } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/client'
import { sanitizeUrl } from '@/lib/utils/url'
import { CompanyContactButton } from './company-contact-button'
import { ProtectedPhoneButton } from './protected-phone-button'
import { BusinessHoursModal } from './business-hours-modal'
import { LocationMapModal } from './location-map-modal'
import { type BusinessHours } from './business-hours-picker'

interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

interface CompanyProfileHeaderProps {
  companyId: string
  companyName: string
  slug: string
  logo: string | null
  banner: string | null
  categoryName: string | null
  viesVerified: boolean
  // Address
  street: string | null
  postalCode: string | null
  city: string | null
  // Contact
  phone: string | null
  website: string | null
  socialLinks: SocialLinks | null
  // Business hours & location
  businessHours: BusinessHours | null
  latitude: number | null
  longitude: number | null
  // Options
  showContactButton?: boolean
  isOwner?: boolean
  locale?: string
}

// TikTok icon - not available in lucide-react
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const socialConfig = [
  { key: 'facebook' as const, icon: Facebook, label: 'Facebook', hoverClass: 'hover:text-blue-400' },
  { key: 'instagram' as const, icon: Instagram, label: 'Instagram', hoverClass: 'hover:text-pink-400' },
  { key: 'tiktok' as const, icon: TikTokIcon, label: 'TikTok', hoverClass: 'hover:text-white' },
  { key: 'youtube' as const, icon: Youtube, label: 'YouTube', hoverClass: 'hover:text-red-400' },
  { key: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn', hoverClass: 'hover:text-blue-400' },
]

export function CompanyProfileHeader({
  companyId,
  companyName,
  slug,
  logo,
  banner,
  categoryName,
  viesVerified,
  street,
  postalCode,
  city,
  phone,
  website,
  socialLinks,
  businessHours,
  latitude,
  longitude,
  showContactButton = true,
  isOwner = false,
  locale = 'pl'
}: CompanyProfileHeaderProps) {
  const { t } = useTranslations('companies')
  const safeBanner = sanitizeUrl(banner)
  const safeWebsite = sanitizeUrl(website)

  // Build address string
  const addressParts = [street, postalCode, city].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  // Get active social links
  const activeSocials = socialLinks
    ? socialConfig.filter((social) => socialLinks[social.key] && sanitizeUrl(socialLinks[social.key] ?? null))
    : []

  const hasSocialsOrWebsite = activeSocials.length > 0 || safeWebsite
  const hasLocation = latitude !== null && longitude !== null
  const hasBusinessHours = businessHours && Object.values(businessHours).some(h => h !== null && h !== undefined)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        {/* Banner with overlay content */}
        <div
          className="relative h-56 md:h-72 w-full overflow-hidden rounded-xl"
          style={!safeBanner ? {
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 50%, hsl(var(--muted)) 100%)'
          } : undefined}
        >
          {/* Banner image */}
          {safeBanner && (
            <>
              <Image
                src={safeBanner}
                alt={companyName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
              {/* Darker overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </>
          )}

          {/* Verified badge - top left */}
          {viesVerified && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="secondary" className="gap-1 bg-green-500/90 text-white border-0 shadow-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('profile.verified')}
              </Badge>
            </div>
          )}

          {/* Desktop: Social links + Website (row 1) + Contact with phone (row 2) - top right */}
          {!isOwner && (
            <div className="hidden md:flex absolute top-4 right-4 z-10 flex-col items-end gap-2">
              {/* Row 1: Social & Website */}
              {hasSocialsOrWebsite && (
                <div className="flex items-center gap-3">
                  {/* Website */}
                  {safeWebsite && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={safeWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white transition-colors"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="text-xs">{t('profile.contact.website')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Social links */}
                  {activeSocials.map((social) => {
                    const url = sanitizeUrl(socialLinks![social.key] ?? null)
                    if (!url) return null
                    const Icon = social.icon

                    return (
                      <Tooltip key={social.key}>
                        <TooltipTrigger asChild>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-white/80 transition-colors ${social.hoverClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <span className="text-xs">{social.label}</span>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )}

              {/* Row 2: Phone + Contact button */}
              {showContactButton && (
                <div className="flex items-center gap-2">
                  {phone && (
                    <ProtectedPhoneButton phone={phone} variant="banner" />
                  )}
                  <CompanyContactButton
                    companyId={companyId}
                    companyName={companyName}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                  />
                </div>
              )}
            </div>
          )}


          {/* Action buttons - bottom right on banner (higher z-index to be clickable) */}
          {!isOwner && (
            <div className="hidden md:flex absolute bottom-4 right-4 z-20 items-center gap-2">
              {/* Business Hours */}
              {hasBusinessHours && (
                <BusinessHoursModal hours={businessHours!} variant="banner" />
              )}

              {/* Location */}
              {hasLocation && (
                <LocationMapModal
                  latitude={latitude!}
                  longitude={longitude!}
                  companyName={companyName}
                  address={fullAddress}
                  variant="banner"
                />
              )}

              {/* Report - opens modal with options */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-xs">{t('header.report')}</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Main content - bottom left on banner */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-white shadow-xl shrink-0">
                <AvatarImage src={logo || undefined} alt={companyName} />
                <AvatarFallback className="text-2xl md:text-3xl font-bold bg-background">
                  {companyName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name + Category + Address */}
              <div className="flex flex-col gap-1 min-w-0 pb-1">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white drop-shadow-lg truncate">
                  {companyName}
                </h1>

                {categoryName && (
                  <p className="text-white/80 text-sm md:text-base drop-shadow truncate">
                    {categoryName}
                  </p>
                )}

                {fullAddress && (
                  <div className="flex items-center gap-1.5 text-white/70 text-sm drop-shadow">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{fullAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Social links + Website + Contact - below banner */}
        {!isOwner && (
          <div className="md:hidden space-y-3 px-1">
            {/* Row 1: Social media + website */}
            {hasSocialsOrWebsite && (
              <div className="flex items-center gap-4">
                {/* Website */}
                {safeWebsite && (
                  <a
                    href={safeWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}

                {/* Social links */}
                {activeSocials.map((social) => {
                  const url = sanitizeUrl(socialLinks![social.key] ?? null)
                  if (!url) return null
                  const Icon = social.icon

                  return (
                    <a
                      key={social.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
            )}

            {/* Row 2: Phone + Contact button */}
            {showContactButton && (
              <div className="flex items-center justify-between gap-3">
                {phone && (
                  <ProtectedPhoneButton phone={phone} />
                )}
                <CompanyContactButton
                  companyId={companyId}
                  companyName={companyName}
                />
              </div>
            )}

            {/* Row 3: Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              {hasBusinessHours && (
                <BusinessHoursModal hours={businessHours!} variant="default" />
              )}
              {hasLocation && (
                <LocationMapModal
                  latitude={latitude!}
                  longitude={longitude!}
                  companyName={companyName}
                  address={fullAddress}
                  variant="default"
                />
              )}
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                {t('header.reportCompany')}
              </Button>
            </div>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
