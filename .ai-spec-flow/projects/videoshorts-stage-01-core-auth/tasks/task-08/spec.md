# Task 08: Avatar Upload Enhancements - Cropping & Deletion

## Overview

**Priority:** MEDIUM
**Dependencies:** task-04 (Profile Management - completed)
**Vertical Slice:** Profile - Avatar Management
**Complexity:** Medium (11 files, ~11k tokens)
**Status:** pending

## What to Build

Enhance avatar upload functionality with image cropping before upload and deletion of previous avatar from R2 storage. User can crop uploaded image to desired size/position before saving. When uploading new avatar, automatically delete old avatar file from R2. Only cropped image is stored (not original).

Includes: 1 updated component, 1 new server action for deletion, 1 updated API route, 1 new utility file for R2 deletion, and translation updates for 5 languages.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Server Actions** |
| `src/app/actions/profile/delete-avatar.ts` | Create | Server action to delete avatar from R2 and DB |
| **UI Components (npm packages)** |
| Install `react-image-crop` | Dependency | Image cropping library |
| Install `@types/react-image-crop` | Dependency | TypeScript types for react-image-crop |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/avatar-upload.tsx` | Add cropping modal, delete button, cleanup old avatars |
| `src/app/api/users/me/avatar/route.ts` | Add DELETE endpoint for R2 cleanup, extract old avatar key from DB |
| `src/lib/r2.ts` | Add `deleteObject` function for R2 file deletion |
| `src/lib/locales/pl/profile.json` | Add cropping & deletion translations |
| `src/lib/locales/en/profile.json` | Add cropping & deletion translations |
| `src/lib/locales/de/profile.json` | Add cropping & deletion translations |
| `src/lib/locales/es/profile.json` | Add cropping & deletion translations |
| `src/lib/locales/ru/profile.json` | Add cropping & deletion translations |
| `package.json` | Add react-image-crop dependency |

## Acceptance Criteria

- [ ] User can select image file for avatar
- [ ] Cropping modal opens after file selection
- [ ] User can crop image using drag/resize interface
- [ ] User can cancel cropping (returns to previous avatar)
- [ ] User can confirm crop and upload
- [ ] Only cropped image is uploaded to R2 (not original)
- [ ] "Remove avatar" button appears when avatar exists
- [ ] Clicking remove deletes avatar from R2 and DB
- [ ] Old avatar file is automatically deleted when new one uploaded
- [ ] No orphaned files left in R2 storage
- [ ] Loading states during crop/upload/delete
- [ ] Success/error messages displayed
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Key User Flows

### Avatar Crop & Upload Flow
1. User clicks "Change picture" button
2. File picker opens
3. User selects image file (max 5MB, image/* types)
4. Frontend validates file type and size
5. Cropping modal opens with selected image
6. User adjusts crop area (drag/resize)
7. User clicks "Save" (or "Cancel" to abort)
8. Frontend crops image to canvas blob
9. Frontend calls `/api/users/me/avatar` DELETE → removes old avatar from R2 (if exists)
10. Frontend calls `/api/users/me/avatar` POST → gets presigned URL for new avatar
11. Frontend uploads cropped blob to R2 via presigned URL
12. Frontend calls `updateProfileAction` with new R2 public URL
13. Database updates with new avatar URL
14. Avatar updates in UI
15. Success toast: "Avatar updated"

### Avatar Delete Flow
1. User clicks "Remove avatar" button (only visible if avatar exists)
2. Confirmation dialog appears: "Remove profile picture?"
3. User confirms deletion
4. Frontend calls `deleteAvatarAction`
5. Server action deletes file from R2 (extracts key from URL)
6. Server action updates DB (sets avatar to NULL)
7. UI updates to show initials fallback
8. Success toast: "Avatar removed"

## Server Action Implementation

### deleteAvatarAction (src/app/actions/profile/delete-avatar.ts)

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2"
import { revalidatePath } from "next/cache"

export async function deleteAvatarAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Get current avatar URL from DB
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { avatar: true }
    })

    if (profile?.avatar) {
      // Extract R2 key from public URL
      // URL format: https://{domain}/avatars/{userId}/{timestamp}.{ext}
      const url = new URL(profile.avatar)
      const key = url.pathname.substring(1) // Remove leading "/"

      // Delete from R2
      await deleteObject(key)
    }

    // Update DB - set avatar to NULL
    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: { avatar: null }
    })

    revalidatePath("/panel/profile")
    return { success: true }
  } catch (error) {
    console.error("Delete avatar error:", error)
    return { error: "Failed to delete avatar" }
  }
}
```

