# Task 03: Authentication Flow

## Overview

**Priority:** HIGH
**Dependencies:** task-02
**Complexity:** Medium (18 files, ~18k tokens)
**Status:** pending

## What to Build

Complete authentication system with email/password signup, OAuth (Google/Facebook), email verification, password reset flow, login forms, and server actions. Includes 5 auth pages, 5 React components, 4 server actions, 3 email templates, and translation files for 5 languages.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Pages** |
| `src/app/(auth)/[locale]/login/page.tsx` | Create | Login page |
| `src/app/(auth)/[locale]/signup/page.tsx` | Create | Signup page |
| `src/app/(auth)/[locale]/verify-email/page.tsx` | Create | Email verification page |
| `src/app/(auth)/[locale]/forgot-password/page.tsx` | Create | Forgot password page |
| `src/app/(auth)/[locale]/reset-password/page.tsx` | Create | Reset password page |
| **Components** |
| `src/components/auth/login-form.tsx` | Create | Login form with email/password |
| `src/components/auth/signup-form.tsx` | Create | Signup form with validation |
| `src/components/auth/oauth-buttons.tsx` | Create | Google + Facebook buttons |
| `src/components/auth/forgot-password-form.tsx` | Create | Forgot password form |
| `src/components/auth/reset-password-form.tsx` | Create | Reset password form |
| **Server Actions** |
| `src/app/actions/auth/signup.ts` | Create | User registration action |
| `src/app/actions/auth/verify-email.ts` | Create | Email verification action |
| `src/app/actions/auth/forgot-password.ts` | Create | Send reset email action |
| `src/app/actions/auth/reset-password.ts` | Create | Password reset action |
| **Email Templates** |
| `src/emails/verify-email.tsx` | Create | Email verification template |
| `src/emails/password-reset.tsx` | Create | Password reset template |
| `src/emails/welcome.tsx` | Create | Welcome email template |
| **Translations (10 files)** |
| `src/lib/locales/pl/auth.json` | Create | Polish auth translations |
| `src/lib/locales/en/auth.json` | Create | English auth translations |
| `src/lib/locales/de/auth.json` | Create | German auth translations |
| `src/lib/locales/es/auth.json` | Create | Spanish auth translations |
| `src/lib/locales/ru/auth.json` | Create | Russian auth translations |
| `src/lib/locales/pl/common.json` | Create | Polish common translations |
| `src/lib/locales/en/common.json` | Create | English common translations |
| `src/lib/locales/de/common.json` | Create | German common translations |
| `src/lib/locales/es/common.json` | Create | Spanish common translations |
| `src/lib/locales/ru/common.json` | Create | Russian common translations |

## Acceptance Criteria

- [ ] User can signup with email/password
- [ ] Verification email sent after signup
- [ ] User can verify email via token link
- [ ] User can login with verified credentials
- [ ] User can login with Google OAuth
- [ ] User can login with Facebook OAuth
- [ ] User can request password reset
- [ ] Password reset email sent with token
- [ ] User can reset password with valid token
- [ ] Form validation works (Zod + react-hook-form)
- [ ] Error messages display in correct language
- [ ] Redirect to `/panel` after successful login
- [ ] Redirect to `/login` if email not verified
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Key User Flows

### Signup Flow
1. User visits `/pl/signup`
2. Fills email + password
3. Submits form → `signupAction`
4. User created with `emailVerified: null`
5. Verification email sent
6. Success message: "Check your email"
7. User clicks email link → `/verify-email?token=xxx`
8. Token validated → `emailVerified: now()`
9. Redirect to `/login`

### Login Flow
1. User visits `/pl/login`
2. Fills email + password
3. Submits → NextAuth CredentialsProvider
4. Checks `emailVerified` not null
5. If verified → JWT session → Redirect to `/panel`
6. If not verified → Error: "Please verify your email"

### Password Reset Flow
1. User clicks "Forgot password?" on login
2. Enters email → `forgotPasswordAction`
3. Token created in `VerificationToken` table
4. Reset email sent with link
5. User clicks link → `/reset-password?token=xxx`
6. Enters new password
7. Token validated + password updated
8. Redirect to `/login`

## Server Actions Implementation

