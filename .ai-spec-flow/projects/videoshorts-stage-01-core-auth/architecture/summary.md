# Architecture Summary: Core + Auth (Stage 1)

## Project Type
**GREENFIELD** - All code to create from scratch

---

## Database Schema (Prisma)

```prisma
enum Role { USER COMPANY ADMIN }

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          Role      @default(USER)
  emailVerified DateTime? @db.Timestamptz
  createdAt     DateTime  @default(now()) @db.Timestamptz
  updatedAt     DateTime  @updatedAt @db.Timestamptz
  profile       UserProfile?
  accounts      Account[]
  sessions      Session[]
}

model Account { /* NextAuth OAuth */ }
model Session { /* NextAuth Sessions */ }
model VerificationToken { /* Email/Password Tokens */ }

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?
  bio         String?  @db.Text
  location    String?
  latitude    Float?
  longitude   Float?
  darkMode    Boolean  @default(false)
  preferences Json?
  user        User     @relation(...)
}
```

---

## Server Actions

| Action | File | Input → Output |
|--------|------|----------------|
| signupAction | src/app/actions/auth/signup.ts | SignupSchema → User |
| verifyEmailAction | src/app/actions/auth/verify-email.ts | TokenSchema → void |
| forgotPasswordAction | src/app/actions/auth/forgot-password.ts | EmailSchema → void |
| resetPasswordAction | src/app/actions/auth/reset-password.ts | ResetSchema → void |
| updateProfileAction | src/app/actions/profile/update.ts | ProfileSchema → UserProfile |
| changePasswordAction | src/app/actions/profile/change-password.ts | PasswordSchema → void |
| deleteAccountAction | src/app/actions/profile/delete-account.ts | ConfirmSchema → void |

---

## Components (29 total)

| Domain | Components |
|--------|------------|
| **Auth** | LoginForm, SignupForm, OAuthButtons, VerifyEmailForm, ForgotPasswordForm, ResetPasswordForm |
| **Profile** | ProfileForm, AvatarUpload, PasswordChangeForm, DeleteAccountDialog, PreferencesForm |
| **Layout** | Header, AppSidebar, Footer, UserMenu, MobileDrawer |
| **Theme** | ThemeProvider, ThemeToggle |
| **Shared** | LoadingSpinner, ErrorBoundary, LocaleSwitcher |
| **UI** | Button, Input, Textarea, Label, Form, Dialog, DropdownMenu, Sheet, Avatar, Separator, Toast, Alert |

---

## Pages

| Page | Path | Type | Auth |
|------|------|------|------|
| Login | /(auth)/[locale]/login | Client | Public |
| Signup | /(auth)/[locale]/signup | Client | Public |
| Verify Email | /(auth)/[locale]/verify-email | Server | Public |
| Forgot Password | /(auth)/[locale]/forgot-password | Client | Public |
| Reset Password | /(auth)/[locale]/reset-password | Client | Public |
| Dashboard | /(main)/[locale]/panel | Server | Protected |
| Profile | /(main)/[locale]/panel/profile | Server | Protected |
| Settings | /(main)/[locale]/panel/settings | Server | Protected |
| Preferences | /(main)/[locale]/panel/preferences | Server | Protected |

---

## Navigation

- **File:** src/components/layout/app-sidebar.tsx
- **Icons:** Home, User, Settings, LogOut (lucide-react)
- **Labels:** sidebar.home, sidebar.profile, sidebar.settings, sidebar.logout

---

## Translations

**Files:** src/lib/locales/{pl,en,de,es,ru}/
- auth.json (login, signup, verification, password reset)
- profile.json (profile editing)
- settings.json (account settings)
- preferences.json (theme, language)
- common.json (buttons, errors)
- sidebar.json (navigation)

**Languages:** Polski, English, Deutsch, Español, Русский

---

## Implementation Phases

1. **Project Setup** - Next.js init, dependencies, config
2. **Core Infrastructure** - Prisma, NextAuth, R2, Resend
3. **Authentication** - Login, Signup, Email verification, Password reset
4. **Profile Management** - Profile edit, Avatar upload, Password change
5. **Settings & Preferences** - Theme toggle, Language switcher
6. **Layout & Navigation** - Sidebar, Header, Footer, Mobile drawer

---

**Next Phase:** Task Planning (`/ai-plan-tasks`)
