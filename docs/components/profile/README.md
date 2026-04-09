# Profile Components

Components for user profile management.

---

## Components

### [AvatarUpload](./avatar-upload.md)
Avatar upload component with image cropping and deletion functionality.

**Features:**
- File selection with validation
- Image cropping with circular preview
- Direct upload to Cloudflare R2
- Avatar deletion with confirmation
- Loading states and error handling

### [ProfileForm](./profile-form.md)
Profile editing form with real-time validation.

**Features:**
- Display name, bio, location fields
- Integrated AvatarUpload component
- Form validation with react-hook-form
- Internationalized labels and errors

---

## Common Patterns

### Avatar Display
All profile components use the same avatar display pattern:

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar className="h-24 w-24">
  <AvatarImage src={avatarUrl ?? undefined} alt={userEmail} />
  <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
</Avatar>
```

### Loading States
Consistent loading state pattern across components:

```tsx
import { LoadingSpinner } from '@/components/shared/loading-spinner'

<Button disabled={isLoading}>
  {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
  {isLoading ? t('saving') : t('save')}
</Button>
```

### Error Display
Standard error display pattern:

```tsx
{error && (
  <p className="text-sm text-destructive">{error}</p>
)}
```

---

**Last Updated:** 2025-11-29
