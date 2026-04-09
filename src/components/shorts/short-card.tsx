"use client"

import { useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Eye,
  Pencil,
  Upload,
  Archive,
  Copy,
  Trash2,
  RotateCcw,
  Video
} from "lucide-react"
import type { ShortStatus, Short, ShortStats } from "@prisma/client"

interface ShortCardProps {
  short: Short & { stats: ShortStats | null }
  onAction: (action: string, short: Short & { stats: ShortStats | null }) => void
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
  if (!seconds) return ""
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function ShortCard({ short, onAction }: ShortCardProps) {
  const { t } = useTranslations("shorts")

  const handleAction = useCallback((action: string) => {
    onAction(action, short)
  }, [onAction, short])

  return (
    <Card className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative">
        {short.thumbnailUrl ? (
          <img
            src={short.thumbnailUrl}
            alt={short.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Duration badge */}
        {short.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(short.duration)}
          </div>
        )}

        {/* Actions dropdown on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{t("table.columns.actions")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction("view")}>
                <Eye className="mr-2 h-4 w-4" />
                {t("actions.view")}
              </DropdownMenuItem>

              {short.status === "DRAFT" && (
                <>
                  <DropdownMenuItem onClick={() => handleAction("edit")}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("publish")}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("actions.publish")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("actions.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleAction("delete")}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </>
              )}

              {short.status === "PUBLISHED" && (
                <>
                  <DropdownMenuItem onClick={() => handleAction("edit")}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("archive")}>
                    <Archive className="mr-2 h-4 w-4" />
                    {t("actions.archive")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("actions.duplicate")}
                  </DropdownMenuItem>
                </>
              )}

              {short.status === "ARCHIVED" && (
                <>
                  <DropdownMenuItem onClick={() => handleAction("renew")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("actions.renew")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("actions.duplicate")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium line-clamp-1">{short.title}</h3>
          <Badge variant={getStatusVariant(short.status)} className="shrink-0">
            {t(`status.${short.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{short.stats?.views ?? 0} {t("detail.views")}</span>
          <span>{short.stats?.likes ?? 0} {t("detail.likes")}</span>
        </div>
      </CardContent>
    </Card>
  )
}
