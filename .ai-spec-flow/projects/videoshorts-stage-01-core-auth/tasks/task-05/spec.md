# Task 05: Settings & Account

## Overview

**Priority:** MEDIUM
**Dependencies:** task-02
**Complexity:** Simple (10 files, ~10k tokens)
**Status:** pending

## What to Build

Account settings page with password change functionality and account deletion with confirmation dialog. Includes 1 page, 3 components, 2 server actions, and translation files for 5 languages.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Pages** |
| `src/app/(main)/[locale]/panel/settings/page.tsx` | Create | Settings page (server component) |
| **Components** |
| `src/components/profile/password-change-form.tsx` | Create | Password change form |
| `src/components/profile/delete-account-dialog.tsx` | Create | Account deletion dialog |
| **Server Actions** |
| `src/app/actions/profile/change-password.ts` | Create | Change password action |
| `src/app/actions/profile/delete-account.ts` | Create | Delete account action (soft delete) |
| **UI Components (shadcn)** |
| `src/components/ui/dialog.tsx` | Create | shadcn Dialog component |
| `src/components/ui/alert.tsx` | Create | shadcn Alert component |
| **Translations (5 files)** |
| `src/lib/locales/pl/settings.json` | Create | Polish settings translations |
| `src/lib/locales/en/settings.json` | Create | English settings translations |
| `src/lib/locales/de/settings.json` | Create | German settings translations |
| `src/lib/locales/es/settings.json` | Create | Spanish settings translations |
| `src/lib/locales/ru/settings.json` | Create | Russian settings translations |

## Acceptance Criteria

- [ ] User can view settings page
- [ ] User can change password
- [ ] Current password validated before change
- [ ] New password meets requirements (min 8 chars)
- [ ] User can initiate account deletion
- [ ] Confirmation dialog requires typing "DELETE"
- [ ] Account soft-deleted (emailVerified set to null)
- [ ] User logged out after account deletion
- [ ] All sessions invalidated after password change
- [ ] Form validation works (Zod)
- [ ] Success toasts shown
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Key User Flows

### Password Change Flow
1. User navigates to `/pl/panel/settings`
2. Clicks "Change password" section
3. Enters current password
4. Enters new password (min 8 chars)
5. Confirms new password
6. Submits form → `changePasswordAction`
7. Current password validated with bcrypt
8. New password hashed and saved
9. All sessions invalidated
10. User redirected to login page

### Account Deletion Flow
1. User clicks "Delete account" button
2. Warning dialog opens
3. User types "DELETE" in confirmation field
4. Clicks "Delete my account"
5. Submits to `deleteAccountAction`
6. Account soft-deleted (emailVerified = null)
7. User logged out → redirect to `/login`

## Server Actions Implementation

### changePasswordAction (src/app/actions/profile/change-password.ts)

```typescript
"use server"

import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { passwordChangeSchema } from "@/lib/validation"
import bcrypt from "bcryptjs"

export async function changePasswordAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = passwordChangeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  })

  if (!user?.passwordHash) {
    return { error: "Account created with OAuth" }
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return { error: "Wrong current password" }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newPasswordHash }
  })

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId: session.user.id }
  })

  await signOut()

  return { success: true }
}
```

### deleteAccountAction (src/app/actions/profile/delete-account.ts)

```typescript
"use server"

import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteAccountSchema } from "@/lib/validation"

export async function deleteAccountAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = deleteAccountSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Soft delete: set emailVerified to null
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailVerified: null }
  })

  // Delete all sessions
  await prisma.session.deleteMany({
    where: { userId: session.user.id }
  })

  await signOut()

  return { success: true }
}
```

## Component Implementation

