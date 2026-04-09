# Profile Management Feature

**Status:** Complete
**Tasks:** task-04 (Profile Management), task-08 (Avatar Enhancements)
**Stage:** Stage 01 - Core Auth

---

## Overview

Complete user profile management system with avatar upload, cropping, and deletion capabilities. Users can customize their profiles with display name, bio, location, and profile picture.

### User Stories

- As a user, I can upload a profile picture and crop it before saving
- As a user, I can delete my profile picture to revert to initials
- As a user, I can edit my display name, bio, and location
- As a user, I can see my profile picture throughout the application

### Key Functionality

- **Avatar Upload:** Direct upload to Cloudflare R2 with presigned URLs
- **Image Cropping:** Client-side cropping with circular preview (1:1 aspect)
- **Avatar Deletion:** Complete removal from R2 storage and database
- **Profile Editing:** Real-time validation with internationalized forms
- **Auto-cleanup:** Old avatars automatically deleted when uploading new ones

---

## Implementation

### Database Models

| Model       | Purpose               | Key Fields                                    |
|-------------|-----------------------|-----------------------------------------------|
| User        | Core user entity      | id, email, role, emailVerified                |
| UserProfile | Extended profile data | userId, displayName, avatar, bio, darkMode    |

### Server Actions

| Action          | File                                         | Purpose                        |
|-----------------|----------------------------------------------|--------------------------------|
| updateProfile   | src/app/actions/profile/update-profile.ts    | Update profile data            |
| deleteAvatar    | src/app/actions/profile/delete-avatar.ts     | Delete avatar from R2 and DB   |

### API Routes

| Route                   | Methods       | Purpose                              |
|-------------------------|---------------|--------------------------------------|
| /api/users/me/avatar    | POST, DELETE  | Generate presigned URL, delete avatar|

### Components

| Component      | File                                   | Purpose                        |
|----------------|----------------------------------------|--------------------------------|
| ProfileForm    | src/components/profile/profile-form.tsx| Profile editing form           |
| AvatarUpload   | src/components/profile/avatar-upload.tsx| Avatar upload with cropping    |

### Utilities

| Utility        | File              | Functions                                      |
|----------------|-------------------|------------------------------------------------|
| R2             | src/lib/r2.ts     | getUploadUrl, getPublicUrl, deleteObject       |

---

## Avatar Upload & Cropping Flow

### User Journey

1. User clicks "Change picture" button
2. File picker opens, user selects image (max 5MB)
3. Frontend validates file type and size
4. Cropping modal opens with react-image-crop interface
5. User adjusts crop area (drag/resize, 1:1 aspect, circular preview)
6. User clicks "Save" to confirm crop
7. Frontend generates cropped blob from canvas
8. If old avatar exists, DELETE request removes it from R2
9. POST request to /api/users/me/avatar gets presigned URL
10. Cropped blob uploaded directly to R2
11. Profile updated with new avatar URL
12. UI reflects new avatar immediately

### Technical Flow

```typescript
// 1. File Selection & Validation
const handleFileSelect = (file: File) => {
  if (!file.type.startsWith('image/')) throw new Error('Invalid type')
  if (file.size > 5 * 1024 * 1024) throw new Error('File too large')

  // Load image for cropping
  const reader = new FileReader()
  reader.onload = () => setSelectedImage(reader.result)
  reader.readAsDataURL(file)
}

// 2. Cropping with react-image-crop
<ReactCrop
  crop={crop}
  onChange={setCrop}
  onComplete={setCompletedCrop}
  aspect={1}
  circularCrop
>
  <img ref={imageRef} src={selectedImage} />
</ReactCrop>

// 3. Generate Cropped Blob
const getCroppedBlob = (): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Draw cropped portion to canvas
  ctx.drawImage(imageRef.current, /* cropped coordinates */)

  // Convert to blob
  return canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95)
}

// 4. Delete Old Avatar (if exists)
if (currentAvatar) {
  await fetch('/api/users/me/avatar', { method: 'DELETE' })
}

// 5. Upload New Avatar
const { uploadUrl, publicUrl } = await fetch('/api/users/me/avatar', {
  method: 'POST',
  body: JSON.stringify({ contentType: 'image/jpeg' })
}).then(r => r.json())

await fetch(uploadUrl, {
  method: 'PUT',
  body: croppedBlob,
  headers: { 'Content-Type': 'image/jpeg' }
})

// 6. Update UI
onAvatarChange(publicUrl)
```

---

## Avatar Deletion Flow

### User Journey

