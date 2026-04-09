"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, ImageIcon, X, AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"]

interface ThumbnailData {
  url: string
  isCustom: boolean
}

interface ThumbnailSelectorProps {
  value: ThumbnailData | null
  onChange: (data: ThumbnailData | null) => void
  videoPreviewUrl?: string
  disabled?: boolean
}

export function ThumbnailSelector({
  value,
  onChange,
  videoPreviewUrl,
  disabled = false
}: ThumbnailSelectorProps) {
  const { t } = useTranslations("shorts")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCustom = value?.isCustom ?? false

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("errors.invalidThumbnail"))
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("errors.thumbnailTooLarge"))
      return false
    }

    return true
  }, [t])

  const uploadFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return

    setUploading(true)
    setError(null)

    try {
      // Get presigned URL
      const response = await fetch("/api/shorts/thumbnail-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, fileName: file.name })
      })

      if (!response.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { uploadUrl, publicUrl } = await response.json() as { uploadUrl: string; publicUrl: string }

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      onChange({ url: publicUrl, isCustom: true })
    } catch (err) {
      console.error("Thumbnail upload error:", err)
      setError(t("errors.uploadFailed"))
    } finally {
      setUploading(false)
    }
  }, [validateFile, onChange, t])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    e.target.value = ""
  }, [uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }, [disabled, uploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || uploading) return

    const file = e.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }, [disabled, uploading, uploadFile])

  const handleAutoSelect = useCallback(() => {
    onChange({ url: "", isCustom: false })
    setError(null)
  }, [onChange])

  const handleCustomSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveCustom = useCallback(() => {
    onChange({ url: "", isCustom: false })
    setError(null)
  }, [onChange])

  return (
    <div className="space-y-6">
      {/* Selection options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Auto-generated option */}
        <button
          type="button"
          onClick={handleAutoSelect}
          disabled={disabled || uploading}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-colors",
            !isCustom
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            (disabled || uploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Selection indicator */}
          <div className={cn(
            "absolute top-3 right-3 h-4 w-4 rounded-full border-2",
            !isCustom ? "border-primary bg-primary" : "border-muted-foreground/50"
          )}>
            {!isCustom && (
              <div className="absolute inset-1 rounded-full bg-white" />
            )}
          </div>

          <div className="rounded-full bg-muted p-3 mb-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <Label className="font-medium">{t("wizard.thumbnail.auto")}</Label>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {t("wizard.thumbnail.autoDescription")}
          </p>

          {/* Show video frame as preview if auto selected */}
          {!isCustom && videoPreviewUrl && (
            <div className="mt-4 w-full aspect-[9/16] max-h-32 rounded overflow-hidden bg-muted">
              <video
                src={videoPreviewUrl}
                className="w-full h-full object-cover"
                muted
              />
            </div>
          )}
        </button>

        {/* Custom upload option */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-colors",
            isCustom
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            (disabled || uploading) && "opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Selection indicator */}
          <div className={cn(
            "absolute top-3 right-3 h-4 w-4 rounded-full border-2",
            isCustom ? "border-primary bg-primary" : "border-muted-foreground/50"
          )}>
            {isCustom && (
              <div className="absolute inset-1 rounded-full bg-white" />
            )}
          </div>

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-sm text-muted-foreground">
                {t("wizard.thumbnail.uploading")}
              </p>
            </div>
          ) : isCustom && value?.url ? (
            <div className="relative w-full">
              <img
                src={value.url}
                alt="Custom thumbnail"
                className="w-full aspect-[9/16] max-h-40 object-cover rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveCustom()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3 mb-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <Label className="font-medium">{t("wizard.thumbnail.custom")}</Label>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {t("wizard.thumbnail.customDescription")}
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleCustomSelect}
                disabled={disabled}
              >
                {t("wizard.thumbnail.upload")}
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                {t("wizard.thumbnail.requirements")}
              </p>
            </>
          )}

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <p className="font-medium text-primary">{t("wizard.thumbnail.dragAndDrop")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  )
}
