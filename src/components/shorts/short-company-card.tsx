"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, ExternalLink } from "lucide-react"
import type { Category, CompanyProfile } from "@prisma/client"

type CompanyWithCategory = Pick<CompanyProfile, "id" | "companyName" | "slug" | "logo" | "city" | "categoryId"> & {
  category: Pick<Category, "id" | "name" | "slug"> | null
}

interface ShortCompanyCardProps {
  company: CompanyWithCategory
  locale: string
  viewProfileLabel: string
}

export function ShortCompanyCard({
  company,
  locale,
  viewProfileLabel
}: ShortCompanyCardProps) {
  const profileUrl = `/${locale}/companies/${company.slug}`

  return (
    <Card className="company-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.companyName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{company.companyName}</h3>

            {/* Category */}
            {company.category && (
              <p className="text-sm text-muted-foreground truncate">
                {company.category.name}
              </p>
            )}

            {/* City */}
            {company.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{company.city}</span>
              </p>
            )}
          </div>
        </div>

        {/* View profile button */}
        <Button
          asChild
          variant="outline"
          className="w-full mt-4"
        >
          <Link href={profileUrl}>
            {viewProfileLabel}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
