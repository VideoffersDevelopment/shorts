"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Video, X, AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_DURATION = 60 // 60 seconds
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"]

interface VideoData {
  key: string
  duration: number
  aspectRatio: string
  previewUrl: string
}

interface VideoDropzoneProps {
  onVideoUploaded: (data: VideoData) => void
  disabled?: boolean
}

export function VideoDropzone({ onVideoUploaded, disabled = false }: VideoDropzoneProps) {
  const { t } = useTranslations("shorts")
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getVideoDuration = useCallback((file: File): Promise<{ duration: number; aspectRatio: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.preload = "metadata"

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = Math.round(video.duration)
        const aspectRatio = `${video.videoWidth}:${video.videoHeight}`
        resolve({ duration, aspectRatio })
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        reject(new Error("Failed to load video metadata"))
      }

      video.src = URL.createObjectURL(file)
    })
  }, [])

  const validateFile = useCallback(async (file: File): Promise<{ valid: boolean; error?: string; metadata?: { duration: number; aspectRatio: string } }> => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: t("errors.invalidVideo") }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: t("errors.videoTooLarge") }
    }

    // Check duration
    try {
      const metadata = await getVideoDuration(file)
      if (metadata.duration > MAX_DURATION) {
        return { valid: false, error: t("errors.videoTooLong") }
      }
      return { valid: true, metadata }
    } catch {
      return { valid: false, error: t("errors.invalidVideo") }
    }
  }, [getVideoDuration, t])

  const uploadFile = useCallback(async (file: File, metadata: { duration: number; aspectRatio: string }) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Get presigned URL
      const response = await fetch("/api/shorts/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const { uploadUrl, key } = await response.json() as { uploadUrl: string; key: string }

      // Upload with XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(percent)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed: Network error"))
        })

        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file)

      onVideoUploaded({
        key,
        duration: metadata.duration,
        aspectRatio: metadata.aspectRatio,
        previewUrl
      })
    } catch {
      setError(t("errors.uploadFailed"))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [onVideoUploaded, t])

  const processFile = useCallback(async (file: File) => {
    const validation = await validateFile(file)

    if (!validation.valid || !validation.metadata) {
      setError(validation.error ?? t("errors.invalidVideo"))
      return
    }

    await uploadFile(file, validation.metadata)
  }, [validateFile, uploadFile, t])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }, [processFile])

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
      processFile(file)
    }
  }, [disabled, uploading, processFile])

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, uploading])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (uploading || disabled) && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <div className="text-center">
              <p className="font-medium">{t("wizard.video.uploading")}</p>
              <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">
                  {isDragging ? t("wizard.video.dropHere") : t("wizard.video.dragAndDrop")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("wizard.video.browse")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("wizard.video.requirements")}
              </p>
            </div>

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="flex items-center gap-2">
                  <Upload className="h-6 w-6 text-primary" />
                  <p className="font-medium text-primary">{t("wizard.video.dropHere")}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              clearError()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  )
}
