"use client"

import { useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "@/lib/i18n/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CategoryCombobox } from "@/components/companies/category-combobox"
import { TagsAutocomplete } from "./tags-autocomplete"
import type { Category } from "@prisma/client"

// Metadata form schema (subset of createShortSchema)
const metadataFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  location: z.string().max(500, "Location too long").optional(),
  ctaLink: z.string().url("Invalid URL").optional().or(z.literal(""))
})

export type MetadataFormValues = z.infer<typeof metadataFormSchema>

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface ShortMetadataFormProps {
  categories: CategoryWithChildren[]
  defaultValues?: Partial<MetadataFormValues>
  onSubmit: (data: MetadataFormValues) => void
  onBack?: () => void
  isSubmitting?: boolean
}

export function ShortMetadataForm({
  categories,
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting = false
}: ShortMetadataFormProps) {
  const { t } = useTranslations("shorts")

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      tags: defaultValues?.tags ?? [],
      location: defaultValues?.location ?? "",
      ctaLink: defaultValues?.ctaLink ?? ""
    }
  })

  const categoryId = watch("categoryId")

  const handleCategoryChange = useCallback((selectedCategoryId: string, _parentId: string | null) => {
    setValue("categoryId", selectedCategoryId, { shouldValidate: true })
  }, [setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {t("wizard.metadata.fields.title")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder={t("wizard.metadata.fields.titlePlaceholder")}
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("wizard.metadata.fields.titleHint")}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t("wizard.metadata.fields.description")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder={t("wizard.metadata.fields.descriptionPlaceholder")}
          disabled={isSubmitting}
          rows={4}
          maxLength={500}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("wizard.metadata.fields.descriptionHint")}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>
          {t("wizard.metadata.fields.category")} <span className="text-destructive">*</span>
        </Label>
        <CategoryCombobox
          categories={categories}
          value={categoryId}
          onValueChange={handleCategoryChange}
          disabled={isSubmitting}
        />
        {errors.categoryId && (
          <p className="text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>{t("wizard.metadata.fields.tags")}</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagsAutocomplete
              value={field.value ?? []}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.tags && (
          <p className="text-sm text-destructive">{errors.tags.message}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">{t("wizard.metadata.fields.location")}</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder={t("wizard.metadata.fields.locationPlaceholder")}
          disabled={isSubmitting}
          maxLength={500}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* CTA Link */}
      <div className="space-y-2">
        <Label htmlFor="ctaLink">{t("wizard.metadata.fields.ctaLink")}</Label>
        <Input
          id="ctaLink"
          type="url"
          {...register("ctaLink")}
          placeholder={t("wizard.metadata.fields.ctaLinkPlaceholder")}
          disabled={isSubmitting}
        />
        {errors.ctaLink ? (
          <p className="text-sm text-destructive">{errors.ctaLink.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("wizard.metadata.fields.ctaLinkHint")}
          </p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {t("wizard.navigation.back")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={!onBack ? "ml-auto" : ""}
        >
          {t("wizard.navigation.next")}
        </Button>
      </div>
    </form>
  )
}