### signupAction (src/app/actions/auth/signup.ts)

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation"
import { sendVerificationEmail } from "@/lib/resend"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function signupAction(data: unknown) {
  const parsed = signupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Email already registered" }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "USER"
    }
  })

  const token = randomBytes(32).toString("hex")
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    }
  })

  await sendVerificationEmail(email, token)

  return { success: true }
}
```

### verifyEmailAction (src/app/actions/auth/verify-email.ts)

```typescript
"use server"

import { prisma } from "@/lib/prisma"

export async function verifyEmailAction(token: string) {
  const verification = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verification || verification.expires < new Date()) {
    return { error: "Token expired or invalid" }
  }

  await prisma.user.update({
    where: { email: verification.identifier },
    data: { emailVerified: new Date() }
  })

  await prisma.verificationToken.delete({ where: { token } })

  return { success: true }
}
```

## Translation Files

### pl/auth.json
```json
{
  "login": {
    "title": "Zaloguj się",
    "email": "Email",
    "password": "Hasło",
    "submit": "Zaloguj",
    "forgotPassword": "Zapomniałeś hasła?",
    "noAccount": "Nie masz konta?",
    "signupLink": "Zarejestruj się",
    "google": "Kontynuuj z Google",
    "facebook": "Kontynuuj z Facebook",
    "errors": {
      "invalidCredentials": "Nieprawidłowy email lub hasło",
      "emailNotVerified": "Potwierdź swój adres email"
    }
  },
  "signup": {
    "title": "Zarejestruj się",
    "email": "Email",
    "password": "Hasło",
    "confirmPassword": "Potwierdź hasło",
    "submit": "Zarejestruj",
    "hasAccount": "Masz już konto?",
    "loginLink": "Zaloguj się",
    "verifyEmailSent": "Wysłaliśmy link weryfikacyjny na {{email}}",
    "errors": {
      "emailExists": "Ten email jest już zarejestrowany",
      "passwordsNotMatch": "Hasła nie są takie same",
      "weakPassword": "Hasło musi mieć min. 8 znaków"
    }
  },
  "verifyEmail": {
    "title": "Weryfikacja email",
    "success": "Email został zweryfikowany!",
    "error": "Link wygasł lub jest nieprawidłowy",
    "resend": "Wyślij ponownie"
  },
  "forgotPassword": {
    "title": "Resetuj hasło",
    "email": "Email",
    "submit": "Wyślij link",
    "emailSent": "Link resetujący został wysłany na {{email}}"
  },
  "resetPassword": {
    "title": "Nowe hasło",
    "password": "Nowe hasło",
    "confirmPassword": "Potwierdź hasło",
    "submit": "Zmień hasło",
    "success": "Hasło zostało zmienione"
  }
}
```

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Database: Ensure Prisma migrations applied

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to signup | Signup page loads | `/pl/signup` |
| 2 | Fill email field | Email entered | `input[name="email"]` |
| 3 | Fill password field | Password entered | `input[name="password"]` |
| 4 | Click signup button | Success message shown | `button[type="submit"]` |
| 5 | Check email inbox | Verification email received | - |
| 6 | Click verification link | Redirect to login | `/pl/verify-email?token=xxx` |
| 7 | Navigate to login | Login page loads | `/pl/login` |
| 8 | Enter credentials | Fields filled | `input[name="email"]`, `input[name="password"]` |
| 9 | Click login button | Redirect to panel | `button[type="submit"]` |
| 10 | Verify dashboard | Dashboard loads | `/pl/panel` |

### Screenshot Checkpoints
- `01-signup-form.png` - Signup page with form
- `02-signup-success.png` - Success message after signup
- `03-verify-email.png` - Email verification page
- `04-login-form.png` - Login page
- `05-dashboard.png` - Dashboard after successful login

## Notes

1. Use `react-hook-form` + `@hookform/resolvers/zod` for form validation
2. Email templates use `react-email` for HTML rendering
3. Tokens expire after 24 hours
4. After verification, delete token from database
5. OAuth users skip email verification (providers handle it)
6. Use `next-intl` for i18n: `useTranslations("auth")`
7. Error messages must be translated for all 5 languages
