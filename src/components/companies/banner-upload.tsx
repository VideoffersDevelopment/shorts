"use client"

import { useState, useCallback, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useTranslations } from '@/lib/i18n/client'
import { ImageIcon, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BannerUploadProps {
  currentBanner?: string | null
  onBannerChange: (url: string | null) => void
}

export function BannerUpload({ currentBanner, onBannerChange }: BannerUploadProps) {
  const { t } = useTranslations('companies')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const processFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('banner.errors.invalidType'))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('banner.errors.tooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setShowCropModal(true)
      setCompletedCrop(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [t])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget

    // Use makeAspectCrop to create a crop with correct aspect ratio from the start
    const newCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        4.8, // Banner aspect ratio
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    )

    setCrop(newCrop)

    // Also set completed crop for immediate button enable
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (newCrop.x / 100) * width,
      y: (newCrop.y / 100) * height,
      width: (newCrop.width / 100) * width,
      height: (newCrop.height / 100) * height
    }

    setCompletedCrop(pixelCrop)
  }, [])

  const getCroppedBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !imageRef.current) {
        reject(new Error('No crop data'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }

      const scaleX = imageRef.current.naturalWidth / imageRef.current.width
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height

      canvas.width = completedCrop.width
      canvas.height = completedCrop.height

      ctx.drawImage(
        imageRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      )

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas to Blob failed'))
        }
      }, 'image/jpeg', 0.95)
    })
  }, [completedCrop])

  const handleCropConfirm = useCallback(async () => {
    if (!completedCrop) return

    setUploading(true)

    try {
      const croppedBlob = await getCroppedBlob()
      setShowCropModal(false)

      if (currentBanner) {
        await fetch('/api/companies/banner', { method: 'DELETE' })
      }

      const response = await fetch('/api/companies/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg' })
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await response.json() as { uploadUrl: string; publicUrl: string }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: croppedBlob,
        headers: { 'Content-Type': 'image/jpeg' }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      onBannerChange(publicUrl)
      toast.success(t('banner.success'))
    } catch (err) {
      console.error('Banner upload error:', err)
      toast.error(t('banner.errors.uploadFailed'))
    } finally {
      setUploading(false)
      setSelectedImage(null)
    }
  }, [completedCrop, currentBanner, getCroppedBlob, onBannerChange, t])

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false)
    setSelectedImage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <>
      <div className="space-y-2">
        <div
          className={cn(
            "relative h-48 w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {currentBanner ? (
            <img
              src={currentBanner}
              alt="Company banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>{t('banner.dragAndDrop')}</span>
              </div>
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-sm font-medium">{t('banner.dropHere')}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={uploading}
          >
            {uploading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            {uploading ? t('banner.uploading') : t('banner.upload')}
          </Button>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('banner.title')}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            {selectedImage ? (
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={4.8}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Crop preview"
                  style={{ maxHeight: '500px' }}
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCropCancel}>
              {t('banner.cancel')}
            </Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop}>
              {t('banner.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