## API Route Enhancement

### Avatar API (src/app/api/users/me/avatar/route.ts)

```typescript
// Add DELETE handler for old avatar cleanup
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get current avatar URL from DB
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { avatar: true }
    })

    if (profile?.avatar) {
      // Extract R2 key from public URL
      const url = new URL(profile.avatar)
      const key = url.pathname.substring(1) // Remove leading "/"

      // Delete from R2
      await deleteObject(key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete avatar error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
```

## R2 Utility Enhancement

### Add deleteObject to src/lib/r2.ts

```typescript
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

// Add this function to existing r2.ts file
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  })

  await r2Client.send(command)
}
```

## Component Implementation

### Enhanced AvatarUpload (src/components/profile/avatar-upload.tsx)

```typescript
"use client"

import { useState, useCallback, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useTranslations } from '@/lib/i18n/client'
import { deleteAvatarAction } from '@/app/actions/profile/delete-avatar'

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
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [t])

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
    setShowCropModal(false)

    try {
      // 1. Delete old avatar if exists
      if (currentAvatar) {
        await fetch('/api/users/me/avatar', { method: 'DELETE' })
      }

      // 2. Get cropped image as blob
      const croppedBlob = await getCroppedBlob()

      // 3. Get presigned URL
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg' })
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await response.json() as { uploadUrl: string; publicUrl: string }

      // 4. Upload cropped blob to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: croppedBlob,
        headers: { 'Content-Type': 'image/jpeg' }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // 5. Update profile with new avatar URL
      onAvatarChange(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setError(t('errors.uploadFailed'))
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
        setError(result.error)
      } else {
        onAvatarChange(null)
      }
    } catch (err) {
      console.error('Avatar delete error:', err)
      setError(t('errors.deleteFailed'))
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
```

## Translation Files

### pl/profile.json (additions)
```json
{
  "cropAvatar": "Kadruj zdjęcie",
  "saveAvatar": "Zapisz zdjęcie",
  "confirmRemoveAvatar": "Czy na pewno chcesz usunąć zdjęcie profilowe?",
  "removing": "Usuwanie...",
  "cancel": "Anuluj",
  "errors": {
    "invalidFileType": "Nieprawidłowy typ pliku",
    "fileTooLarge": "Plik jest za duży (max 5MB)",
    "deleteFailed": "Nie udało się usunąć zdjęcia"
  }
}
```

### en/profile.json (additions)
```json
{
  "cropAvatar": "Crop image",
  "saveAvatar": "Save image",
  "confirmRemoveAvatar": "Are you sure you want to remove your profile picture?",
  "removing": "Removing...",
  "cancel": "Cancel",
  "errors": {
    "invalidFileType": "Invalid file type",
    "fileTooLarge": "File is too large (max 5MB)",
    "deleteFailed": "Failed to delete image"
  }
}
```

### de/profile.json (additions)
```json
{
  "cropAvatar": "Bild zuschneiden",
  "saveAvatar": "Bild speichern",
  "confirmRemoveAvatar": "Möchten Sie Ihr Profilbild wirklich entfernen?",
  "removing": "Wird entfernt...",
  "cancel": "Abbrechen",
  "errors": {
    "invalidFileType": "Ungültiger Dateityp",
    "fileTooLarge": "Datei ist zu groß (max 5MB)",
    "deleteFailed": "Bild konnte nicht gelöscht werden"
  }
}
```

### es/profile.json (additions)
```json
{
  "cropAvatar": "Recortar imagen",
  "saveAvatar": "Guardar imagen",
  "confirmRemoveAvatar": "¿Estás seguro de que quieres eliminar tu foto de perfil?",
  "removing": "Eliminando...",
  "cancel": "Cancelar",
  "errors": {
    "invalidFileType": "Tipo de archivo inválido",
    "fileTooLarge": "El archivo es demasiado grande (máx 5MB)",
    "deleteFailed": "Error al eliminar la imagen"
  }
}
```

