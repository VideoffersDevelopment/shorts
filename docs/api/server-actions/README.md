# Server Actions

Next.js Server Actions for data mutations and server-side operations.

---

## Action Domains

### [Profile Actions](./profile.md)
Profile management including avatar deletion and profile updates.

**Actions:**
- `deleteAvatarAction` - Delete user avatar from R2 and database
- `updateProfileAction` - Update user profile data

---

## Server Action Standards

All server actions in this project follow these standards:

### File Structure

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function actionName(input: InputType): Promise<ActionResult<ReturnType>> {
  // Implementation
}
```

### Authentication

```typescript
const session = await auth()
if (!session?.user?.id) {
  return { error: "Unauthorized" }
}
```

### Error Handling

```typescript
try {
  // Operation
  return { success: true, data: result }
} catch (error) {
  console.error("Action error:", error)
  return { error: "User-friendly error message" }
}
```

### Return Type

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { error: string; code?: string }
```

---

## Action Index

| Action             | Domain   | Purpose                     | File                                         |
|--------------------|----------|-----------------------------|----------------------------------------------|
| deleteAvatar       | profile  | Delete avatar from R2 & DB  | src/app/actions/profile/delete-avatar.ts     |
| updateProfile      | profile  | Update profile data         | src/app/actions/profile/update-profile.ts    |

---

**Last Updated:** 2025-11-29
