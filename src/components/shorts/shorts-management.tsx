"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import { ShortsTable } from "@/components/shorts/shorts-table"
import { ShortsFilters } from "@/components/shorts/shorts-filters"
import { EditShortDialog } from "@/components/shorts/edit-short-dialog"
import { ArchiveDialog } from "@/components/shorts/archive-dialog"
import { DeleteDialog } from "@/components/shorts/delete-dialog"
import { PublishDialog } from "@/components/shorts/publish-dialog"
import { ExtensionModal } from "@/components/shorts/extension-modal"
import { BoostModal } from "@/components/shorts/boost-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Video } from "lucide-react"
import { duplicateShortAction } from "@/app/actions/shorts/duplicate"
import { toast } from "sonner"
import type { Short, ShortStatus, ShortStats, ShortTag, Tag } from "@prisma/client"

interface ShortWithRelations extends Short {
  stats: ShortStats | null
  tags: (ShortTag & { tag: Tag })[]
}

type FilterStatus = ShortStatus | "all"

interface ShortsManagementProps {
  initialShorts: ShortWithRelations[]
  companyVerified: boolean
  credits: number
  locale: string
}

export function ShortsManagement({
  initialShorts,
  companyVerified,
  credits,
  locale
}: ShortsManagementProps) {
  const { t } = useTranslations("shorts")
  const router = useRouter()

  // Filter state
  const [status, setStatus] = useState<FilterStatus>("all")
  const [search, setSearch] = useState("")

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false)
  const [boostDialogOpen, setBoostDialogOpen] = useState(false)
  const [selectedShort, setSelectedShort] = useState<ShortWithRelations | null>(null)

  // Filter shorts
  const filteredShorts = initialShorts.filter((short) => {
    // Status filter
    if (status !== "all" && short.status !== status) {
      return false
    }

    // Search filter
    if (search && !short.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    return true
  })

  // Handlers
  const handleView = useCallback((shortId: string) => {
    router.push(`/${locale}/panel/shorts/${shortId}`)
  }, [router, locale])

  const handleEdit = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setEditDialogOpen(true)
  }, [])

  const handlePublish = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setPublishDialogOpen(true)
  }, [])

  const handleArchive = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setArchiveDialogOpen(true)
  }, [])

  const handleDelete = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setDeleteDialogOpen(true)
  }, [])

  const handleDuplicate = useCallback(async (short: ShortWithRelations) => {
    try {
      const result = await duplicateShortAction(short.id)

      if (!result.success) {
        if (result.code === "MAX_DRAFTS_EXCEEDED") {
          toast.error(t("duplicate.limitReached"))
        } else {
          toast.error(t("duplicate.error"))
        }
        return
      }

      toast.success(t("duplicate.success"))
      router.refresh()
    } catch {
      toast.error(t("duplicate.error"))
    }
  }, [router, t])

  const handleRenew = useCallback((short: ShortWithRelations) => {
    router.push(`/${locale}/panel/shorts/${short.id}/renew`)
  }, [router, locale])

  const handleExtend = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setExtensionDialogOpen(true)
  }, [])

  const handleBoost = useCallback((short: ShortWithRelations) => {
    setSelectedShort(short)
    setBoostDialogOpen(true)
  }, [])

  const handleDialogSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const handleCloseEdit = useCallback(() => {
    setEditDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handleCloseArchive = useCallback(() => {
    setArchiveDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handleClosePublish = useCallback(() => {
    setPublishDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handleCloseExtension = useCallback(() => {
    setExtensionDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handleCloseBoost = useCallback(() => {
    setBoostDialogOpen(false)
    setSelectedShort(null)
  }, [])

  const handlePublishSuccess = useCallback(() => {
    setPublishDialogOpen(false)
    setSelectedShort(null)
    router.refresh()
  }, [router])

  if (initialShorts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("list.empty.title")}</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {t("list.empty.description")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ShortsFilters
        status={status}
        search={search}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ShortsTable
            shorts={filteredShorts}
            onView={handleView}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onRenew={handleRenew}
            onExtend={handleExtend}
            onBoost={handleBoost}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditShortDialog
        short={selectedShort}
        isOpen={editDialogOpen}
        onClose={handleCloseEdit}
        onSuccess={handleDialogSuccess}
      />

      <ArchiveDialog
        short={selectedShort}
        isOpen={archiveDialogOpen}
        onClose={handleCloseArchive}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        short={selectedShort}
        isOpen={deleteDialogOpen}
        onClose={handleCloseDelete}
        onSuccess={handleDialogSuccess}
      />

      {selectedShort && (
        <PublishDialog
          shortId={selectedShort.id}
          shortTitle={selectedShort.title}
          companyVerified={companyVerified}
          credits={credits}
          isOpen={publishDialogOpen}
          onClose={handleClosePublish}
          onSuccess={handlePublishSuccess}
          locale={locale}
        />
      )}

      {selectedShort && (
        <ExtensionModal
          isOpen={extensionDialogOpen}
          onClose={handleCloseExtension}
          shortId={selectedShort.id}
          shortTitle={selectedShort.title}
          currentExpiresAt={selectedShort.expiresAt?.toISOString() ?? null}
          credits={credits}
        />
      )}

      {selectedShort && (
        <BoostModal
          isOpen={boostDialogOpen}
          onClose={handleCloseBoost}
          shortId={selectedShort.id}
          shortTitle={selectedShort.title}
          credits={credits}
        />
      )}
    </div>
  )
}
