"use client"

import { useState, useCallback, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useTranslations } from '@/lib/i18n/client'
import { deleteAvatarAction } from '@/app/actions/profile/delete-avatar'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatar?: string | null
  userEmail: string
  onAvatarChange: (url: string | null) => void
}

export function AvatarUpload({ currentAvatar, userEmail, onAvatarChange }: AvatarUploadProps) {
  const { t } = useTranslations('profile')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(t('errors.invalidFileType'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.fileTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setShowCropModal(true)
      setCompletedCrop(null) // Reset completed crop for new image
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [t])

  // Calculate initial completedCrop when image loads
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const width = img.width
    const height = img.height

    // Calculate initial crop area in pixels from percentage-based crop
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (crop.x / 100) * width,
      y: (crop.y / 100) * height,
      width: (crop.width / 100) * width,
      height: (crop.height / 100) * height
    }

    setCompletedCrop(pixelCrop)
  }, [crop.x, crop.y, crop.width, crop.height])

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
      // 1. Get cropped image as blob BEFORE closing modal (imageRef needs to exist)
      const croppedBlob = await getCroppedBlob()

      // 2. Now close the modal (imageRef no longer needed)
      setShowCropModal(false)

      // 3. Delete old avatar if exists
      if (currentAvatar) {
        await fetch('/api/users/me/avatar', { method: 'DELETE' })
      }

      // 4. Get presigned URL
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg' })
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await response.json() as { uploadUrl: string; publicUrl: string }

      // 5. Upload cropped blob to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: croppedBlob,
        headers: { 'Content-Type': 'image/jpeg' }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // 6. Update profile with new avatar URL
      onAvatarChange(publicUrl)
      toast.success(t('avatarUploaded'))
    } catch (err) {
      console.error('Avatar upload error:', err)
      toast.error(t('errors.uploadFailed'))
    } finally {
      setUploading(false)
      setSelectedImage(null)
    }
  }, [completedCrop, currentAvatar, getCroppedBlob, onAvatarChange, t])

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false)
    setSelectedImage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDelete = useCallback(async () => {
    if (!confirm(t('confirmRemoveAvatar'))) return

    setDeleting(true)
    setError(null)

    try {
      const result = await deleteAvatarAction()
      if (result.error) {
        toast.error(result.error)
      } else {
        onAvatarChange(null)
        toast.success(t('avatarRemoved'))
      }
    } catch (err) {
      console.error('Avatar delete error:', err)
      toast.error(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }, [onAvatarChange, t])

  const getInitials = useCallback((email: string): string => {
    return email.substring(0, 2).toUpperCase()
  }, [])

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentAvatar ?? undefined} alt={userEmail} />
          <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting}
            >
              {uploading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {uploading ? t('saving') : t('changeAvatar')}
            </Button>

            {currentAvatar ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={uploading || deleting}
              >
                {deleting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {deleting ? t('removing') : t('removeAvatar')}
              </Button>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('cropAvatar')}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            {selectedImage ? (
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={1}
                circularCrop
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
              {t('cancel')}
            </Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop}>
              {t('saveAvatar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
