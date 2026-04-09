# Profile Server Actions

Server Actions for profile management operations.

**Location:** `src/app/actions/profile/`

---

## Actions

### deleteAvatarAction

Delete user avatar from Cloudflare R2 storage and database.

**File:** `src/app/actions/profile/delete-avatar.ts`

#### Signature

```typescript
export async function deleteAvatarAction(): Promise<{
  error?: string
  success?: boolean
}>
```

#### Returns

**Success:**
```typescript
{ success: true }
```

**Error:**
```typescript
{ error: string }
```

#### Errors

| Code         | Message                  | Cause                          |
|--------------|--------------------------|--------------------------------|
| -            | Unauthorized             | No session or user ID          |
| -            | Failed to delete avatar  | R2 deletion or DB update error |

#### Implementation Details

**Authentication:**
- Requires valid session with user ID
- Returns error if unauthorized

**Deletion Flow:**
1. Retrieve current avatar URL from UserProfile
2. If avatar exists, extract R2 key from URL
3. Delete file from R2 using `deleteObject(key)`
4. Update database (set avatar to NULL)
5. Revalidate `/panel/profile` path

**URL Parsing:**
```typescript
// URL format: https://{domain}/avatars/{userId}/{timestamp}.jpg
const url = new URL(profile.avatar)
const key = url.pathname.substring(1) // Remove leading "/"

// Example:
// URL:  https://cdn.videoshorts.pl/avatars/clxy123/1732896123456.jpg
// Key:  avatars/clxy123/1732896123456.jpg
```

**Idempotency:**
- Safe to call even if avatar doesn't exist
- R2 deleteObject doesn't error on missing files
- Database update handles NULL gracefully

**Cache Revalidation:**
```typescript
revalidatePath("/panel/profile")
```

This ensures profile page reflects deletion immediately.

#### Example Usage

```typescript
'use client'

import { deleteAvatarAction } from '@/app/actions/profile/delete-avatar'

async function handleDelete() {
  if (!confirm('Remove profile picture?')) return

  const result = await deleteAvatarAction()

  if (result.error) {
    alert(result.error)
  } else {
    // Avatar deleted successfully
    setAvatarUrl(null)
  }
}
```

#### With Loading State

```typescript
const [deleting, setDeleting] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleDelete() {
  if (!confirm('Remove profile picture?')) return

  setDeleting(true)
  setError(null)

  try {
    const result = await deleteAvatarAction()

    if (result.error) {
      setError(result.error)
    } else {
      setAvatarUrl(null)
    }
  } finally {
    setDeleting(false)
  }
}
```

#### Testing

**Test File:** `src/app/actions/profile/__tests__/delete-avatar.test.ts`

**Test Categories:**
- Happy path (with avatar, without avatar)
- Authentication failures (no session, no user ID)
- Database errors (profile not found, update fails)
- R2 deletion errors
- URL parsing edge cases
- Cache revalidation verification

**Coverage:** 13 tests, all passing

---

### updateProfileAction

Update user profile data including display name, bio, location, and avatar.

**File:** `src/app/actions/profile/update-profile.ts`

#### Signature

```typescript
export async function updateProfileAction(data: {
  displayName?: string
  bio?: string
  location?: string
  latitude?: number
  longitude?: number
  avatar?: string | null
}): Promise<ActionResult<UserProfile>>
```

#### Input

| Field       | Type           | Required | Constraints              |
|-------------|----------------|----------|--------------------------|
| displayName | string         | No       | Min 2, max 50 chars      |
| bio         | string         | No       | Max 500 chars            |
| location    | string         | No       | Human-readable address   |
| latitude    | number         | No       | -90 to 90                |
| longitude   | number         | No       | -180 to 180              |
| avatar      | string \| null | No       | Valid URL or null        |

#### Returns

**Success:**
```typescript
{
  success: true,
  data: {
    id: string
    userId: string
    displayName: string | null
    avatar: string | null
    bio: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
    darkMode: boolean
    preferences: JsonValue | null
    createdAt: Date
    updatedAt: Date
  }
}
```

**Error:**
```typescript
{ error: string }
```

#### Example Usage

```typescript
'use client'

import { updateProfileAction } from '@/app/actions/profile/update-profile'

async function handleSubmit(formData: FormData) {
  const result = await updateProfileAction({
    displayName: formData.get('displayName') as string,
    bio: formData.get('bio') as string,
    avatar: avatarUrl
  })

  if (result.error) {
    setError(result.error)
  } else {
    console.log('Profile updated:', result.data)
  }
}
```

---

## Common Patterns

### Error Handling

```typescript
const result = await deleteAvatarAction()

if (result.error) {
  // Handle error
  toast.error(result.error)
} else {
  // Handle success
  toast.success('Avatar deleted')
}
```

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { updateProfileAction } from '@/app/actions/profile/update-profile'

function ProfileForm() {
  const { handleSubmit } = useForm()

  const onSubmit = async (data) => {
    const result = await updateProfileAction(data)

    if (result.error) {
      setError('root', { message: result.error })
    } else {
      reset(result.data)
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

### Optimistic Updates

```typescript
// Optimistically update UI
setAvatarUrl(null)

try {
  const result = await deleteAvatarAction()

  if (result.error) {
    // Revert on error
    setAvatarUrl(previousUrl)
    toast.error(result.error)
  }
} catch (error) {
  // Revert on exception
  setAvatarUrl(previousUrl)
}
```

---

## Related Documentation

- [Profile Feature](../../features/profile/README.md)
- [AvatarUpload Component](../../components/profile/avatar-upload.md)
- [R2 Utilities](../utilities/r2.md)
- [Avatar API Route](../routes/avatar.md)

---

**Last Updated:** 2025-11-29
**Test Coverage:** 80%+
