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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { updateShortMetadataAction } from "@/app/actions/shorts/update"
import type { Short } from "@prisma/client"

interface EditShortDialogProps {
  short: Short | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  title: string
  description: string
  tags: string
  ctaLink: string
}

export function EditShortDialog({
  short,
  isOpen,
  onClose,
  onSuccess
}: EditShortDialogProps) {
  const { t } = useTranslations("shorts")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    tags: "",
    ctaLink: ""
  })

  // Initialize form data when short changes
  useEffect(() => {
    if (short) {
      setFormData({
        title: short.title,
        description: short.description ?? "",
        tags: "",
        ctaLink: short.ctaLink ?? ""
      })
      setError(null)
    }
  }, [short])

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!short) return

    setIsLoading(true)
    setError(null)

    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const result = await updateShortMetadataAction(short.id, {
        title: formData.title,
        description: formData.description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        ctaLink: formData.ctaLink || null
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError(t("errors.updateFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [short, formData, onSuccess, onClose, t])

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
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("edit.titleLabel")}</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={100}
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("edit.descriptionLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">{t("edit.tagsLabel")}</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="tag1, tag2, tag3"
              disabled={isLoading}
            />
          </div>

          {/* CTA Link */}
          <div className="space-y-2">
            <Label htmlFor="ctaLink">{t("edit.ctaLinkLabel")}</Label>
            <Input
              id="ctaLink"
              name="ctaLink"
              type="url"
              value={formData.ctaLink}
              onChange={handleInputChange}
              placeholder="https://example.com"
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("edit.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
