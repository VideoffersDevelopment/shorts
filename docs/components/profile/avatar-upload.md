# AvatarUpload Component

Avatar upload component with image cropping and deletion functionality.

**File:** `src/components/profile/avatar-upload.tsx`
**Type:** Client Component
**Dependencies:** react-image-crop, Cloudflare R2

---

## Overview

The AvatarUpload component provides a complete avatar management solution including file selection, client-side image cropping, direct upload to R2 storage, and deletion with automatic cleanup.

### Key Features

- File selection with type and size validation
- Image cropping with react-image-crop (circular preview, 1:1 aspect)
- Direct upload to Cloudflare R2 using presigned URLs
- Avatar deletion with confirmation dialog
- Automatic cleanup of old avatars when uploading new ones
- Loading states for upload and delete operations
- Error handling with user-friendly messages
- Multi-language support (5 languages)

---

## Props

```typescript
interface AvatarUploadProps {
  currentAvatar?: string | null
  userEmail: string
  onAvatarChange: (url: string | null) => void
}
```

| Prop            | Type                             | Required | Default | Description                              |
|-----------------|----------------------------------|----------|---------|------------------------------------------|
| currentAvatar   | string \| null \| undefined      | No       | -       | Current avatar URL (R2 public URL)       |
| userEmail       | string                           | Yes      | -       | User email for initials fallback         |
| onAvatarChange  | (url: string \| null) => void    | Yes      | -       | Callback when avatar changes             |

---

## Usage

### Basic Usage

```tsx
import { AvatarUpload } from '@/components/profile/avatar-upload'

export default function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  return (
    <AvatarUpload
      currentAvatar={avatarUrl}
      userEmail="user@example.com"
      onAvatarChange={setAvatarUrl}
    />
  )
}
```

### Within ProfileForm

```tsx
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { updateProfileAction } from '@/app/actions/profile/update-profile'

export function ProfileForm({ user, profile }) {
  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    const result = await updateProfileAction({
      avatar: newAvatarUrl
    })

    if (result.success) {
      // Update local state
      setProfile({ ...profile, avatar: newAvatarUrl })
    }
  }

  return (
    <form>
      <AvatarUpload
        currentAvatar={profile.avatar}
        userEmail={user.email}
        onAvatarChange={handleAvatarChange}
      />
      {/* Other form fields */}
    </form>
  )
}
```

### With Null Avatar

```tsx
// Component handles null/undefined gracefully, shows initials
<AvatarUpload
  currentAvatar={null}
  userEmail="jane.doe@example.com"
  onAvatarChange={handleChange}
/>
// Displays: "JA" as fallback
```

---

## User Flow

### Upload Flow

1. **File Selection**
   - User clicks "Change picture" button
   - File picker opens (accepts `image/*`)
   - User selects image file

2. **Validation**
   - File type validated (must start with `image/`)
   - File size validated (max 5MB)
   - Errors shown immediately if validation fails

3. **Cropping**
   - Image loaded into cropping modal
   - react-image-crop interface displayed
   - User can drag and resize crop area
   - Circular preview, 1:1 aspect ratio enforced
   - "Cancel" returns to previous state
   - "Save" proceeds to upload

4. **Upload**
   - Cropped portion extracted to canvas
   - Canvas converted to Blob (JPEG, 0.95 quality)
   - Old avatar deleted from R2 (if exists)
   - Presigned URL requested from API
   - Blob uploaded directly to R2
   - `onAvatarChange` called with new public URL

### Delete Flow

1. **Initiation**
   - User clicks "Remove avatar" button (only visible if avatar exists)
   - Browser confirmation dialog appears

2. **Confirmation**
   - User confirms deletion
   - `deleteAvatarAction` server action called

3. **Deletion**
   - Avatar file deleted from R2 storage
   - Database updated (avatar set to NULL)
   - Path revalidated for cache invalidation
   - `onAvatarChange` called with `null`
   - UI updates to show initials fallback

---

## States

### Visual States

**No Avatar:**
```tsx
// Shows avatar with initials fallback
// "Change picture" button visible
// "Remove avatar" button hidden
```

**With Avatar:**
```tsx
// Shows avatar image
// Both "Change picture" and "Remove avatar" buttons visible
```

**Uploading:**
```tsx
// "Change picture" button shows loading spinner
// Text changes to "Saving..."
// Both buttons disabled
```

**Deleting:**
```tsx
// "Remove avatar" button shows loading spinner
// Text changes to "Removing..."
// Both buttons disabled
```

**Error:**
```tsx
// Error message displayed below buttons
// Red text (text-destructive)
```

### Internal State

```typescript
const [uploading, setUploading] = useState(false)
const [deleting, setDeleting] = useState(false)
const [error, setError] = useState<string | null>(null)
const [showCropModal, setShowCropModal] = useState(false)
const [selectedImage, setSelectedImage] = useState<string | null>(null)
const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 })
const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
```

---

## Error Handling

### Validation Errors

| Error              | Trigger                    | Message                          |
|--------------------|----------------------------|----------------------------------|
| Invalid file type  | Non-image file selected    | "Invalid file type"              |
| File too large     | File > 5MB                 | "File is too large (max 5MB)"    |

### Upload Errors

