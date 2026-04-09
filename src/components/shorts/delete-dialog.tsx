"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Trash2 } from "lucide-react"
import { deleteShortAction } from "@/app/actions/shorts/delete"
import type { Short } from "@prisma/client"

interface DeleteDialogProps {
  short: Short | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteDialog({
  short,
  isOpen,
  onClose,
  onSuccess
}: DeleteDialogProps) {
  const { t } = useTranslations("shorts")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  const handleDelete = useCallback(async () => {
    if (!short) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteShortAction(short.id)

      if (!result.success) {
        setError(result.error)
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError(t("errors.deleteFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [short, onSuccess, onClose, t])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }, [isLoading, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t("delete.title")}
          </DialogTitle>
          <DialogDescription>
            {t("delete.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {short && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{short.title}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("delete.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
