"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { createCategoryAction } from "@/app/actions/admin/categories/create"
import { updateCategoryAction } from "@/app/actions/admin/categories/update"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  order: number
  enabled: boolean
}

interface CategoryFormDialogProps {
  category?: Category | null
  parentId?: string | null
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export function CategoryFormDialog({
  category,
  parentId,
  isOpen,
  onClose,
  categories
}: CategoryFormDialogProps) {
  const { t } = useTranslations("admin-categories")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string>(
    category?.parentId || parentId || "none"
  )

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      icon: (formData.get("icon") as string) || undefined,
      parentId: selectedParent === "none" ? undefined : selectedParent || undefined,
      enabled: formData.get("enabled") === "true"
    }

    const result = category
      ? await updateCategoryAction(category.id, data)
      : await createCategoryAction(data)

    if (!result.success) {
      toast.error(t("form.error"))
    } else {
      toast.success(category ? t("form.updateSuccess") : t("form.createSuccess"))
      onClose()
    }

    setIsLoading(false)
  }, [category, selectedParent, onClose, t])

  // Reset selected parent when dialog opens/closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose()
    }
    if (open) {
      setSelectedParent(category?.parentId || parentId || "none")
    }
  }, [category, parentId, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={category?.name}
              disabled={isLoading}
              placeholder={t("form.namePlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="slug">{t("form.slug")}</Label>
            <Input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              defaultValue={category?.slug}
              disabled={isLoading}
              placeholder={t("form.slugPlaceholder")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("form.slugHint")}
            </p>
          </div>

          <div>
            <Label htmlFor="icon">{t("form.icon")}</Label>
            <Input
              id="icon"
              name="icon"
              placeholder={t("form.iconPlaceholder")}
              defaultValue={category?.icon || ""}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("form.iconHint")}
            </p>
          </div>

          <div>
            <Label htmlFor="parentId">{t("form.parent")}</Label>
            <Select
              value={selectedParent}
              onValueChange={setSelectedParent}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.parentPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("form.noParent")}</SelectItem>
                {categories
                  .filter(cat => !cat.parentId && cat.id !== category?.id)
                  .map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="enabled">{t("form.enabled")}</Label>
            <Select name="enabled" defaultValue={String(category?.enabled ?? true)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("form.enabledYes")}</SelectItem>
                <SelectItem value="false">{t("form.enabledNo")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("form.saving") : (category ? t("form.update") : t("form.create"))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
