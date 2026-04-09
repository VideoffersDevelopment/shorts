"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companyProfileSchema } from '@/lib/validation'
import { updateCompanyProfileAction } from '@/app/actions/companies/update'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useTranslations } from '@/lib/i18n/client'
import { toast } from 'sonner'
import { LogoUpload } from './logo-upload'
import { BannerUpload } from './banner-upload'
import { CategoryCombobox } from './category-combobox'
import { AddressLocation } from './address-location'
import { BusinessHoursPicker, type BusinessHours } from './business-hours-picker'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Clock } from 'lucide-react'
import type { CompanyProfile, Category } from '@prisma/client'
import type { ActionResult } from '@/lib/types/action-result'

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

type SubmitAction = (data: unknown) => Promise<ActionResult<CompanyProfile>>

interface CompanyProfileFormProps {
  profile: CompanyProfile
  categories: CategoryWithChildren[]
  /** Custom submit action - defaults to updateCompanyProfileAction */
  submitAction?: SubmitAction
  /** Namespace for translations - defaults to 'companies' */
  translationNamespace?: string
  /** Success message key - defaults to 'profile.edit.success' */
  successMessageKey?: string
  /** Error message key - defaults to 'profile.edit.error' */
  errorMessageKey?: string
  /** Callback after successful submit */
  onSuccess?: () => void
}

interface FormValues {
  companyName?: string
  description?: string
  website?: string
  categoryId?: string
  subcategories?: string[]
  socialLinks?: {
    facebook?: string
    instagram?: string
    tiktok?: string
    youtube?: string
    linkedin?: string
  }
  logo?: string
  banner?: string
  latitude?: number
  longitude?: number
  street?: string
  postalCode?: string
  city?: string
  phone?: string
  contactEmail?: string
}