### ru/profile.json (additions)
```json
{
  "cropAvatar": "Обрезать изображение",
  "saveAvatar": "Сохранить изображение",
  "confirmRemoveAvatar": "Вы уверены, что хотите удалить фото профиля?",
  "removing": "Удаление...",
  "cancel": "Отмена",
  "errors": {
    "invalidFileType": "Недопустимый тип файла",
    "fileTooLarge": "Файл слишком большой (макс 5МБ)",
    "deleteFailed": "Не удалось удалить изображение"
  }
}
```

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: Use $TEST_USER_EMAIL / $TEST_USER_PASSWORD from .env.local
- Logged in session
- Existing avatar uploaded (from Task 04)

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to profile | Profile page loads with current avatar | `/pl/panel/profile` |
| 2 | Verify "Remove avatar" button | Button visible next to "Change picture" | `button:has-text("Usuń zdjęcie")` |
| 3 | Click "Change picture" | File picker opens | `input[type="file"]` |
| 4 | Select image file | Cropping modal opens | `[role="dialog"]` |
| 5 | Verify crop interface | ReactCrop component visible with circular crop area | `.ReactCrop` |
| 6 | Drag crop area | Crop area moves with cursor | - |
| 7 | Resize crop area | Crop area resizes maintaining 1:1 aspect | - |
| 8 | Click "Zapisz zdjęcie" | Modal closes, upload starts | `button:has-text("Zapisz zdjęcie")` |
| 9 | Wait for upload | Loading spinner shown | `.loading-spinner` |
| 10 | Verify new avatar | Cropped avatar displayed in UI | `.avatar img` |
| 11 | Check R2 storage | Old avatar file deleted, only new cropped file exists | - |
| 12 | Click "Usuń zdjęcie" | Confirmation dialog appears | `button:has-text("Usuń zdjęcie")` |
| 13 | Confirm deletion | Avatar removed, initials fallback shown | - |
| 14 | Verify success toast | "Avatar removed" message displayed | `[role="status"]` |
| 15 | Check DB | UserProfile.avatar is NULL | - |

### Screenshot Checkpoints
- `01-profile-with-avatar.png` - Profile page with avatar and both buttons
- `02-crop-modal.png` - Cropping modal with ReactCrop interface
- `03-crop-preview.png` - Adjusted crop area (dragged/resized)
- `04-uploading.png` - Loading state during upload
- `05-new-avatar.png` - Profile with newly cropped avatar
- `06-confirm-delete.png` - Delete confirmation dialog
- `07-avatar-removed.png` - Profile with initials fallback (no avatar)

## Notes

1. **Cropping library:** Use `react-image-crop` (MIT license, well-maintained)
2. **Crop settings:** 1:1 aspect ratio, circular crop preview
3. **Image format:** Always save as JPEG with 0.95 quality (good balance)
4. **R2 cleanup:** Old avatar deleted BEFORE uploading new one
5. **URL parsing:** Extract R2 key from public URL using `URL.pathname.substring(1)`
6. **File validation:** Client-side (type, size) + server-side (type)
7. **Confirmation:** Native `confirm()` dialog for delete (simple UX)
8. **Loading states:** Separate states for uploading vs deleting
9. **Error handling:** Try/catch with user-friendly messages
10. **No orphaned files:** Every upload operation cleans up previous avatar
11. **Canvas blob:** Use `canvas.toBlob()` to convert cropped area to blob
12. **Circular crop:** `circularCrop` prop in ReactCrop for better preview
13. **Max file size:** 5MB validated before showing crop modal
14. **Revalidation:** `revalidatePath()` after delete to refresh UI

## Package.json Changes

```json
{
  "dependencies": {
    "react-image-crop": "^11.0.7"
  },
  "devDependencies": {
    "@types/react-image-crop": "^8.0.2"
  }
}
```

## Implementation Order

1. Install `react-image-crop` package
2. Add `deleteObject` to `src/lib/r2.ts`
3. Create `deleteAvatarAction` server action
4. Add DELETE handler to `/api/users/me/avatar/route.ts`
5. Update `avatar-upload.tsx` with cropping + delete UI
6. Update all 5 translation files
7. Test crop → upload → verify old file deleted
8. Test delete → verify R2 cleanup + DB update
9. Run `npm run build` to verify no errors
