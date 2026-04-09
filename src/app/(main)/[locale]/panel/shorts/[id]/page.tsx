import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { isValidHttpUrl } from "@/lib/utils/url"
import Link from "next/link"
import { ArrowLeft, Eye, ThumbsUp, Share2, Clock, Calendar, Archive, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShortDetailPlayer } from "@/components/shorts/short-detail-player"
import { ShortActions } from "@/components/shorts/short-actions"
import { ProcessingStatusBar } from "@/components/shorts/processing-status-bar"
import type { ShortStatus } from "@prisma/client"
import { getWalletBalance } from "@/lib/wallet/wallet-service"

interface ShortDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

function getStatusVariant(status: ShortStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PUBLISHED":
      return "default"
    case "PROCESSING":
      return "secondary"
    case "DRAFT":
    case "PENDING_PAYMENT":
      return "outline"
    case "ARCHIVED":
      return "destructive"
    default:
      return "outline"
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

export default async function ShortDetailPage({ params }: ShortDetailPageProps) {
  const { locale, id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  if (session.user.role !== "COMPANY") {
    redirect(`/${locale}/panel`)
  }

  const t = await getTranslations("shorts")

  // Fetch company profile and user credits in parallel
  const [companyProfile, wallet] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, viesVerified: true }
    }),
    getWalletBalance(session.user.id)
  ])

  if (!companyProfile) {
    redirect(`/${locale}/panel`)
  }

  const short = await prisma.short.findFirst({
    where: {
      id,
      companyId: companyProfile.id
    },
    include: {
      category: true,
      stats: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!short) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/panel/shorts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detail.back")}
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(short.status)}>
            {t(`status.${short.status}`)}
          </Badge>

          {short.status !== "DELETED" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/panel/shorts/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Processing Status Bar - shows when short is being processed */}
      {(short.status === "PROCESSING" || short.processingError) && (
        <ProcessingStatusBar
          shortId={short.id}
          initialStatus={short.status}
          processingError={short.processingError}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video / Thumbnail Column */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <ShortDetailPlayer
                shortId={short.id}
                hlsPlaylistUrl={short.hlsPlaylistUrl}
                thumbnailUrl={short.thumbnailUrl}
                title={short.title}
                status={short.status}
                aspectRatio={(short.aspectRatio as "9:16" | "16:9") ?? "9:16"}
                processingText={t("detail.processing")}
                processingDescription={t("detail.processingDescription")}
              />
            </CardContent>
          </Card>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{short.title}</CardTitle>
              {short.description && (
                <CardDescription className="text-base">
                  {short.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <p className="text-sm text-muted-foreground">{t("detail.category")}</p>
                  <p className="font-medium">{short.category.name}</p>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm text-muted-foreground">{t("detail.duration")}</p>
                  <p className="font-medium">{formatDuration(short.duration)}</p>
                </div>

                {/* Tags */}
                {short.tags.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">{t("detail.tags")}</p>
                    <div className="flex flex-wrap gap-2">
                      {short.tags.map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Link */}
                {short.ctaLink && isValidHttpUrl(short.ctaLink) && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">{t("detail.ctaLink")}</p>
                    <a
                      href={short.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {short.ctaLink}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("detail.statistics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{short.stats?.views ?? 0}</p>
                    <p className="text-sm text-muted-foreground">{t("detail.views")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <ThumbsUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{short.stats?.likes ?? 0}</p>
                    <p className="text-sm text-muted-foreground">{t("detail.likes")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{short.stats?.ctaClicks ?? 0}</p>
                    <p className="text-sm text-muted-foreground">{t("detail.ctaClicks")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("detail.timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("detail.createdAt")}</p>
                    <p className="font-medium">{formatDate(short.createdAt, locale)}</p>
                  </div>
                </div>

                {short.publishedAt && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("detail.publishedAt")}</p>
                      <p className="font-medium">{formatDate(short.publishedAt, locale)}</p>
                    </div>
                  </div>
                )}

                {short.expiresAt && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("detail.expiresAt")}</p>
                      <p className="font-medium">{formatDate(short.expiresAt, locale)}</p>
                    </div>
                  </div>
                )}

                {short.archivedAt && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                      <Archive className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("detail.archivedAt")}</p>
                      <p className="font-medium">{formatDate(short.archivedAt, locale)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {short.status === "DRAFT" && (
            <ShortActions
              shortId={short.id}
              shortTitle={short.title}
              companyVerified={companyProfile.viesVerified}
              credits={wallet.total}
              locale={locale}
            />
          )}
        </div>
      </div>
    </div>
  )
}
