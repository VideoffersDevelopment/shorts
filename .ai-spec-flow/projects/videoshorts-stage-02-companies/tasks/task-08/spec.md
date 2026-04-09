# Task 08: Admin Categories Management

## Overview

**Priority:** HIGH
**Dependencies:** task-06
**Complexity:** Medium (10 files, ~10k tokens)
**Status:** pending

## What to Build

Create the admin categories management interface with CRUD operations, hierarchical tree view, and reordering capabilities. Categories are used by companies to classify their business.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(admin)/[locale]/admin/categories/page.tsx` | Create | Categories management page |
| `src/components/admin/categories-tree.tsx` | Create | Hierarchical category tree |
| `src/components/admin/category-form-dialog.tsx` | Create | Create/edit category dialog |
| `src/app/actions/admin/categories/create.ts` | Create | Create category action |
| `src/app/actions/admin/categories/update.ts` | Create | Update category action |
| `src/app/actions/admin/categories/delete.ts` | Create | Delete category action |

## Files to Modify

| File | Changes |
|------|---------|
| None | All new files |

## Categories Management Page

```typescript
// src/app/(admin)/[locale]/admin/categories/page.tsx
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CategoriesTree } from "@/components/admin/categories-tree"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminCategoriesPage() {
  const t = await getTranslations("admin.categories")

  const categories = await prisma.category.findMany({
    include: {
      children: true,
      _count: {
        select: { companyProfiles: true }
      }
    },
    orderBy: { order: "asc" }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </div>

      <CategoriesTree categories={categories} />
    </div>
  )
}
```

## Categories Tree Component

```typescript
// src/components/admin/categories-tree.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  icon?: string | null
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
  const t = useTranslations("admin.categories")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  async function handleDelete(categoryId: string, companyCount: number) {
    if (companyCount > 0) {
      toast.error(t("delete.hasCompanies", { count: companyCount }))
      return
    }

    if (!confirm(t("delete.confirm"))) return

    const result = await deleteCategoryAction(categoryId)

    if (!result.success) {
      toast.error(t(result.error))
    } else {
      toast.success(t("delete.success"))
    }
  }

  return (
    <div className="space-y-2">
      {categories
        .filter(cat => !cat.parentId)
        .map(category => (
          <Card key={category.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                    onClick={() => {
                      setEditingCategory(category)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handleDelete(category.id, category._count?.companyProfiles || 0)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="mt-4 ml-6 space-y-2">
                  {category.children.map(child => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span>{child.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategory(child)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDelete(child.id, child._count?.companyProfiles || 0)
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
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingCategory(null)
        }}
        categories={categories}
      />
    </div>
  )
}
```

## Category Form Dialog

```typescript
// src/components/admin/category-form-dialog.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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

interface CategoryFormDialogProps {
  category?: any
  isOpen: boolean
  onClose: () => void
  categories: any[]
}

export function CategoryFormDialog({
  category,
  isOpen,
  onClose,
  categories
}: CategoryFormDialogProps) {
  const t = useTranslations("admin.categories")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = category
      ? await updateCategoryAction(category.id, data)
      : await createCategoryAction(data)

    if (!result.success) {
      toast.error(t(result.error))
    } else {
      toast.success(category ? t("update.success") : t("create.success"))
      onClose()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? t("edit") : t("create")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("fields.name")}</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={category?.name}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="slug">{t("fields.slug")}</Label>
            <Input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              defaultValue={category?.slug}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="icon">{t("fields.icon")}</Label>
            <Input
              id="icon"
              name="icon"
              placeholder="lucide-icon-name"
              defaultValue={category?.icon || ""}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="parentId">{t("fields.parent")}</Label>
            <Select name="parentId" defaultValue={category?.parentId || ""}>
              <SelectTrigger>
                <SelectValue placeholder={t("fields.parentPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("fields.noParent")}</SelectItem>
                {categories
                  .filter(cat => !cat.parentId)
                  .map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {category ? t("update") : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## Create Category Action

```typescript
// src/app/actions/admin/categories/create.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { formatZodError, createError } from "@/lib/types/action-result"

export async function createCategoryAction(
  data: unknown
): Promise<ActionResult<any>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  try {
    const category = await prisma.category.create({
      data: parsed.data
    })

    revalidatePath("/admin/categories")
    return { success: true, data: category }
  } catch (error) {
    console.error("Create category error:", error)
    return createError("admin.errors.categoryCreateFailed", "CATEGORY_CREATE_FAILED")
  }
}
```

## Delete Category Action

```typescript
// src/app/actions/admin/categories/delete.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types/action-result"
import { createError } from "@/lib/types/action-result"

export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return createError("errors.unauthorized", "UNAUTHORIZED")
  }

  try {
    // Check if category has companies
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { companyProfiles: true } } }
    })

    if (!category) {
      return createError("admin.errors.categoryNotFound", "CATEGORY_NOT_FOUND")
    }

    if (category._count.companyProfiles > 0) {
      return createError(
        "admin.errors.categoryHasCompanies",
        "CATEGORY_HAS_COMPANIES"
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    revalidatePath("/admin/categories")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("Delete category error:", error)
    return createError("admin.errors.categoryDeleteFailed", "CATEGORY_DELETE_FAILED")
  }
}
```

## Acceptance Criteria

- [ ] Categories page shows hierarchical tree
- [ ] Parent categories displayed as cards
- [ ] Subcategories shown indented under parents
- [ ] Company count shown for each category
- [ ] Enabled/disabled badge displayed
- [ ] Create button opens form dialog
- [ ] Edit button pre-fills form with category data
- [ ] Delete button shows confirmation
- [ ] Delete blocked if category has companies
- [ ] Form validates name, slug, icon fields
- [ ] Parent dropdown shows only top-level categories
- [ ] Success/error toasts shown
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test admin: Login as ADMIN
- Seed categories: From task-01

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to categories | Page loads with tree | `/admin/categories` |
| 2 | Verify tree structure | Parents with children indented | `.card` |
| 3 | Click Create | Dialog opens | `button:has-text("Add")` |
| 4 | Fill form | All fields accept input | `input[name="name"]` |
| 5 | Submit form | Success toast, category added | `button[type="submit"]` |
| 6 | Click Edit | Dialog pre-filled | `button:has(Edit)` |
| 7 | Update category | Success toast, changes saved | - |
| 8 | Try delete with companies | Error toast, delete blocked | `button:has(Trash2)` |

### Screenshot Checkpoints
- `01-categories-tree.png` - Hierarchical category tree
- `02-create-dialog.png` - Create category dialog
- `03-edit-dialog.png` - Edit dialog pre-filled
- `04-delete-error.png` - Delete error for category with companies

## Notes

- **Hierarchical Tree:** Parent → children (max 2 levels)
- **Delete Protection:** Cannot delete category with companies
- **Icon Field:** Lucide icon name (optional)
- **Slug Validation:** Lowercase alphanumeric with dashes
- **Order Field:** Auto-managed, can add drag-drop later
