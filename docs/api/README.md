# API Reference

Server Actions and API routes documentation.

---

## API Categories

### [Server Actions](./server-actions/README.md)
Next.js Server Actions for data mutations and server-side operations.

**Action Domains:**
- [Profile Actions](./server-actions/profile.md) - Profile management actions

---

## API Structure

This project uses **Next.js Server Actions** as the primary API pattern instead of traditional REST API routes. Server Actions provide:

- Type-safe server-client communication
- Automatic TypeScript inference
- Progressive enhancement support
- Simplified error handling
- Built-in revalidation

### Server Actions

Server Actions are located in `src/app/actions/` organized by domain:

```
src/app/actions/
├── auth/
│   ├── sign-in.ts
│   ├── sign-up.ts
│   ├── sign-out.ts
│   ├── verify-email.ts
│   └── reset-password.ts
├── profile/
│   ├── update-profile.ts
│   └── delete-avatar.ts
└── settings/
    ├── change-password.ts
    └── delete-account.ts
```

### API Routes

Traditional API routes are used only for:
- Generating presigned URLs
- OAuth callbacks
- Webhooks
- File uploads

Located in `src/app/api/`:

```
src/app/api/
├── auth/
│   └── [...nextauth]/
└── users/
    └── me/
        └── avatar/
            └── route.ts
```

---

## Common Patterns

### Server Action Pattern

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function exampleAction(data: InputType): Promise<ActionResult> {
  // 1. Authentication
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // 2. Validation (using Zod)
  const validatedData = schema.parse(data)

  try {
    // 3. Database operation
    const result = await prisma.model.update({
      where: { id: session.user.id },
      data: validatedData
    })

    // 4. Cache revalidation
    revalidatePath("/path")

    // 5. Return success
    return { success: true, data: result }
  } catch (error) {
    console.error("Action error:", error)
    return { error: "Operation failed" }
  }
}
```

### Error Handling

All Server Actions return a standardized result type:

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { error: string; code?: string }
```

### Client Usage

```typescript
'use client'

import { exampleAction } from '@/app/actions/domain/example'

async function handleSubmit(formData: FormData) {
  const result = await exampleAction({
    field: formData.get('field') as string
  })

  if (result.error) {
    // Handle error
    setError(result.error)
  } else {
    // Handle success
    console.log(result.data)
  }
}
```

---

## Authentication

All Server Actions requiring authentication follow this pattern:

```typescript
const session = await auth()
if (!session?.user?.id) {
  return { error: "Unauthorized" }
}
```

This ensures:
- Type-safe session access
- Consistent error responses
- Early return on auth failure

---

## Validation

Input validation uses Zod schemas:

```typescript
import { z } from 'zod'

const schema = z.object({
  field: z.string().min(1).max(100)
})

const validatedData = schema.parse(input)
```

Benefits:
- Type inference
- Runtime validation
- Clear error messages
- Schema reusability

---

## Cache Revalidation

Server Actions use Next.js cache revalidation:

```typescript
import { revalidatePath } from 'next/cache'

// Revalidate specific path
revalidatePath("/panel/profile")

// Revalidate specific tag
revalidateTag("user-profile")
```

This ensures UI updates reflect server-side changes immediately.

---

## API Index

### Server Actions

| Action          | Domain   | Purpose                  | File                                         |
|-----------------|----------|--------------------------|----------------------------------------------|
| updateProfile   | profile  | Update profile data      | src/app/actions/profile/update-profile.ts    |
| deleteAvatar    | profile  | Delete avatar            | src/app/actions/profile/delete-avatar.ts     |
| signIn          | auth     | User authentication      | src/app/actions/auth/sign-in.ts              |
| signUp          | auth     | User registration        | src/app/actions/auth/sign-up.ts              |
| signOut         | auth     | Session termination      | src/app/actions/auth/sign-out.ts             |
| verifyEmail     | auth     | Email verification       | src/app/actions/auth/verify-email.ts         |
| resetPassword   | auth     | Password reset           | src/app/actions/auth/reset-password.ts       |
| changePassword  | settings | Change password          | src/app/actions/settings/change-password.ts  |
| deleteAccount   | settings | Delete user account      | src/app/actions/settings/delete-account.ts   |

### API Routes

| Route                   | Methods       | Purpose                        | File                                   |
|-------------------------|---------------|--------------------------------|----------------------------------------|
| /api/users/me/avatar    | POST, DELETE  | Avatar presigned URL, cleanup  | src/app/api/users/me/avatar/route.ts   |

---

**Last Updated:** 2025-11-29
