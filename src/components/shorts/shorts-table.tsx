"use client"

import { useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
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
  MoreHorizontal,
  Eye,
  Pencil,
  Upload,
  Archive,
  Copy,
  Trash2,
  RotateCcw,
  Video,
  Clock,
  Rocket
} from "lucide-react"
import type { ShortStatus, Short, ShortStats, ShortTag, Tag } from "@prisma/client"

interface ShortWithRelations extends Short {
  stats: ShortStats | null
  tags: (ShortTag & { tag: Tag })[]
}

interface ShortsTableProps {
  shorts: ShortWithRelations[]
  onView: (shortId: string) => void
  onEdit: (short: ShortWithRelations) => void
  onPublish: (short: ShortWithRelations) => void
  onArchive: (short: ShortWithRelations) => void
  onDelete: (short: ShortWithRelations) => void
  onDuplicate: (short: ShortWithRelations) => void
  onRenew: (short: ShortWithRelations) => void
  onExtend?: (short: ShortWithRelations) => void
  onBoost?: (short: ShortWithRelations) => void
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
    case "EXPIRED":
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

function formatDate(date: Date | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString()
}

export function ShortsTable({
  shorts,
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
  onDuplicate,
  onRenew,
  onExtend,
  onBoost
}: ShortsTableProps) {
  const { t } = useTranslations("shorts")

  const handleView = useCallback((shortId: string) => {
    onView(shortId)
  }, [onView])

  const handleEdit = useCallback((short: ShortWithRelations) => {
    onEdit(short)
  }, [onEdit])

  const handlePublish = useCallback((short: ShortWithRelations) => {
    onPublish(short)
  }, [onPublish])

  const handleArchive = useCallback((short: ShortWithRelations) => {
    onArchive(short)
  }, [onArchive])

  const handleDelete = useCallback((short: ShortWithRelations) => {
    onDelete(short)
  }, [onDelete])

  const handleDuplicate = useCallback((short: ShortWithRelations) => {
    onDuplicate(short)
  }, [onDuplicate])

  const handleRenew = useCallback((short: ShortWithRelations) => {
    onRenew(short)
  }, [onRenew])

  const handleExtend = useCallback((short: ShortWithRelations) => {
    onExtend?.(short)
  }, [onExtend])

  const handleBoost = useCallback((short: ShortWithRelations) => {
    onBoost?.(short)
  }, [onBoost])

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Video className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{t("table.empty")}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">{t("table.columns.thumbnail")}</TableHead>
          <TableHead>{t("table.columns.title")}</TableHead>
          <TableHead>{t("table.columns.status")}</TableHead>
          <TableHead className="text-right">{t("table.columns.views")}</TableHead>
          <TableHead>{t("table.columns.publishedAt")}</TableHead>
          <TableHead>{t("table.columns.expiresAt")}</TableHead>
          <TableHead className="w-[70px]">{t("table.columns.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shorts.map((short) => (
          <TableRow key={short.id}>
            {/* Thumbnail */}
            <TableCell>
              <div className="w-16 h-9 bg-muted rounded overflow-hidden">
                {short.thumbnailUrl ? (
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </TableCell>

            {/* Title & Duration */}
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium line-clamp-1">{short.title}</span>
                {short.duration && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(short.duration)}
                  </span>
                )}
              </div>
            </TableCell>

            {/* Status */}
            <TableCell>
              <Badge variant={getStatusVariant(short.status)}>
                {t(`status.${short.status}`)}
              </Badge>
            </TableCell>

            {/* Views */}
            <TableCell className="text-right">
              {short.stats?.views ?? 0}
            </TableCell>

            {/* Published At */}
            <TableCell>
              {formatDate(short.publishedAt)}
            </TableCell>

            {/* Expires At */}
            <TableCell>
              {formatDate(short.expiresAt)}
            </TableCell>

            {/* Actions */}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t("table.columns.actions")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* View - always available */}
                  <DropdownMenuItem onClick={() => handleView(short.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("actions.view")}
                  </DropdownMenuItem>

                  {/* Status-specific actions */}
                  {short.status === "DRAFT" && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(short)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePublish(short)}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t("actions.publish")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(short)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("actions.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(short)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("actions.delete")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {short.status === "PUBLISHED" && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(short)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      {onBoost && (
                        <DropdownMenuItem onClick={() => handleBoost(short)}>
                          <Rocket className="mr-2 h-4 w-4" />
                          {t("actions.boost")}
                        </DropdownMenuItem>
                      )}
                      {onExtend && (
                        <DropdownMenuItem onClick={() => handleExtend(short)}>
                          <Clock className="mr-2 h-4 w-4" />
                          {t("actions.extend")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleArchive(short)}>
                        <Archive className="mr-2 h-4 w-4" />
                        {t("actions.archive")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(short)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("actions.duplicate")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {short.status === "PROCESSING" && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(short)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {short.status === "EXPIRED" && (
                    <>
                      {onExtend && (
                        <DropdownMenuItem onClick={() => handleExtend(short)}>
                          <Clock className="mr-2 h-4 w-4" />
                          {t("actions.extend")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(short)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("actions.duplicate")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {short.status === "ARCHIVED" && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(short)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenew(short)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t("actions.renew")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(short)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("actions.duplicate")}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
