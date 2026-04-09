# Analysis Summary: Core + Auth (Stage 1)

## Project Type
**GREENFIELD** - No existing codebase. All components, APIs, and infrastructure must be created from scratch.

---

## Components to Create (29)

| Category | Components | Base Pattern |
|----------|------------|--------------|
| **Auth** | LoginForm, SignupForm, OAuthButtons, VerifyEmailPage, ForgotPasswordForm, ResetPasswordForm | shadcn/ui Form + react-hook-form |
| **Profile** | ProfileForm, AvatarUpload, PasswordChangeForm, DeleteAccountDialog, PreferencesForm | shadcn/ui Form + Dialog |
| **Layout** | Header, Sidebar, Footer, UserMenu, MobileDrawer, AppSidebar | shadcn/ui + Custom |
| **Theme** | ThemeProvider, ThemeToggle | next-themes |
| **Shared** | LoadingSpinner, ErrorBoundary, LocaleSwitcher | Custom |
| **UI** | Button, Input, Textarea, Label, Form, Dialog, DropdownMenu, Sheet, Avatar, Separator, Toast, Alert | shadcn/ui CLI |

---

## APIs to Create

### Server Actions (7)
| Action | Path | Purpose |
|--------|------|---------|
| signupAction | src/app/actions/auth/signup.ts | User registration |
| verifyEmailAction | src/app/actions/auth/verify-email.ts | Email token validation |
| forgotPasswordAction | src/app/actions/auth/forgot-password.ts | Send reset email |
| resetPasswordAction | src/app/actions/auth/reset-password.ts | Update password |
| updateProfileAction | src/app/actions/profile/update.ts | Update profile |
| changePasswordAction | src/app/actions/profile/change-password.ts | Change password |
| deleteAccountAction | src/app/actions/profile/delete-account.ts | Soft delete |

### API Routes
| Endpoint | Method | Pattern |
|----------|--------|---------|
| /api/auth/[...nextauth] | GET/POST | NextAuth handlers |
| /api/users/me/avatar | POST | R2 presigned URL |

---

## Database Models (5)

| Model | Fields | Purpose |
|-------|--------|---------|
| **User** | id, email, passwordHash?, role, emailVerified?, createdAt, updatedAt | Core user account |
| **Account** | id, userId, provider, providerAccountId, tokens... | OAuth connections |
| **Session** | id, sessionToken, userId, expires | Active sessions |
| **VerificationToken** | identifier, token, expires | Email/password tokens |
| **UserProfile** | id, userId, displayName, avatar, bio, location, lat/lng, preferences, darkMode | Extended profile |

---

## Frontend Patterns

| Pattern | Technology | Key File |
|---------|------------|----------|
| **Navigation** | Custom sidebar with icons | src/components/layout/app-sidebar.tsx |
| **Forms** | react-hook-form + Zod | src/lib/validation.ts |
| **Translations** | next-intl (5 languages) | src/lib/locales/{pl,en,de,es,ru}/*.json |
| **Dark Mode** | next-themes (class-based) | src/components/theme/theme-provider.tsx |
| **Auth** | NextAuth.js v5 | src/lib/auth.ts |

---

## Backend Patterns

| Pattern | Description |
|---------|-------------|
| **Server Actions** | Auth → Validate (Zod) → DB → revalidatePath |
| **API Routes** | Session check → Business logic → JSON response |
| **Middleware** | next-intl locale detection + NextAuth protection |
| **Email** | Resend + React Email templates |

---

## External Services (8)

| Service | SDK | Priority |
|---------|-----|----------|
| Neon DB | Prisma | P0 Critical |
| NextAuth | next-auth@5 | P0 Critical |
| Resend | resend | P0 Critical |
| Cloudflare R2 | @aws-sdk/client-s3 | P0 Critical |
| Google OAuth | next-auth/providers/google | P0 Critical |
| Facebook OAuth | next-auth/providers/facebook | P0 Critical |
| Mapbox | mapbox-gl | P1 Important |
| PostHog | posthog-js | P2 Nice-to-have |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14+, React 19, TypeScript 5.3+, Tailwind, shadcn/ui, next-themes, next-intl |
| **Backend** | Next.js API Routes, Server Actions, NextAuth.js v5, Prisma 5.8+ |
| **Database** | Neon DB (PostgreSQL 15+), Prisma Client |
| **Storage** | Cloudflare R2 |
| **Email** | Resend + React Email |
| **DevOps** | Vercel, GitHub, GitHub Actions |

---

## Gap Analysis

**Everything needs creation:**
- Project initialization (create-next-app)
- 30+ npm packages to install
- 29 components to build
- 13 API endpoints + 7 server actions
- 5 Prisma models
- 9 pages/routes
- i18n translation files (5 languages)
- External service setup (8 services)
- Environment variables (20+ vars)

---

**Next Phase:** Architecture Design (`/ai-architect`)
