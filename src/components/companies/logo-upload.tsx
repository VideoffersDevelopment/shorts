"use client"

import { useState, useCallback, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useTranslations } from '@/lib/i18n/client'
import { Building2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LogoUploadProps {
  currentLogo?: string | null
  companyName: string
  onLogoChange: (url: string | null) => void
}

export function LogoUpload({ currentLogo, companyName, onLogoChange }: LogoUploadProps) {
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
      setError(t('logo.errors.invalidType'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('logo.errors.tooLarge'))
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
        1, // Logo aspect ratio (square)
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

      if (currentLogo) {
        await fetch('/api/companies/logo', { method: 'DELETE' })
      }

      const response = await fetch('/api/companies/logo', {
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

      onLogoChange(publicUrl)
      toast.success(t('logo.success'))
    } catch (err) {
      console.error('Logo upload error:', err)
      toast.error(t('logo.errors.uploadFailed'))
    } finally {
      setUploading(false)
      setSelectedImage(null)
    }
  }, [completedCrop, currentLogo, getCroppedBlob, onLogoChange, t])

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
            "relative h-24 w-24 overflow-hidden rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {currentLogo ? (
            <img
              src={currentLogo}
              alt={companyName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <Upload className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-sm font-medium">{t('logo.dropHere')}</p>
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
            {uploading ? t('logo.uploading') : t('logo.upload')}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('logo.title')}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            {selectedImage ? (
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={1}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Crop preview"
                  style={{ maxHeight: '400px' }}
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCropCancel}>
              {t('logo.cancel')}
            </Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop}>
              {t('logo.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