### DeleteAccountDialog (src/components/profile/delete-account-dialog.tsx)

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { deleteAccountSchema } from "@/lib/validation"
import { deleteAccountAction } from "@/app/actions/profile/delete-account"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DeleteAccountDialog() {
  const t = useTranslations("settings")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "" }
  })

  const onSubmit = async (data: { confirmation: string }) => {
    setLoading(true)
    const result = await deleteAccountAction(data)
    if (result.error) {
      alert(result.error)
      setLoading(false)
    }
    // User will be redirected by signOut()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">{t("account.deleteAccount")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>{t("delete.warning")}</DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertDescription>{t("delete.warning")}</AlertDescription>
        </Alert>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="confirmation">{t("delete.confirm")}</Label>
            <Input
              id="confirmation"
              {...form.register("confirmation")}
              placeholder="DELETE"
            />
            {form.formState.errors.confirmation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmation.message}
              </p>
            )}
          </div>
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? "Deleting..." : t("delete.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## Translation Files

### pl/settings.json
```json
{
  "title": "Ustawienia",
  "account": {
    "title": "Konto",
    "email": "Email",
    "emailVerified": "Zweryfikowany",
    "emailNotVerified": "Niezweryfikowany",
    "changePassword": "Zmień hasło",
    "deleteAccount": "Usuń konto"
  },
  "password": {
    "title": "Zmiana hasła",
    "current": "Obecne hasło",
    "new": "Nowe hasło",
    "confirm": "Potwierdź hasło",
    "submit": "Zmień hasło",
    "success": "Hasło zmienione",
    "errors": {
      "wrongPassword": "Nieprawidłowe obecne hasło"
    }
  },
  "delete": {
    "title": "Usuń konto",
    "warning": "Ta operacja jest nieodwracalna",
    "confirm": "Wpisz 'DELETE' aby potwierdzić",
    "submit": "Usuń moje konto",
    "success": "Konto zostało usunięte"
  }
}
```

### en/settings.json
```json
{
  "title": "Settings",
  "account": {
    "title": "Account",
    "email": "Email",
    "emailVerified": "Verified",
    "emailNotVerified": "Not verified",
    "changePassword": "Change password",
    "deleteAccount": "Delete account"
  },
  "password": {
    "title": "Change password",
    "current": "Current password",
    "new": "New password",
    "confirm": "Confirm password",
    "submit": "Change password",
    "success": "Password changed",
    "errors": {
      "wrongPassword": "Wrong current password"
    }
  },
  "delete": {
    "title": "Delete account",
    "warning": "This action is irreversible",
    "confirm": "Type 'DELETE' to confirm",
    "submit": "Delete my account",
    "success": "Account deleted"
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
| 1 | Navigate to settings | Settings page loads | `/pl/panel/settings` |
| 2 | Verify email status | Shows "Verified" badge | `.email-verified` |
| 3 | Click change password | Password form expands | `button:has-text("Zmień hasło")` |
| 4 | Enter current password | Field filled | `input[name="currentPassword"]` |
| 5 | Enter new password | Field filled | `input[name="newPassword"]` |
| 6 | Confirm password | Field filled | `input[name="confirmPassword"]` |
| 7 | Submit form | Redirect to login | `button[type="submit"]` |
| 8 | Login with new password | Success | `/pl/login` |
| 9 | Navigate to settings | Page loads | `/pl/panel/settings` |
| 10 | Click delete account | Dialog opens | `button:has-text("Usuń konto")` |
| 11 | Type DELETE | Confirmation valid | `input[placeholder="DELETE"]` |
| 12 | Confirm deletion | Redirect to login | `button:has-text("Usuń moje konto")` |

### Screenshot Checkpoints
- `01-settings-page.png` - Settings page overview
- `02-password-form.png` - Password change form
- `03-delete-dialog.png` - Account deletion dialog
- `04-delete-warning.png` - Warning alert in dialog
- `05-login-after-change.png` - Login page after password change

## Notes

1. Password change invalidates ALL active sessions (re-login required)
2. Account deletion is SOFT DELETE (emailVerified = null)
3. Soft-deleted accounts cannot login (NextAuth checks emailVerified)
4. To permanently delete: add cron job to delete users where emailVerified is null for >30 days
5. OAuth accounts (no passwordHash) cannot change password
6. Confirmation dialog requires exact match: "DELETE" (case-sensitive)
7. Use `signOut()` from NextAuth to invalidate session