export function CompanyProfileForm({
  profile,
  categories,
  submitAction,
  translationNamespace = 'companies',
  successMessageKey = 'profile.edit.success',
  errorMessageKey = 'profile.edit.error',
  onSuccess
}: CompanyProfileFormProps) {
  const { t } = useTranslations(translationNamespace)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logo, setLogo] = useState<string | null>(profile.logo)
  const [banner, setBanner] = useState<string | null>(profile.banner)
  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    if (profile.businessHours && typeof profile.businessHours === 'object') {
      return profile.businessHours as BusinessHours
    }
    return {}
  })

  const socialLinks = profile.socialLinks as {
    facebook?: string
    instagram?: string
    tiktok?: string
    youtube?: string
    linkedin?: string
  } | null

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValues>({
    defaultValues: {
      companyName: profile.companyName,
      description: profile.description ?? '',
      website: profile.website ?? '',
      categoryId: profile.categoryId ?? '',
      subcategories: (() => {
        if (Array.isArray(profile.subcategories)) {
          return profile.subcategories.filter((item): item is string => typeof item === 'string')
        }
        return []
      })(),
      socialLinks: {
        facebook: socialLinks?.facebook ?? '',
        instagram: socialLinks?.instagram ?? '',
        tiktok: socialLinks?.tiktok ?? '',
        youtube: socialLinks?.youtube ?? '',
        linkedin: socialLinks?.linkedin ?? ''
      },
      logo: profile.logo ?? '',
      banner: profile.banner ?? '',
      latitude: profile.latitude ?? undefined,
      longitude: profile.longitude ?? undefined,
      street: profile.street ?? '',
      postalCode: profile.postalCode ?? '',
      city: profile.city ?? '',
      phone: profile.phone ?? '',
      contactEmail: profile.contactEmail ?? ''
    }
  })

  const categoryId = watch('categoryId')
  const subcategoriesValue = watch('subcategories')
  // Pass subcategory ID if selected, otherwise main category ID
  const categoryValue = subcategoriesValue?.[0] ?? categoryId

  const handleLogoChange = useCallback((url: string | null) => {
    setLogo(url)
    setValue('logo', url ?? '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    })
  }, [setValue])

  const handleBannerChange = useCallback((url: string | null) => {
    setBanner(url)
    setValue('banner', url ?? '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    })
  }, [setValue])

  const handleCategoryChange = useCallback((categoryId: string, parentId: string | null) => {
    if (parentId) {
      // Subcategory selected - set parent as main category
      setValue('categoryId', parentId, { shouldDirty: true })
      setValue('subcategories', [categoryId], { shouldDirty: true })
    } else {
      // Main category selected
      setValue('categoryId', categoryId, { shouldDirty: true })
      setValue('subcategories', [], { shouldDirty: true })
    }
  }, [setValue])

  const handleBusinessHoursChange = useCallback((hours: BusinessHours) => {
    setBusinessHours(hours)
  }, [])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      const submitData = {
        companyName: data.companyName,
        description: data.description,
        website: data.website === '' ? undefined : data.website,
        categoryId: data.categoryId === '' ? undefined : data.categoryId,
        subcategories: data.subcategories,
        socialLinks: data.socialLinks,
        logo: data.logo === '' ? undefined : data.logo,
        banner: data.banner === '' ? undefined : data.banner,
        latitude: data.latitude,
        longitude: data.longitude,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        phone: data.phone,
        contactEmail: data.contactEmail === '' ? undefined : data.contactEmail,
        businessHours
      }

      // Use custom action or default
      const action = submitAction ?? updateCompanyProfileAction
      const result = await action(submitData)

      if (result.success) {
        toast.success(t(successMessageKey))
        onSuccess?.()
      } else {
        toast.error(result.error || t(errorMessageKey))
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(t(errorMessageKey))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Banner */}
        <div>
          <Label>{t('profile.fields.banner')}</Label>
          <BannerUpload currentBanner={banner} onBannerChange={handleBannerChange} />
        </div>

        {/* Logo */}
        <div>
          <Label>{t('profile.fields.logo')}</Label>
          <LogoUpload
            currentLogo={logo}
            companyName={profile.companyName}
            onLogoChange={handleLogoChange}
          />
        </div>

        {/* Company Name */}
        <div>
          <Label htmlFor="companyName">{t('profile.fields.companyName')}</Label>
          <Input
            id="companyName"
            {...register('companyName')}
            disabled={isSubmitting}
          />
          {errors.companyName ? (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          ) : null}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">{t('profile.fields.description')}</Label>
          <Textarea
            id="description"
            rows={5}
            {...register('description')}
            disabled={isSubmitting}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          ) : null}
        </div>

        {/* Category Combobox */}
        <div>
          <Label>{t('profile.fields.category')}</Label>
          <CategoryCombobox
            categories={categories}
            value={categoryValue}
            onValueChange={handleCategoryChange}
            disabled={isSubmitting}
          />
          {errors.categoryId ? (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          ) : null}
        </div>

        {/* Website + Phone in one row */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="website">{t('profile.fields.website')}</Label>
            <Input
              id="website"
              type="url"
              placeholder={t("profile.placeholders.website")}
              {...register('website')}
              disabled={isSubmitting}
            />
            {errors.website ? (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="phone">{t('profile.fields.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              disabled={isSubmitting}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <Label htmlFor="contactEmail">{t('profile.fields.contactEmail')}</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder={t("profile.placeholders.contactEmail")}
            {...register('contactEmail')}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('profile.fields.contactEmailHint')}
          </p>
          {errors.contactEmail ? (
            <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
          ) : null}
        </div>

        {/* Address + Location */}
        <div>
          <Label>{t('profile.fields.address')}</Label>
          <AddressLocation
            street={watch('street') ?? ''}
            postalCode={watch('postalCode') ?? ''}
            city={watch('city') ?? ''}
            latitude={watch('latitude')}
            longitude={watch('longitude')}
            onStreetChange={(v) => setValue('street', v, { shouldDirty: true })}
            onPostalCodeChange={(v) => setValue('postalCode', v, { shouldDirty: true })}
            onCityChange={(v) => setValue('city', v, { shouldDirty: true })}
            onLocationChange={(lat, lng) => {
              setValue('latitude', lat, { shouldDirty: true })
              setValue('longitude', lng, { shouldDirty: true })
            }}
            disabled={isSubmitting}
          />
          {errors.street ? (
            <p className="text-sm text-destructive">{errors.street.message}</p>
          ) : null}
          {errors.postalCode ? (
            <p className="text-sm text-destructive">{errors.postalCode.message}</p>
          ) : null}
          {errors.city ? (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          ) : null}
        </div>

        {/* Social Links */}
        <div>
          <Label>{t('profile.fields.socialLinks')}</Label>
          <div className="space-y-2">
            <Input
              placeholder={t("profile.placeholders.facebook")}
              {...register('socialLinks.facebook')}
              disabled={isSubmitting}
            />
            {errors.socialLinks?.facebook ? (
              <p className="text-sm text-destructive">{errors.socialLinks.facebook.message}</p>
            ) : null}

            <Input
              placeholder={t("profile.placeholders.instagram")}
              {...register('socialLinks.instagram')}
              disabled={isSubmitting}
            />
            {errors.socialLinks?.instagram ? (
              <p className="text-sm text-destructive">{errors.socialLinks.instagram.message}</p>
            ) : null}

            <Input
              placeholder={t("profile.placeholders.tiktok")}
              {...register('socialLinks.tiktok')}
              disabled={isSubmitting}
            />
            {errors.socialLinks?.tiktok ? (
              <p className="text-sm text-destructive">{errors.socialLinks.tiktok.message}</p>
            ) : null}

            <Input
              placeholder={t("profile.placeholders.youtube")}
              {...register('socialLinks.youtube')}
              disabled={isSubmitting}
            />
            {errors.socialLinks?.youtube ? (
              <p className="text-sm text-destructive">{errors.socialLinks.youtube.message}</p>
            ) : null}

            <Input
              placeholder={t("profile.placeholders.linkedin")}
              {...register('socialLinks.linkedin')}
              disabled={isSubmitting}
            />
            {errors.socialLinks?.linkedin ? (
              <p className="text-sm text-destructive">{errors.socialLinks.linkedin.message}</p>
            ) : null}
          </div>
        </div>

        {/* Business Hours - Accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="business-hours" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{t('profile.fields.setBusinessHours')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <BusinessHoursPicker
                value={businessHours}
                onChange={handleBusinessHoursChange}
                disabled={isSubmitting}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {t('profile.edit.saving')}
          </>
        ) : (
          t('profile.edit.save')
        )}
      </Button>
    </form>
  )
}
