"use client"

import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, MapPin, Globe, Facebook, Instagram, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import ReactMarkdown from "react-markdown"

import { type Prisma } from "@prisma/client"
import { sanitizeUrl, getHostname } from "@/lib/utils/url"
import { BusinessHoursDisplay } from "./business-hours-display"
import { type BusinessHours } from "./business-hours-picker"

interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

interface CompanyProfileCardProps {
  company: {
    companyName: string
    slug: string
    logo: string | null
    banner: string | null
    description: string | null
    viesVerified: boolean
    website: string | null
    street: string | null
    postalCode: string | null
    city: string | null
    phone: string | null
    socialLinks: Prisma.JsonValue
    businessHours: Prisma.JsonValue
    category: {
      name: string
      slug: string
    } | null
    createdAt: Date
  }
}

export function CompanyProfileCard({ company }: CompanyProfileCardProps) {
  const t = useTranslations("companies")

  const socialLinks = company.socialLinks as SocialLinks | null
  const businessHours = company.businessHours as BusinessHours | null

  // Sanitize all URLs
  const safeBanner = sanitizeUrl(company.banner)
  const safeWebsite = sanitizeUrl(company.website)
  const safeFacebook = sanitizeUrl(socialLinks?.facebook ?? null)
  const safeInstagram = sanitizeUrl(socialLinks?.instagram ?? null)

  return (
    <div className="space-y-6">
      {/* Banner */}
      {safeBanner && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg">
          <Image
            src={safeBanner}
            alt={company.companyName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Logo + Header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={company.logo || undefined} alt={company.companyName} />
          <AvatarFallback>{company.companyName[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{company.companyName}</h1>
            {company.viesVerified && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("profile.verified")}
              </Badge>
            )}
          </div>

          {company.category && (
            <p className="text-muted-foreground mt-1">
              {company.category.name}
            </p>
          )}

          {/* Contact Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {(company.street || company.city) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[company.street, company.postalCode, company.city].filter(Boolean).join(", ")}
              </div>
            )}

            {safeWebsite && (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Globe className="h-4 w-4" />
                {getHostname(safeWebsite)}
              </a>
            )}
          </div>

          {/* Social Links */}
          {(safeFacebook || safeInstagram) && (
            <div className="mt-3 flex gap-3">
              {safeFacebook && (
                <a
                  href={safeFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("social.facebook")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {safeInstagram && (
                <a
                  href={safeInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("social.instagram")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Description */}
      {company.description && (
        <Card>
          <CardContent className="prose dark:prose-invert max-w-none pt-6">
            <ReactMarkdown
              components={{
                script: () => null,
                iframe: () => null,
              }}
              disallowedElements={['script', 'iframe', 'object', 'embed']}
              unwrapDisallowed={true}
            >
              {company.description}
            </ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Business Hours */}
      {businessHours && Object.values(businessHours).some(h => h !== null && h !== undefined) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t("businessHours.title")}</h3>
            </div>
            <BusinessHoursDisplay hours={businessHours} />
          </CardContent>
        </Card>
      )}

      {/* Stats Placeholder */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{t("profile.stats.shorts")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{t("profile.stats.followers")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{t("profile.stats.views")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