1. User clicks "Remove avatar" button (only visible if avatar exists)
2. Browser confirmation dialog appears
3. User confirms deletion
4. Server action extracts R2 key from avatar URL
5. Avatar deleted from R2 storage
6. Database updated (avatar set to NULL)
7. UI updates to show initials fallback
8. Success feedback shown

### Technical Flow

```typescript
// deleteAvatarAction implementation
export async function deleteAvatarAction() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // Get current avatar URL from DB
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { avatar: true }
  })

  if (profile?.avatar) {
    // Extract R2 key from public URL
    // URL format: https://{domain}/avatars/{userId}/{timestamp}.jpg
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
}
```

---

## Features & Validation

### File Validation

**Client-side:**
- File type: Must start with `image/`
- File size: Maximum 5MB
- Immediate feedback on validation errors

**Server-side:**
- Content-Type verification on upload
- Presigned URL security (expires in 1 hour)

### Crop Settings

- **Aspect Ratio:** 1:1 (square crop)
- **Preview:** Circular crop overlay
- **Output Format:** JPEG with 0.95 quality
- **Initial Crop:** 90% of image, centered

### R2 Storage

**Upload Flow:**
1. Client requests presigned URL from API
2. Server generates presigned URL with 1-hour expiry
3. Client uploads directly to R2 (no server bandwidth)
4. Public URL returned for database storage

**Deletion Flow:**
1. Extract key from public URL
2. Send DeleteObjectCommand to R2
3. No error if file doesn't exist (idempotent)

**URL Format:**
```
https://{R2_PUBLIC_URL}/avatars/{userId}/{timestamp}.jpg

Example:
https://cdn.videoshorts.pl/avatars/clxy123abc/1732896123456.jpg
```

---

## Error Handling

### Upload Errors

| Error                    | Cause                          | User Message                    |
|--------------------------|--------------------------------|---------------------------------|
| Invalid file type        | Non-image file selected        | "Invalid file type"             |
| File too large           | File > 5MB                     | "File is too large (max 5MB)"   |
| Upload failed            | R2 upload error                | "Upload failed"                 |
| Failed to get upload URL | API error                      | "Failed to get upload URL"      |
| Canvas to Blob failed    | Browser canvas API error       | "Canvas to Blob failed"         |

### Deletion Errors

| Error                 | Cause                     | User Message                     |
|-----------------------|---------------------------|----------------------------------|
| Unauthorized          | No session                | "Unauthorized"                   |
| Failed to delete      | R2 or DB error            | "Failed to delete avatar"        |

---

## Internationalization

Translations provided in 5 languages:

### Translation Keys (profile namespace)

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

**Supported Languages:**
- Polish (pl)
- English (en)
- German (de)
- Spanish (es)
- Russian (ru)

---

## Testing

### Test Coverage

**Task-08 Tests:** 36 tests (530 total project tests)
- AvatarUpload component: 23 tests
- deleteAvatarAction: 13 tests
- R2 deleteObject utility: 5 tests (in overall r2.test.ts)

### Test Categories

**Component Tests (avatar-upload.test.tsx):**
- Rendering (avatar display, buttons, file input)
- Props handling (null, undefined, email initials)
- File selection (validation, errors, size limit)
- Cropping modal (ReactCrop, cancel, save)
- Avatar deletion (confirmation, success, errors)
- Loading states (uploading, deleting, spinners)
- Error states (API failures, R2 failures)
- Accessibility (roles, labels, dialog)

**Server Action Tests (delete-avatar.test.ts):**
- Happy path (with/without avatar)
- Authentication failures
- Database errors
- R2 deletion errors
- URL parsing edge cases
- Cache revalidation

### Known Limitations

**6 tests skipped** due to jsdom canvas/blob mocking limitations:
- Full upload flow simulation
- Blob generation from canvas
- Direct R2 upload testing

**Core functionality fully tested:**
- Rendering and UI interactions
- File validation
- API calls and error handling
- Deletion flow
- Database operations

---

## Related Documentation

- [AvatarUpload Component](../../components/profile/avatar-upload.md)
- [ProfileForm Component](../../components/profile/profile-form.md)
- [deleteAvatar Action](../../api/server-actions/profile.md#deleteavatar)
- [updateProfile Action](../../api/server-actions/profile.md#updateprofile)
- [R2 Utilities](../../api/utilities/r2.md)
- [UserProfile Model](../../database/models/user-profile.md)

---

**Implemented:** 2025-11-28 (task-04), Enhanced: 2025-11-29 (task-08)
**Last Updated:** 2025-11-29
**Test Coverage:** 80%+
