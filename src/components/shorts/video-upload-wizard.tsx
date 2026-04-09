"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { StepIndicator, type WizardStep } from "./step-indicator"
import { VideoDropzone } from "./video-dropzone"
import { VideoPreview } from "./video-preview"
import { ShortMetadataForm, type MetadataFormValues } from "./short-metadata-form"
import { ThumbnailSelector } from "./thumbnail-selector"
import { createShortAction } from "@/app/actions/shorts/create"
import { toast } from "sonner"
import type { Category } from "@prisma/client"

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface VideoData {
  key: string
  duration: number
  aspectRatio: string
  previewUrl: string
}

interface ThumbnailData {
  url: string
  isCustom: boolean
}

interface VideoUploadWizardProps {
  categories: CategoryWithChildren[]
  locale: string
}

export function VideoUploadWizard({ categories, locale }: VideoUploadWizardProps) {
  const { t } = useTranslations("shorts")
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState<WizardStep>("video")
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [metadata, setMetadata] = useState<MetadataFormValues | null>(null)
  const [thumbnail, setThumbnail] = useState<ThumbnailData | null>({ url: "", isCustom: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate completed steps
  const completedSteps = useMemo((): WizardStep[] => {
    const steps: WizardStep[] = []
    if (videoData) steps.push("video")
    if (metadata) steps.push("metadata")
    if (thumbnail !== null) steps.push("thumbnail")
    return steps
  }, [videoData, metadata, thumbnail])

  // Get category name by ID
  const getCategoryName = useCallback((categoryId: string): string => {
    for (const cat of categories) {
      if (cat.id === categoryId) return cat.name
      const sub = cat.children?.find(c => c.id === categoryId)
      if (sub) return `${cat.name} > ${sub.name}`
    }
    return categoryId
  }, [categories])

  // Step handlers
  const handleVideoUploaded = useCallback((data: VideoData) => {
    setVideoData(data)
    setCurrentStep("metadata")
  }, [])

  const handleChangeVideo = useCallback(() => {
    // Revoke old preview URL if exists
    if (videoData?.previewUrl) {
      URL.revokeObjectURL(videoData.previewUrl)
    }
    setVideoData(null)
    setCurrentStep("video")
  }, [videoData])

  const handleMetadataSubmit = useCallback((data: MetadataFormValues) => {
    setMetadata(data)
    setCurrentStep("thumbnail")
  }, [])

  const handleMetadataBack = useCallback(() => {
    setCurrentStep("video")
  }, [])

  const handleThumbnailNext = useCallback(() => {
    setCurrentStep("review")
  }, [])

  const handleThumbnailBack = useCallback(() => {
    setCurrentStep("metadata")
  }, [])

  const handleReviewBack = useCallback(() => {
    setCurrentStep("thumbnail")
  }, [])

  const handleStepClick = useCallback((step: WizardStep) => {
    // Only allow navigation to completed steps or current step
    const stepOrder: WizardStep[] = ["video", "metadata", "thumbnail", "review"]
    const targetIndex = stepOrder.indexOf(step)
    const currentIndex = stepOrder.indexOf(currentStep)

    if (targetIndex <= currentIndex || completedSteps.includes(step)) {
      setCurrentStep(step)
    }
  }, [currentStep, completedSteps])

  const handleSaveDraft = useCallback(async () => {
    if (!videoData || !metadata) return

    setIsSubmitting(true)

    try {
      const result = await createShortAction({
        rawVideoKey: videoData.key,
        title: metadata.title,
        description: metadata.description,
        categoryId: metadata.categoryId,
        tags: metadata.tags,
        address: metadata.location,
        ctaLink: metadata.ctaLink || undefined,
        thumbnailUrl: thumbnail?.isCustom ? thumbnail.url : undefined,
        customThumbnail: thumbnail?.isCustom ?? false,
        duration: videoData.duration,
        aspectRatio: videoData.aspectRatio
      })

      if (result.success) {
        toast.success(t("success.draftSaved"))
        router.push(`/${locale}/panel/shorts`)
      } else {
        toast.error(result.error || t("errors.createFailed"))
      }
    } catch (error) {
      console.error("Save draft error:", error)
      toast.error(t("errors.createFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }, [videoData, metadata, thumbnail, locale, router, t])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "video":
        if (videoData) {
          return (
            <div className="space-y-6">
              <VideoPreview
                src={videoData.previewUrl}
                duration={videoData.duration}
                aspectRatio={videoData.aspectRatio}
                onChangeVideo={handleChangeVideo}
              />
              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep("metadata")}>
                  {t("wizard.navigation.next")}
                </Button>
              </div>
            </div>
          )
        }
        return <VideoDropzone onVideoUploaded={handleVideoUploaded} />

      case "metadata":
        return (
          <ShortMetadataForm
            categories={categories}
            defaultValues={metadata ?? undefined}
            onSubmit={handleMetadataSubmit}
            onBack={handleMetadataBack}
          />
        )

      case "thumbnail":
        return (
          <div className="space-y-6">
            <ThumbnailSelector
              value={thumbnail}
              onChange={setThumbnail}
              videoPreviewUrl={videoData?.previewUrl}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleThumbnailBack}>
                {t("wizard.navigation.back")}
              </Button>
              <Button onClick={handleThumbnailNext}>
                {t("wizard.navigation.next")}
              </Button>
            </div>
          </div>
        )

      case "review":
        return (
          <div className="space-y-6">
            {/* Video section */}
            <div className="space-y-2">
              <h3 className="font-semibold">{t("wizard.review.sections.video")}</h3>
              {videoData && (
                <div className="rounded-lg border p-4">
                  <div className="aspect-video max-h-48 overflow-hidden rounded bg-muted">
                    <video
                      src={videoData.previewUrl}
                      className="w-full h-full object-contain"
                      muted
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("wizard.review.duration")}: {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              )}
            </div>

            {/* Details section */}
            <div className="space-y-2">
              <h3 className="font-semibold">{t("wizard.review.sections.details")}</h3>
              {metadata && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">{t("detail.title")}:</span>
                    <p className="font-medium">{metadata.title}</p>
                  </div>

                  {metadata.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("detail.description")}:</span>
                      <p>{metadata.description}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm text-muted-foreground">{t("wizard.review.category")}:</span>
                    <p>{getCategoryName(metadata.categoryId)}</p>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">{t("wizard.review.tags")}:</span>
                    <p>{metadata.tags?.length ? metadata.tags.join(", ") : t("wizard.review.noTags")}</p>
                  </div>

                  {metadata.location && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("wizard.review.location")}:</span>
                      <p>{metadata.location}</p>
                    </div>
                  )}

                  {metadata.ctaLink && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("wizard.review.ctaLink")}:</span>
                      <p className="break-all">{metadata.ctaLink}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail section */}
            <div className="space-y-2">
              <h3 className="font-semibold">{t("wizard.review.sections.thumbnail")}</h3>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  {thumbnail?.isCustom ? t("wizard.thumbnail.custom") : t("wizard.thumbnail.auto")}
                </p>
                {thumbnail?.isCustom && thumbnail.url && (
                  <div className="mt-2 w-24 aspect-[9/16] overflow-hidden rounded bg-muted">
                    <img
                      src={thumbnail.url}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleReviewBack} disabled={isSubmitting}>
                {t("wizard.navigation.back")}
              </Button>
              <Button onClick={handleSaveDraft} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t("wizard.navigation.saveDraft")}
                  </>
                ) : (
                  t("wizard.navigation.saveDraft")
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get step title and description
  const getStepInfo = () => {
    switch (currentStep) {
      case "video":
        return {
          title: t("wizard.video.title"),
          description: t("wizard.video.description")
        }
      case "metadata":
        return {
          title: t("wizard.metadata.title"),
          description: t("wizard.metadata.description")
        }
      case "thumbnail":
        return {
          title: t("wizard.thumbnail.title"),
          description: t("wizard.thumbnail.description")
        }
      case "review":
        return {
          title: t("wizard.review.title"),
          description: t("wizard.review.description")
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="space-y-8">
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <Card>
        <CardHeader>
          <CardTitle>{stepInfo.title}</CardTitle>
          <CardDescription>{stepInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  )
}
