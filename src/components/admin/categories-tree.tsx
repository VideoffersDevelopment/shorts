"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus } from "lucide-react"
import { CategoryFormDialog } from "./category-form-dialog"
import { deleteCategoryAction } from "@/app/actions/admin/categories/delete"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  order: number
  enabled: boolean
  children?: Category[]
  _count?: {
    companyProfiles: number
  }
}

interface CategoriesTreeProps {
  categories: Category[]
}

export function CategoriesTree({ categories }: CategoriesTreeProps) {
  const { t } = useTranslations("admin-categories")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [parentForNew, setParentForNew] = useState<string | null>(null)

  const handleDelete = useCallback(async (categoryId: string, companyCount: number, childCount: number) => {
    if (companyCount > 0) {
      toast.error(t("delete.hasCompanies"))
      return
    }

    if (childCount > 0) {
      toast.error(t("delete.hasChildren"))
      return
    }

    if (!confirm(t("delete.confirm"))) return

    const result = await deleteCategoryAction(categoryId)

    if (!result.success) {
      toast.error(t("delete.error"))
    } else {
      toast.success(t("delete.success"))
    }
  }, [t])

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category)
    setParentForNew(null)
    setIsDialogOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingCategory(null)
    setParentForNew(null)
    setIsDialogOpen(true)
  }, [])

  const handleCreateChild = useCallback((parentId: string) => {
    setEditingCategory(null)
    setParentForNew(parentId)
    setIsDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setParentForNew(null)
  }, [])

  const topLevelCategories = categories.filter(cat => !cat.parentId)

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </div>

      {topLevelCategories.map(category => (
        <Card key={category.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span className="text-lg font-medium">{category.name}</span>
                <Badge variant={category.enabled ? "default" : "secondary"}>
                  {category.enabled ? t("enabled") : t("disabled")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {category._count?.companyProfiles || 0} {t("companies")}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateChild(category.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addChild")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    handleDelete(
                      category.id,
                      category._count?.companyProfiles || 0,
                      category.children?.length || 0
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {category.children && category.children.length > 0 && (
              <div className="mt-4 ml-6 space-y-2">
                {category.children.map(child => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {child.icon && (
                        <span className="text-sm">{child.icon}</span>
                      )}
                      <span>{child.name}</span>
                      <Badge variant={child.enabled ? "default" : "secondary"} className="text-xs">
                        {child.enabled ? t("enabled") : t("disabled")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {child._count?.companyProfiles || 0} {t("companies")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(child)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleDelete(child.id, child._count?.companyProfiles || 0, 0)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <CategoryFormDialog
        category={editingCategory}
        parentId={parentForNew}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        categories={categories}
      />
    </div>
  )
}
