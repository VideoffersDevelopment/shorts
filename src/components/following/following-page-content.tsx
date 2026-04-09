"use client"

import { useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, Building2, Users, Video, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { FollowButton } from "@/components/companies/follow-button"
import { cn } from "@/lib/utils"
import type { FollowingListResponse, FollowedCompany } from "@/lib/types/interactions"

interface FollowingPageTranslations {
  title: string
  follow: string
  following: string
  unfollow: string
  loginRequired: string
  followers: string
  shorts: string
  verified: string
  emptyTitle: string
  emptyDescription: string
  loading: string
  error: string
}

interface FollowingPageContentProps {
  locale: string
  translations: FollowingPageTranslations
}

async function fetchFollowing(): Promise<FollowedCompany[]> {
  const response = await fetch("/api/users/me/following")

  if (!response.ok) {
    throw new Error("Failed to fetch following list")
  }

  const data: FollowingListResponse = await response.json()
  return data.companies
}

export function FollowingPageContent({
  locale,
  translations: t,
}: FollowingPageContentProps) {
  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["following"],
    queryFn: fetchFollowing,
  })

  const followButtonTranslations = useCallback(() => ({
    follow: t.follow,
    following: t.following,
    unfollow: t.unfollow,
    loginRequired: t.loginRequired,
  }), [t.follow, t.following, t.unfollow, t.loginRequired])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t.loading}</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t.error}</p>
        </div>
      </div>
    )
  }

  const hasCompanies = companies && companies.length > 0

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      {!hasCompanies ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">
            {t.emptyTitle}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground/70">
            {t.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              locale={locale}
              translations={t}
              followButtonTranslations={followButtonTranslations()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CompanyCardProps {
  company: FollowedCompany
  locale: string
  translations: FollowingPageTranslations
  followButtonTranslations: {
    follow: string
    following: string
    unfollow: string
    loginRequired: string
  }
}

function CompanyCard({
  company,
  locale,
  translations: t,
  followButtonTranslations,
}: CompanyCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/${locale}/companies/${company.slug}`}
            className="shrink-0"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={company.companyName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/${locale}/companies/${company.slug}`}
              className="group"
            >
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-semibold text-sm group-hover:underline">
                  {company.companyName}
                </h3>
                {company.viesVerified && (
                  <BadgeCheck
                    className={cn(
                      "h-4 w-4 shrink-0 text-green-500"
                    )}
                    aria-label={t.verified}
                  />
                )}
              </div>
            </Link>

            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.followersCount} {t.followers}
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                {company.shortsCount} {t.shorts}
              </span>
            </div>
          </div>

          <FollowButton
            companyId={company.id}
            initialFollowing={true}
            initialFollowersCount={company.followersCount}
            isAuthenticated={true}
            translations={followButtonTranslations}
            className="shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
