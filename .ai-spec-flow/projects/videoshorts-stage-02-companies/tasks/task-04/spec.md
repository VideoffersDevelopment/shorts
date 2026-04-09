# Task 04: Public Company Profile

## Overview

**Priority:** HIGH
**Dependencies:** task-03
**Complexity:** Medium (10 files, ~10k tokens)
**Status:** pending

## What to Build

Create the public-facing company profile page visible at `/companies/[slug]`. This page displays company information, logo, banner, description, and serves as the landing page for company discovery.

SEO optimization is critical for this page.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(main)/[locale]/companies/[slug]/page.tsx` | Create | Public company profile page |
| `src/components/companies/company-profile-card.tsx` | Create | Company profile display component |
| `src/components/companies/company-info-section.tsx` | Create | Company info section |
| `src/components/companies/company-stats.tsx` | Create | Company statistics display |

## Files to Modify

| File | Changes |
|------|---------|
| None | All new files |

## Public Profile Page

```typescript
// src/app/(main)/[locale]/companies/[slug]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyProfileCard } from "@/components/companies/company-profile-card"

interface PageProps {
  params: { locale: string; slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const company = await prisma.companyProfile.findUnique({
    where: { slug: params.slug }
  })

  if (!company) return {}

  return {
    title: `${company.companyName} | VideoShorts`,
    description: company.description?.substring(0, 160) || "",
    openGraph: {
      title: company.companyName,
      description: company.description || "",
      images: [company.banner || company.logo || ""]
    }
  }
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const company = await prisma.companyProfile.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      user: {
        select: { email: true }
      }
    }
  })

  if (!company) {
    notFound()
  }

  const t = await getTranslations("companies")

  return (
    <div className="container py-8">
      <CompanyProfileCard company={company} />
    </div>
  )
}
```

## Company Profile Card Component

```typescript
// src/components/companies/company-profile-card.tsx
"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, MapPin, Globe, Facebook, Instagram } from "lucide-react"
import { useTranslations } from "next-intl"
import ReactMarkdown from "react-markdown"

interface CompanyProfileCardProps {
  company: {
    companyName: string
    slug: string
    logo?: string | null
    banner?: string | null
    description?: string | null
    viesVerified: boolean
    website?: string | null
    address?: string | null
    phone?: string | null
    socialLinks?: any
    category?: {
      name: string
      slug: string
    } | null
    createdAt: Date
  }
}

export function CompanyProfileCard({ company }: CompanyProfileCardProps) {
  const t = useTranslations("companies")

  return (
    <div className="space-y-6">
      {/* Banner */}
      {company.banner && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg">
          <img
            src={company.banner}
            alt={company.companyName}
            className="h-full w-full object-cover"
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
            {company.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.address}
              </div>
            )}

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Globe className="h-4 w-4" />
                {new URL(company.website).hostname}
              </a>
            )}
          </div>

          {/* Social Links */}
          {company.socialLinks && (
            <div className="mt-3 flex gap-3">
              {company.socialLinks.facebook && (
                <a
                  href={company.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {company.socialLinks.instagram && (
                <a
                  href={company.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
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
            <ReactMarkdown>{company.description}</ReactMarkdown>
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
```

## Acceptance Criteria

- [ ] Public profile accessible at `/companies/[slug]`
- [ ] Company name, logo, banner displayed
- [ ] VIES verified badge shown if `viesVerified: true`
- [ ] Category displayed
- [ ] Description rendered as markdown
- [ ] Contact info (address, website) displayed
- [ ] Social links (Facebook, Instagram) working
- [ ] Stats placeholder shows 0/0/0
- [ ] 404 page if slug not found
- [ ] SEO meta tags generated
- [ ] OpenGraph image uses banner or logo
- [ ] Mobile responsive layout
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test company: Create via upgrade flow (task-03)

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to company profile | Page loads | `/companies/{slug}` |
| 2 | Verify banner | Banner image visible (if exists) | `img[alt="${companyName}"]` |
| 3 | Verify logo | Logo avatar visible | `.avatar` |
| 4 | Verify verified badge | Badge shows "Verified" | `.badge:has-text("Verified")` |
| 5 | Verify description | Markdown rendered correctly | `.prose` |
| 6 | Verify social links | Facebook/Instagram icons clickable | `a[href*="facebook.com"]` |
| 7 | Verify stats | Shows 0/0/0 | `.grid` with stats |
| 8 | Test 404 | Invalid slug shows 404 | `/companies/invalid-slug-123` |

### Screenshot Checkpoints
- `01-profile-with-banner.png` - Full profile with banner
- `02-profile-no-banner.png` - Profile without banner
- `03-verified-badge.png` - Verified badge visible
- `04-mobile-view.png` - Mobile responsive layout

## Notes

- **SEO Critical:** Meta tags, OpenGraph, structured data
- **Markdown Rendering:** Use `react-markdown` for description
- **Placeholder Stats:** Will be populated in Stage 03 (shorts)
- **Social Links:** Optional, only show if present
- **Responsive:** Mobile-first design