| Error                   | Trigger                     | Message                          |
|-------------------------|-----------------------------|----------------------------------|
| Failed to get URL       | API error                   | "Upload failed"                  |
| Upload to R2 failed     | R2 upload error             | "Upload failed"                  |
| Canvas conversion error | Browser API failure         | "Upload failed"                  |

### Deletion Errors

| Error                | Trigger                  | Message                          |
|----------------------|--------------------------|----------------------------------|
| Unauthorized         | No session               | Error from server action         |
| Deletion failed      | R2 or DB error           | "Failed to delete image"         |

---

## Accessibility

### ARIA Attributes

- File input has `accept="image/*"` attribute
- Buttons have descriptive text (no icon-only buttons)
- Dialog has proper `role="dialog"` and `aria-labelledby`
- Loading states announced via button text changes

### Keyboard Navigation

- Tab through buttons in logical order
- Enter/Space to activate buttons
- Escape to close cropping modal
- File input accessible via keyboard (triggered by button)

### Screen Readers

- Avatar has alt text with user email
- Fallback text uses initials for clarity
- Button states clearly announced (Saving..., Removing...)
- Error messages associated with form control

---

## Internationalization

### Translation Namespace

`profile`

### Translation Keys

```json
{
  "changeAvatar": "Change picture",
  "removeAvatar": "Remove avatar",
  "cropAvatar": "Crop image",
  "saveAvatar": "Save image",
  "confirmRemoveAvatar": "Are you sure you want to remove your profile picture?",
  "saving": "Saving...",
  "removing": "Removing...",
  "cancel": "Cancel",
  "errors": {
    "invalidFileType": "Invalid file type",
    "fileTooLarge": "File is too large (max 5MB)",
    "uploadFailed": "Upload failed",
    "deleteFailed": "Failed to delete image"
  }
}
```

### Supported Languages

- Polish (pl) - Primary
- English (en)
- German (de)
- Spanish (es)
- Russian (ru)

---

## Dependencies

### NPM Packages

```json
{
  "react-image-crop": "^11.0.7"
}
```

### Internal Dependencies

- `@/components/ui/avatar` - Avatar display component
- `@/components/ui/button` - Button component
- `@/components/ui/dialog` - Modal dialog
- `@/components/shared/loading-spinner` - Loading spinner
- `@/lib/i18n/client` - i18n hooks
- `@/app/actions/profile/delete-avatar` - Delete avatar action

### External Services

- **Cloudflare R2:** Avatar storage
- **API Route:** `/api/users/me/avatar` (POST for presigned URL, DELETE for cleanup)

---

## Technical Details

### Image Cropping

**Library:** react-image-crop v11.0.7

**Configuration:**
```tsx
<ReactCrop
  crop={crop}
  onChange={setCrop}
  onComplete={setCompletedCrop}
  aspect={1}              // 1:1 square crop
  circularCrop            // Circular preview overlay
>
  <img ref={imageRef} src={selectedImage} />
</ReactCrop>
```

**Canvas Extraction:**
```typescript
const getCroppedBlob = (): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Calculate scale between displayed and natural image size
  const scaleX = imageRef.current.naturalWidth / imageRef.current.width
  const scaleY = imageRef.current.naturalHeight / imageRef.current.height

  canvas.width = completedCrop.width
  canvas.height = completedCrop.height

  // Draw cropped portion
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

  // Convert to blob (JPEG, 95% quality)
  return canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
}
```

### R2 Upload Flow

1. **Request Presigned URL:**
```typescript
const response = await fetch('/api/users/me/avatar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contentType: 'image/jpeg' })
})

const { uploadUrl, publicUrl } = await response.json()
```

2. **Upload to R2:**
```typescript
await fetch(uploadUrl, {
  method: 'PUT',
  body: croppedBlob,
  headers: { 'Content-Type': 'image/jpeg' }
})
```

3. **Update Profile:**
```typescript
onAvatarChange(publicUrl)
```

### Cleanup on Upload

Before uploading new avatar, old avatar is deleted:

```typescript
if (currentAvatar) {
  await fetch('/api/users/me/avatar', { method: 'DELETE' })
}
```

This ensures no orphaned files in R2 storage.

---

## Testing

### Test File
`src/components/profile/avatar-upload.test.tsx`

### Test Coverage

**23 tests covering:**
- Rendering (avatar, buttons, file input)
- Props handling (null, undefined, initials)
- File selection and validation
- Cropping modal (open, cancel, save)
- Avatar deletion flow
- Loading states
- Error states
- Accessibility

**6 tests skipped:**
- Full upload flow (jsdom canvas/blob limitations)
- Blob generation from canvas
- Direct R2 upload

**Core functionality fully tested:**
- UI rendering and interactions
- File validation
- API calls
- Error handling
- Deletion flow

---

## Related Documentation

- [Profile Feature](../../features/profile/README.md)
- [deleteAvatar Action](../../api/server-actions/profile.md#deleteavatar)
- [Avatar API Route](../../api/routes/avatar.md)
- [R2 Utilities](../../api/utilities/r2.md)

---

**Created:** 2025-11-28 (task-04)
**Enhanced:** 2025-11-29 (task-08)
**Last Updated:** 2025-11-29
**Test Coverage:** 80%+
