# Task 04: Profile Management

## Overview

**Priority:** MEDIUM
**Dependencies:** task-02
**Complexity:** Medium (14 files, ~14k tokens)
**Status:** pending

## What to Build

User profile management system with profile editing (name, bio, location), avatar upload to Cloudflare R2, geolocation picker, and profile display page. Includes 1 page, 3 components, 1 server action, 1 API route, and translation files for 5 languages.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Pages** |
| `src/app/(main)/[locale]/panel/profile/page.tsx` | Create | Profile page (server component) |
| **Components** |
| `src/components/profile/profile-form.tsx` | Create | Profile edit form |
| `src/components/profile/avatar-upload.tsx` | Create | Avatar upload with R2 presigned URL |
| `src/components/shared/loading-spinner.tsx` | Create | Loading spinner component |
| **Server Actions** |
| `src/app/actions/profile/update.ts` | Create | Update profile action |
| **API Routes** |
| `src/app/api/users/me/avatar/route.ts` | Create | GET presigned URL for avatar upload |
| **UI Components (shadcn)** |
| `src/components/ui/avatar.tsx` | Create | shadcn Avatar component |
| `src/components/ui/textarea.tsx` | Create | shadcn Textarea component |
| **Translations (5 files)** |
| `src/lib/locales/pl/profile.json` | Create | Polish profile translations |
| `src/lib/locales/en/profile.json` | Create | English profile translations |
| `src/lib/locales/de/profile.json` | Create | German profile translations |
| `src/lib/locales/es/profile.json` | Create | Spanish profile translations |
| `src/lib/locales/ru/profile.json` | Create | Russian profile translations |

## Acceptance Criteria

- [ ] User can view their profile
- [ ] User can edit display name
- [ ] User can edit bio (max 500 characters)
- [ ] User can edit location
- [ ] User can upload avatar image
- [ ] Avatar uploads to Cloudflare R2
- [ ] Avatar displays with fallback to initials
- [ ] Form validation works (Zod)
- [ ] Profile updates persist to database
- [ ] Page shows success toast after save
- [ ] Loading states during upload
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Key User Flows

### Profile View Flow
1. User navigates to `/pl/panel/profile`
2. Server component fetches user + profile data
3. Profile form displays with current values
4. Avatar displays (R2 URL or initials fallback)

### Profile Edit Flow
1. User modifies display name, bio, or location
2. Clicks "Save changes"
3. Form validates with Zod
4. Submits to `updateProfileAction`
5. Database updates `UserProfile` record
6. Page revalidates → shows updated data
7. Success toast: "Profile updated"

### Avatar Upload Flow
1. User clicks "Change picture"
2. File input opens
3. User selects image (max 5MB)
4. Frontend validates file type (image/*)
5. Frontend calls `/api/users/me/avatar` → gets presigned URL
6. Frontend uploads image to R2 via presigned URL
7. Frontend calls `updateProfileAction` with R2 public URL
8. Avatar updates in UI

## Server Action Implementation

### updateProfileAction (src/app/actions/profile/update.ts)

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { profileSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function updateProfileAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { displayName, bio, location, latitude, longitude } = parsed.data

  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      displayName,
      bio,
      location,
      latitude,
      longitude
    },
    update: {
      displayName,
      bio,
      location,
      latitude,
      longitude
    }
  })

  revalidatePath("/panel/profile")
  return { success: true }
}
```

## API Route Implementation

### Avatar Presigned URL (src/app/api/users/me/avatar/route.ts)

```typescript
import { auth } from "@/lib/auth"
import { getUploadUrl } from "@/lib/r2"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { contentType } = await req.json()

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  const key = `avatars/${session.user.id}/${Date.now()}.${contentType.split("/")[1]}`
  const uploadUrl = await getUploadUrl(key, contentType)
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ uploadUrl, publicUrl })
}
```

## Component Implementation

### AvatarUpload Component (src/components/profile/avatar-upload.tsx)

```typescript
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { useTranslations } from "next-intl"

interface AvatarUploadProps {
  avatar?: string | null
  displayName?: string | null
  onUpload: (url: string) => void
}

export function AvatarUpload({ avatar, displayName, onUpload }: AvatarUploadProps) {
  const t = useTranslations("profile")
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)")
      return
    }

    setUploading(true)

    try {
      // 1. Get presigned URL
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: JSON.stringify({ contentType: file.type })
      })
      const { uploadUrl, publicUrl } = await res.json()

      // 2. Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      })

      // 3. Update profile with public URL
      onUpload(publicUrl)
    } catch (error) {
      console.error(error)
      alert(t("errors.uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="avatar-upload"
        />
        <label htmlFor="avatar-upload">
          <Button asChild disabled={uploading}>
            <span>
              {uploading ? <LoadingSpinner size="sm" /> : t("changeAvatar")}
            </span>
          </Button>
        </label>
      </div>
    </div>
  )
}
```

## Translation Files

### pl/profile.json
```json
{
  "title": "Profil",
  "displayName": "Nazwa wyświetlana",
  "bio": "Bio",
  "location": "Lokalizacja",
  "avatar": "Zdjęcie profilowe",
  "changeAvatar": "Zmień zdjęcie",
  "removeAvatar": "Usuń zdjęcie",
  "save": "Zapisz zmiany",
  "success": "Profil zaktualizowany",
  "errors": {
    "uploadFailed": "Błąd przesyłania zdjęcia",
    "bioTooLong": "Bio może mieć max. 500 znaków"
  }
}
```

### en/profile.json
```json
{
  "title": "Profile",
  "displayName": "Display name",
  "bio": "Bio",
  "location": "Location",
  "avatar": "Profile picture",
  "changeAvatar": "Change picture",
  "removeAvatar": "Remove picture",
  "save": "Save changes",
  "success": "Profile updated",
  "errors": {
    "uploadFailed": "Failed to upload image",
    "bioTooLong": "Bio can be max 500 characters"
  }
}
```

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: Use $TEST_USER_EMAIL / $TEST_USER_PASSWORD from .env.local
- Logged in session

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to profile | Profile page loads | `/pl/panel/profile` |
| 2 | Verify avatar fallback | Initials shown if no avatar | `.avatar` |
| 3 | Edit display name | Input updates | `input[name="displayName"]` |
| 4 | Edit bio | Textarea updates | `textarea[name="bio"]` |
| 5 | Click save | Success toast shown | `button[type="submit"]` |
| 6 | Verify saved data | Form shows new values | - |
| 7 | Click change avatar | File picker opens | `input[type="file"]` |
| 8 | Select image | Upload starts | - |
| 9 | Wait for upload | Loading spinner shown | `.loading-spinner` |
| 10 | Verify avatar | New avatar displayed | `.avatar img` |

### Screenshot Checkpoints
- `01-profile-page.png` - Profile page with form
- `02-avatar-fallback.png` - Avatar showing initials
- `03-edit-form.png` - Form with edited values
- `04-success-toast.png` - Success message
- `05-new-avatar.png` - Uploaded avatar displayed

## Notes

1. Avatar files stored in R2: `avatars/{userId}/{timestamp}.{ext}`
2. R2 presigned URLs expire after 1 hour
3. Max avatar size: 5MB
4. Supported formats: JPG, PNG, WebP, GIF
5. Use `revalidatePath()` to refresh profile page after update
6. Bio max length: 500 characters (enforced in Zod schema)
7. Display name is optional (falls back to email)
8. Avatar fallback shows initials from display name
