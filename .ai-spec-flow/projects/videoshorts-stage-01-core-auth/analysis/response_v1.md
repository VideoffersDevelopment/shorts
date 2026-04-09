# Code Analysis: Core + Auth (Stage 1)

**Project:** videoshorts-stage-01-core-auth
**Date:** 2025-11-28
**Type:** GREENFIELD (No existing codebase)
**Iteration:** 1/3

---

## Executive Summary

This is a greenfield analysis for the VideoShorts Stage 1 (Core + Auth) implementation. Since no codebase exists, this document provides a comprehensive requirements analysis covering all components, APIs, database models, routing, patterns, and external services needed to build the foundation of the VideoShorts SaaS platform.

**Stage 1 Scope:** Authentication system (email + OAuth), user profiles, responsive layout with dark mode, i18n infrastructure, and deployment pipeline.

---

## 1. Component Inventory (TO CREATE)

All components must be created from scratch. Based on brief.md and architecture-plan.md, the following components are required:

### 1.1 Authentication Components

| Component | Planned Path | Status | Base Pattern | Description |
|-----------|-------------|--------|--------------|-------------|
| LoginForm | src/components/auth/login-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form + react-hook-form | Email/password + OAuth buttons, remember me checkbox |
| SignupForm | src/components/auth/signup-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form + react-hook-form | Email/password registration with validation |
| OAuthButtons | src/components/auth/oauth-buttons.tsx | 🆕 NEEDS CREATION | shadcn/ui Button | Google + Facebook OAuth triggers |
| VerifyEmailPage | src/components/auth/verify-email.tsx | 🆕 NEEDS CREATION | Custom component | Token verification UI with retry option |
| ForgotPasswordForm | src/components/auth/forgot-password-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form | Email input for password reset link |
| ResetPasswordForm | src/components/auth/reset-password-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form | New password + confirm password |

### 1.2 Profile Components

| Component | Planned Path | Status | Base Pattern | Description |
|-----------|-------------|--------|--------------|-------------|
| ProfileForm | src/components/profile/profile-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form | Display name, bio, location (Mapbox autocomplete) |
| AvatarUpload | src/components/profile/avatar-upload.tsx | 🆕 NEEDS CREATION | Custom + shadcn/ui Dialog | File picker, preview, R2 upload with progress |
| PasswordChangeForm | src/components/profile/password-change-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form | Current + new password fields |
| DeleteAccountDialog | src/components/profile/delete-account-dialog.tsx | 🆕 NEEDS CREATION | shadcn/ui Dialog | Confirmation modal with password verification |
| PreferencesForm | src/components/profile/preferences-form.tsx | 🆕 NEEDS CREATION | shadcn/ui Form | Categories checkboxes, notification toggles |

### 1.3 Layout Components

| Component | Planned Path | Status | Base Pattern | Description |
|-----------|-------------|--------|--------------|-------------|
| Header | src/components/layout/header.tsx | 🆕 NEEDS CREATION | Custom with shadcn/ui | Logo, search bar placeholder, user menu dropdown |
| Sidebar | src/components/layout/sidebar.tsx | 🆕 NEEDS CREATION | Custom navigation | Desktop: fixed sidebar, Mobile: drawer (Sheet) |
| Footer | src/components/layout/footer.tsx | 🆕 NEEDS CREATION | Custom | Links to Terms, Privacy, Contact, language switcher |
| UserMenu | src/components/layout/user-menu.tsx | 🆕 NEEDS CREATION | shadcn/ui DropdownMenu | Profile, Settings, Dark mode toggle, Logout |
| MobileDrawer | src/components/layout/mobile-drawer.tsx | 🆕 NEEDS CREATION | shadcn/ui Sheet | Navigation drawer for mobile |
| AppSidebar | src/components/layout/app-sidebar.tsx | 🆕 NEEDS CREATION | Custom navigation | Home, Explore, Following, Dashboard, Admin links with icons |

### 1.4 UI Primitives (shadcn/ui - to install)

| Component | CLI Command | Purpose |
|-----------|------------|---------|
| Button | npx shadcn-ui@latest add button | Primary, outline, ghost, destructive variants |
| Input | npx shadcn-ui@latest add input | Text, email, password inputs |
| Textarea | npx shadcn-ui@latest add textarea | Bio field |
| Label | npx shadcn-ui@latest add label | Form labels |
| Form | npx shadcn-ui@latest add form | react-hook-form integration |
| Dialog | npx shadcn-ui@latest add dialog | Modals (delete account, etc.) |
| DropdownMenu | npx shadcn-ui@latest add dropdown-menu | User menu |
| Sheet | npx shadcn-ui@latest add sheet | Mobile drawer |
| Avatar | npx shadcn-ui@latest add avatar | User avatar display |
| Separator | npx shadcn-ui@latest add separator | Visual dividers |
| Toast | npx shadcn-ui@latest add toast | Success/error notifications |
| Alert | npx shadcn-ui@latest add alert | Info boxes |

### 1.5 Theme Components

| Component | Planned Path | Status | Base Pattern | Description |
|-----------|-------------|--------|--------------|-------------|
| ThemeProvider | src/components/theme/theme-provider.tsx | 🆕 NEEDS CREATION | next-themes | Wraps app, provides theme context |
| ThemeToggle | src/components/theme/theme-toggle.tsx | 🆕 NEEDS CREATION | Custom with Moon/Sun icons | Button in user menu |

### 1.6 Shared Components

| Component | Planned Path | Status | Base Pattern | Description |
|-----------|-------------|--------|--------------|-------------|
| LoadingSpinner | src/components/shared/loading-spinner.tsx | 🆕 NEEDS CREATION | Custom SVG animation | Global loading indicator |
| ErrorBoundary | src/components/shared/error-boundary.tsx | 🆕 NEEDS CREATION | React ErrorBoundary | Catches runtime errors |
| LocaleSwitcher | src/components/shared/locale-switcher.tsx | 🆕 NEEDS CREATION | shadcn/ui DropdownMenu | Language selection (PL active, others prepared) |

---

## 2. API Inventory (TO CREATE)

All API endpoints must be created from scratch using Next.js 14+ App Router conventions.

### 2.1 Authentication Endpoints

| Endpoint | Planned Path | Method | Status | Pattern | Description |
|----------|-------------|--------|--------|---------|-------------|
| Sign Up | src/app/api/auth/signup/route.ts | POST | 🆕 NEEDS CREATION | Server Action preferred | Email/password registration with email verification |
| Sign In | src/app/api/auth/signin/route.ts | POST | 🆕 NEEDS CREATION | NextAuth handler | Email/password login with rate limiting |
| Sign Out | src/app/api/auth/signout/route.ts | POST | 🆕 NEEDS CREATION | NextAuth handler | Session invalidation |
| Session | src/app/api/auth/session/route.ts | GET | 🆕 NEEDS CREATION | NextAuth handler | Get current session |
| Verify Email | src/app/api/auth/verify-email/route.ts | POST | 🆕 NEEDS CREATION | Server Action | Token validation, activate account |
| Forgot Password | src/app/api/auth/forgot-password/route.ts | POST | 🆕 NEEDS CREATION | Server Action | Send reset email via Resend |
| Reset Password | src/app/api/auth/reset-password/route.ts | POST | 🆕 NEEDS CREATION | Server Action | Validate token, update password |
| OAuth Providers | src/app/api/auth/[...nextauth]/route.ts | GET/POST | 🆕 NEEDS CREATION | NextAuth v5 | Google & Facebook OAuth callbacks |

### 2.2 User Profile Endpoints

| Endpoint | Planned Path | Method | Status | Pattern | Description |
|----------|-------------|--------|--------|---------|-------------|
| Get Profile | src/app/api/users/me/route.ts | GET | 🆕 NEEDS CREATION | API Route | Fetch current user + profile |
| Update Profile | src/app/api/users/me/route.ts | PATCH | 🆕 NEEDS CREATION | Server Action preferred | Update display name, bio, location |
| Delete Account | src/app/api/users/me/route.ts | DELETE | 🆕 NEEDS CREATION | Server Action | Soft delete with GDPR compliance |
| Avatar Upload | src/app/api/users/me/avatar/route.ts | POST | 🆕 NEEDS CREATION | API Route | Generate R2 presigned URL |
| Change Password | src/app/api/users/me/password/route.ts | PATCH | 🆕 NEEDS CREATION | Server Action | Validate current, set new password |

### 2.3 Server Actions (Preferred for Mutations)

| Action | Planned Path | Status | Description |
|--------|-------------|--------|-------------|
| signupAction | src/app/actions/auth/signup.ts | 🆕 NEEDS CREATION | Register user, send verification email |
| verifyEmailAction | src/app/actions/auth/verify-email.ts | 🆕 NEEDS CREATION | Validate token, activate account |
| forgotPasswordAction | src/app/actions/auth/forgot-password.ts | 🆕 NEEDS CREATION | Generate token, send reset email |
| resetPasswordAction | src/app/actions/auth/reset-password.ts | 🆕 NEEDS CREATION | Validate token, update password hash |
| updateProfileAction | src/app/actions/profile/update.ts | 🆕 NEEDS CREATION | Update user profile fields |
| changePasswordAction | src/app/actions/profile/change-password.ts | 🆕 NEEDS CREATION | Validate & update password |
| deleteAccountAction | src/app/actions/profile/delete-account.ts | 🆕 NEEDS CREATION | Soft delete user, schedule hard delete |

---

## 3. Database Analysis

### 3.1 Prisma Schema (Required Models for Stage 1)

Based on architecture-plan.md (lines 169-336), the following models are needed:

#### 3.1.1 User Model

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   // nullable for OAuth users
  role          Role      @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  profile  UserProfile?
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([role])
}

enum Role {
  USER
  COMPANY
  ADMIN
}
```

**Fields:**
- `id`: CUID for primary key
- `email`: Unique, indexed for fast lookup
- `passwordHash`: bcrypt hash (cost 12), nullable for OAuth-only users
- `role`: Enum (USER default, COMPANY/ADMIN for future stages)
- `emailVerified`: Null until email verification complete
- `createdAt/updatedAt`: Automatic timestamps

**Indexes:**
- `email`: Fast login queries
- `role`: Future role-based queries

#### 3.1.2 Account Model (NextAuth OAuth)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String  // "google", "facebook", "credentials"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

**Purpose:** NextAuth.js OAuth account linking (Google, Facebook)

**Key Fields:**
- `provider`: "google" | "facebook" | "credentials"
- `providerAccountId`: User ID from OAuth provider
- Tokens stored for refresh capability

**Indexes:**
- Unique constraint on `[provider, providerAccountId]` prevents duplicate OAuth links
- `userId` index for fast user → accounts lookup

#### 3.1.3 Session Model (NextAuth)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Purpose:** Store active sessions (JWT strategy with database sessions)

**Key Fields:**
- `sessionToken`: Unique token stored in HTTP-only cookie
- `expires`: Session expiry (7 days default, 30 days with "remember me")

#### 3.1.4 VerificationToken Model

```prisma
model VerificationToken {
  identifier String   // email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Purpose:** Email verification and password reset tokens

**Key Fields:**
- `identifier`: Email address
- `token`: Random generated token (CUID or UUID)
- `expires`: 24h for email verification, 1h for password reset

#### 3.1.5 UserProfile Model

```prisma
model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?  // R2 URL
  bio         String?  @db.Text
  location    String?  // Human-readable address
  latitude    Float?
  longitude   Float?
  preferences Json?    // {darkMode: boolean, categories: string[]}
  darkMode    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([latitude, longitude]) // PostGIS index for future geolocation
}
```

**Purpose:** Extended user profile data

**Key Fields:**
- `displayName`: User's chosen display name (max 50 chars via Zod)
- `avatar`: Cloudflare R2 URL (uploaded via presigned URL)
- `bio`: User bio (max 500 chars)
- `location`: Mapbox geocoded address string
- `latitude/longitude`: Geocoded coordinates (for future stages)
- `preferences`: JSON for flexible settings (categories, notification prefs)
- `darkMode`: Dark mode toggle state

**Indexes:**
- `userId`: 1:1 relationship with User
- `[latitude, longitude]`: Future geolocation queries (Stage 4+)

### 3.2 Database Setup Requirements

**PostgreSQL Extensions:**
```sql
-- Enable PostGIS for geolocation (future stages)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable trigram for fuzzy search (future stages)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Prisma Configuration:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Neon direct connection
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch"]
}
```

### 3.3 Migration Strategy

**Initial Migration:**
```bash
npx prisma migrate dev --name init_stage_01_core_auth
```

**Migration includes:**
- User, Account, Session, VerificationToken, UserProfile models
- Role enum
- All indexes and unique constraints
- Foreign key cascades (onDelete: Cascade for profile cleanup)

---

## 4. Routing Analysis (TO CREATE)

Based on brief.md Section 5.5 (lines 471-485), the following routes are required:

### 4.1 Public Routes (No Auth Required)

| Route | Planned Path | Type | Description |
|-------|-------------|------|-------------|
| Home (Feed Placeholder) | src/app/[locale]/page.tsx | RSC | Welcome page with CTA to signup (feed implemented in Stage 4) |
| Login | src/app/[locale]/login/page.tsx | RSC | Login form with OAuth buttons |
| Signup | src/app/[locale]/signup/page.tsx | RSC | Registration form |
| Verify Email | src/app/[locale]/verify-email/page.tsx | RSC | Email verification page (reads token from URL) |
| Forgot Password | src/app/[locale]/forgot-password/page.tsx | RSC | Forgot password form |
| Reset Password | src/app/[locale]/reset-password/page.tsx | RSC | Reset password form (reads token from URL) |

### 4.2 Protected Routes (Auth Required)

| Route | Planned Path | Auth | Description |
|-------|-------------|------|-------------|
| Settings - Profile | src/app/[locale]/settings/profile/page.tsx | Required | Edit profile form |
| Settings - Security | src/app/[locale]/settings/security/page.tsx | Required | Change password, delete account |
| Settings - Preferences | src/app/[locale]/settings/preferences/page.tsx | Required | Notification settings, categories (placeholder) |

### 4.3 Layout Structure

```
src/app/
├── [locale]/                           # i18n locale prefix (pl, en, de, es, ru)
│   ├── layout.tsx                      # Root layout: ThemeProvider, next-intl provider
│   ├── page.tsx                        # Home (feed placeholder)
│   ├── login/
│   │   └── page.tsx                    # Login page
│   ├── signup/
│   │   └── page.tsx                    # Signup page
│   ├── verify-email/
│   │   └── page.tsx                    # Email verification
│   ├── forgot-password/
│   │   └── page.tsx                    # Forgot password
│   ├── reset-password/
│   │   └── page.tsx                    # Reset password
│   └── settings/
│       ├── layout.tsx                  # Settings layout with navigation
│       ├── profile/
│       │   └── page.tsx                # Profile settings
│       ├── security/
│       │   └── page.tsx                # Security settings
│       └── preferences/
│           └── page.tsx                # Preferences (placeholder)
```

### 4.4 Middleware (Auth Protection)

**File:** src/middleware.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

  // Protected routes
  if (pathname.includes('/settings')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.includes('/login') || pathname.includes('/signup')) {
    if (token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 5. Frontend Patterns (TO IMPLEMENT)

### 5.1 Navigation Pattern

**Implementation:** App Sidebar with dynamic links based on auth state

**Example Structure (app-sidebar.tsx):**
```typescript
const navigationLinks = [
  { href: '/', label: getText('nav.home'), icon: HomeIcon, auth: false },
  { href: '/explore', label: getText('nav.explore'), icon: CompassIcon, auth: false },
  { href: '/following', label: getText('nav.following'), icon: HeartIcon, auth: true },
  { href: '/dashboard', label: getText('nav.dashboard'), icon: LayoutDashboardIcon, auth: true, role: 'COMPANY' },
  { href: '/admin', label: getText('nav.admin'), icon: ShieldIcon, auth: true, role: 'ADMIN' },
];

// Filter links based on session
const visibleLinks = navigationLinks.filter(link => {
  if (!link.auth) return true;
  if (!session) return false;
  if (link.role && session.user.role !== link.role) return false;
  return true;
});
```

**Translation Keys (next-intl):**
- File: `src/lib/locales/pl/common.json`
- Keys: `nav.home`, `nav.explore`, `nav.following`, etc.

### 5.2 Form Pattern

**Stack:** react-hook-form + Zod + Server Actions

**Example: Login Form**

```typescript
// Validation schema
const loginSchema = z.object({
  email: z.string().email({ message: getText('validation.email.invalid') }),
  password: z.string().min(8, { message: getText('validation.password.min') }),
  rememberMe: z.boolean().default(false),
});

// Form component
const LoginForm = () => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(getText('errors.login.failed'));
    } else {
      router.push('/');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="email" ... />
        <FormField name="password" ... />
        <FormField name="rememberMe" ... />
        <Button type="submit">
          {getText('auth.login.submit')}
        </Button>
      </form>
    </Form>
  );
};
```

**Validation Schemas Location:** `src/lib/validation.ts`

### 5.3 Translation Pattern (next-intl)

**Setup:**
```typescript
// src/lib/i18n.ts
export const locales = ['pl', 'en', 'de', 'es', 'ru'] as const;
export const defaultLocale = 'pl' as const;
```

**Translation Files Structure:**
```
src/lib/locales/
├── pl/
│   ├── common.json       # Navigation, buttons, errors
│   ├── auth.json         # Login, signup, password reset
│   ├── profile.json      # Profile settings
│   └── validation.json   # Form validation messages
├── en/
│   └── ... (same structure, prepared but empty for MVP)
├── de/
├── es/
└── ru/
```

**Usage in Server Components:**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function LoginPage() {
  const t = await getTranslations('auth.login');

  return <h1>{t('title')}</h1>;
}
```

**Usage in Client Components:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('auth.login');

  return <Button>{t('submit')}</Button>;
}
```

### 5.4 Dark Mode Pattern (next-themes)

**Setup:**
```typescript
// src/components/theme/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

**Toggle Component:**
```typescript
// src/components/theme/theme-toggle.tsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Tailwind Configuration:**
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... shadcn/ui color system
      },
    },
  },
};
```

**CSS Variables:**
```css
/* src/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... light mode colors */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode colors */
  }
}
```

**Persistence:**
- Authenticated users: Save to `UserProfile.darkMode` field
- Anonymous users: LocalStorage fallback (next-themes handles automatically)

### 5.5 Auth Pattern (NextAuth.js v5)

**Configuration File:** `src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) return null;
        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED');

        return user;
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days default
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login', // Error code passed as ?error=
  },
});
```

**API Route:** `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

---

## 6. Backend Patterns (TO IMPLEMENT)

### 6.1 Server Actions Pattern

**Pattern:** Auth → Validate (Zod) → Database → revalidatePath

**Example: Update Profile Action**

```typescript
// src/app/actions/profile/update.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function updateProfileAction(data: z.infer<typeof updateProfileSchema>) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // 2. Validate input
  const validated = updateProfileSchema.safeParse(data);
  if (!validated.success) {
    return { error: 'Invalid input', issues: validated.error.issues };
  }

  // 3. Update database
  try {
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validated.data,
      },
      update: validated.data,
    });

    // 4. Revalidate cached pages
    revalidatePath('/settings/profile');

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Failed to update profile' };
  }
}
```

**Location:** All server actions in `src/app/actions/` directory

### 6.2 API Routes Pattern (for non-mutation operations)

**Example: Generate Avatar Upload URL**

```typescript
// src/app/api/users/me/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { r2Client } from '@/lib/r2';

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Generate presigned URL for R2 upload
  try {
    const filename = `avatars/${session.user.id}/${Date.now()}.jpg`;
    const presignedUrl = await r2Client.generatePresignedUrl(filename, {
      expiresIn: 900, // 15 minutes
      maxSize: 2 * 1024 * 1024, // 2MB
    });

    return NextResponse.json({
      uploadUrl: presignedUrl,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${filename}`,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
```

### 6.3 Middleware Pattern (Auth + Locale Detection)

**File:** `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 1. i18n middleware
const intlMiddleware = createMiddleware({
  locales: ['pl', 'en', 'de', 'es', 'ru'],
  defaultLocale: 'pl',
  localePrefix: 'always',
});

// 2. Combined middleware
export async function middleware(req: NextRequest) {
  // Run i18n middleware first
  const intlResponse = intlMiddleware(req);
  if (intlResponse) return intlResponse;

  // Auth protection
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

  // Protected routes
  if (pathname.match(/\/[a-z]{2}\/settings/)) {
    if (!token) {
      return NextResponse.redirect(new URL('/pl/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### 6.4 Email Pattern (Resend + React Email)

**Setup:**
```typescript
// src/lib/resend.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Email Template Example (React Email):**
```typescript
// emails/VerifyEmail.tsx
import { Html, Button, Text } from '@react-email/components';

export default function VerifyEmail({ token }: { token: string }) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  return (
    <Html>
      <Text>Welcome to VideoShorts!</Text>
      <Text>Click the button below to verify your email:</Text>
      <Button href={verifyUrl}>Verify Email</Button>
      <Text>This link expires in 24 hours.</Text>
    </Html>
  );
}
```

**Sending Email (in Server Action):**
```typescript
import { resend } from '@/lib/resend';
import VerifyEmail from '@/emails/VerifyEmail';

await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: user.email,
  subject: 'Verify your email - VideoShorts',
  react: VerifyEmail({ token: verificationToken }),
});
```

---

## 7. External Services Integration

### 7.1 Services Required for Stage 1

| Service | Purpose | SDK/Library | Config Required | Priority |
|---------|---------|-------------|-----------------|----------|
| **Neon DB** | PostgreSQL database | Prisma | DATABASE_URL, DIRECT_URL | P0 Critical |
| **NextAuth.js** | Authentication | next-auth | NEXTAUTH_URL, NEXTAUTH_SECRET | P0 Critical |
| **Resend** | Email delivery | resend | RESEND_API_KEY, RESEND_FROM_EMAIL | P0 Critical |
| **Cloudflare R2** | Avatar storage | @aws-sdk/client-s3 | R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL | P0 Critical |
| **Google OAuth** | Social login | next-auth/providers/google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | P0 Critical |
| **Facebook OAuth** | Social login | next-auth/providers/facebook | FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET | P0 Critical |
| **Mapbox** | Location autocomplete | mapbox-gl | NEXT_PUBLIC_MAPBOX_TOKEN | P1 Important |
| **PostHog** | Analytics | posthog-js | NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST | P2 Nice-to-have |

### 7.2 Integration Details

#### Neon DB Setup

**Provision:**
1. Create Neon project at neon.tech
2. Get connection strings:
   - `DATABASE_URL`: Pooled connection (for Prisma queries)
   - `DIRECT_URL`: Direct connection (for migrations)

**Configuration:**
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
```

**Features Used:**
- Connection pooling (PgBouncer built-in)
- Auto-scaling compute
- Daily backups (automatic)

#### NextAuth.js Setup

**Generate Secret:**
```bash
openssl rand -base64 32
```

**Configuration:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-here"
```

**OAuth Providers Setup:**

**Google Cloud Console:**
1. Create OAuth 2.0 Client ID
2. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://videoshorts.pl/api/auth/callback/google`
3. Get CLIENT_ID and CLIENT_SECRET

**Facebook Developers:**
1. Create App
2. Add "Facebook Login" product
3. Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://videoshorts.pl/api/auth/callback/facebook`
4. Get APP_ID (CLIENT_ID) and APP_SECRET (CLIENT_SECRET)

#### Cloudflare R2 Setup

**Steps:**
1. Create R2 bucket: `videoshorts-avatars`
2. Generate API token with R2 permissions
3. Configure CORS:
   ```json
   [
     {
       "AllowedOrigins": ["https://videoshorts.pl", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

**SDK Setup:**
```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generatePresignedUrl(key: string, expiresIn = 900) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}
```

#### Resend Setup

**Steps:**
1. Sign up at resend.com
2. Add domain and verify DNS records
3. Get API key

**Configuration:**
```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@videoshorts.pl"
```

**Domain Verification:**
- Add TXT and MX records to DNS
- Wait for verification (up to 48h)

#### Mapbox Setup

**Steps:**
1. Sign up at mapbox.com
2. Get public access token

**Configuration:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."
```

**Usage (Client Component):**
```typescript
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [21.0122, 52.2297], // Warsaw
  zoom: 10,
});
```

**Geocoding Autocomplete:**
```typescript
// src/components/profile/location-autocomplete.tsx
import { useEffect, useState } from 'react';

const LocationAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 3) return;

    const geocode = async () => {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=pl&types=place,address`
      );
      const data = await response.json();
      setSuggestions(data.features);
    };

    const debounce = setTimeout(geocode, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    // Autocomplete UI with suggestions dropdown
  );
};
```

#### PostHog Setup

**Steps:**
1. Sign up at posthog.com
2. Get project API key

**Configuration:**
```env
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

**Setup (Client Component):**
```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: true,
  });
}

export default posthog;
```

**Usage:**
```typescript
import posthog from '@/lib/posthog';

// Track events
posthog.capture('user_signed_up', {
  method: 'email',
});
```

---

## 8. Gap Analysis (EVERYTHING NEEDS CREATION)

Since this is a greenfield project, ALL infrastructure and code must be created from scratch.

### 8.1 Project Setup Required

**Initialize Next.js Project:**
```bash
npx create-next-app@latest videoshorts --typescript --tailwind --app --src-dir
cd videoshorts
```

**Install Dependencies:**
```bash
# Core
npm install next@14.2.0 react@19 react-dom@19 typescript@5.3

# Database & Auth
npm install prisma@5.8 @prisma/client@5.8
npm install next-auth@5 @auth/prisma-adapter
npm install bcryptjs @types/bcryptjs

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea label form dialog dropdown-menu sheet avatar separator toast alert

# Styling
npm install tailwindcss@3.4 postcss autoprefixer
npm install next-themes

# i18n
npm install next-intl

# Storage & Email
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install resend @react-email/components

# Maps
npm install mapbox-gl @types/mapbox-gl

# Analytics (optional)
npm install posthog-js

# Utils
npm install date-fns clsx tailwind-merge
```

**Configuration Files to Create:**
- `next.config.js`: i18n, image domains
- `tailwind.config.js`: shadcn/ui theme, dark mode
- `tsconfig.json`: Path aliases, strict mode
- `.env.local`: All environment variables
- `.env.example`: Template for developers
- `prisma/schema.prisma`: Database schema
- `package.json`: Scripts (dev, build, prisma commands)

### 8.2 Components to Create (from Section 1)

**Priority P0 (Critical Path):**
- LoginForm, SignupForm, OAuthButtons
- VerifyEmailPage, ForgotPasswordForm, ResetPasswordForm
- Header, Sidebar, Footer, UserMenu
- ThemeProvider, ThemeToggle

**Priority P1 (Important):**
- ProfileForm, AvatarUpload, PasswordChangeForm
- DeleteAccountDialog, PreferencesForm
- MobileDrawer, AppSidebar

**Priority P2 (Nice-to-have):**
- LoadingSpinner, ErrorBoundary, LocaleSwitcher

### 8.3 APIs to Create (from Section 2)

**Server Actions (Preferred):**
- signupAction, verifyEmailAction
- forgotPasswordAction, resetPasswordAction
- updateProfileAction, changePasswordAction, deleteAccountAction

**API Routes:**
- `/api/auth/[...nextauth]/route.ts` (NextAuth handlers)
- `/api/users/me/avatar/route.ts` (R2 presigned URL)

### 8.4 Database Setup

**Prisma Initialization:**
```bash
npx prisma init --datasource-provider postgresql
```

**Create Schema:**
- Copy models from Section 3.1 to `prisma/schema.prisma`
- Add datasource and generator config

**Initial Migration:**
```bash
npx prisma migrate dev --name init_stage_01
npx prisma generate
```

**Seed Script (Optional):**
```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@videoshorts.pl',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          displayName: 'Admin',
        },
      },
    },
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 8.5 Routing Setup

**Pages to Create:**
- All routes from Section 4
- Layouts: root layout, settings layout
- Loading states: `loading.tsx` files
- Error boundaries: `error.tsx` files

### 8.6 Translation Files

**Create Directory Structure:**
```bash
mkdir -p src/lib/locales/{pl,en,de,es,ru}
```

**Polish Translation Files (Complete):**
- `pl/common.json`: Navigation, buttons, errors
- `pl/auth.json`: Login, signup, verification
- `pl/profile.json`: Profile settings
- `pl/validation.json`: Form validation messages

**Other Languages (Prepared, Empty):**
- Same structure for en, de, es, ru
- Empty JSON objects `{}`
- Can be filled post-MVP

### 8.7 External Service Setup

**Pre-Development Checklist:**
- [ ] Neon DB account + project created
- [ ] Vercel account + project created
- [ ] Cloudflare R2 bucket created + CORS configured
- [ ] Resend account + domain verified
- [ ] Google Cloud OAuth credentials
- [ ] Facebook Developer OAuth app
- [ ] Mapbox account + token (optional for MVP)
- [ ] PostHog account + key (optional for MVP)

**Environment Variables Template (`.env.example`):**
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="videoshorts-avatars"
R2_PUBLIC_URL=""

# Resend
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@videoshorts.pl"

# Mapbox (optional)
NEXT_PUBLIC_MAPBOX_TOKEN=""

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### 8.8 DevOps Setup

**Vercel Configuration:**
1. Connect GitHub repository
2. Configure environment variables (production + staging)
3. Set up automatic deployments:
   - `main` branch → production
   - `staging` branch → staging environment
4. Enable Vercel Analytics

**GitHub Repository:**
```bash
git init
git add .
git commit -m "Initial commit - Stage 1 setup"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

**GitHub Actions (Optional CI):**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npx prisma validate
```

---

## 9. Tech Stack Summary

### 9.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2+ | Framework (App Router, RSC, SSR) |
| React | 19+ | UI library |
| TypeScript | 5.3+ | Type safety |
| Tailwind CSS | 3.4+ | Utility-first styling |
| shadcn/ui | latest | Component library (Radix UI primitives) |
| next-themes | latest | Dark mode support |
| next-intl | latest | i18n (Polish + 4 more languages prepared) |
| react-hook-form | 7.50+ | Form state management |
| zod | 3.22+ | Schema validation |

### 9.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.2+ | REST API endpoints |
| Server Actions | Next.js 14+ | Type-safe mutations |
| NextAuth.js | 5+ (Auth.js) | Authentication (email, OAuth) |
| Prisma | 5.8+ | ORM + migrations |
| bcryptjs | 2.4+ | Password hashing (cost 12) |

### 9.3 Database

| Technology | Version | Purpose |
|------------|---------|---------|
| Neon DB | PostgreSQL 15+ | Serverless Postgres |
| Prisma Client | 5.8+ | Type-safe database queries |
| PostGIS | 3.4+ | Geospatial extension (for future stages) |

### 9.4 External Services

| Service | SDK/Library | Purpose |
|---------|-------------|---------|
| Cloudflare R2 | @aws-sdk/client-s3 | Avatar image storage |
| Resend | resend | Transactional email delivery |
| React Email | @react-email/* | Email templates (JSX) |
| Mapbox | mapbox-gl | Location autocomplete, geocoding |
| PostHog | posthog-js | Product analytics (optional) |

### 9.5 DevOps & Tooling

| Tool | Purpose |
|------|---------|
| Vercel | Hosting, deployments, edge functions |
| GitHub | Version control |
| GitHub Actions | CI (lint, type-check, tests) |
| Vercel Analytics | Core Web Vitals monitoring |

---

## 10. Environment Variables (Complete List)

### 10.1 Required for Development

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
FACEBOOK_CLIENT_ID="xxx"
FACEBOOK_CLIENT_SECRET="xxx"

# Cloudflare R2
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="videoshorts-avatars"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Resend (Email)
RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="noreply@videoshorts.pl"

# Mapbox (Optional for MVP)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1xxx"

# PostHog (Optional for MVP)
NEXT_PUBLIC_POSTHOG_KEY="phc_xxx"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### 10.2 Required for Production (Vercel)

**Same as development, but with production URLs:**
- `NEXTAUTH_URL="https://videoshorts.pl"`
- Production OAuth redirect URIs configured
- Production R2 bucket (separate from staging)
- Production Resend domain (verified)

### 10.3 Staging Environment

**Same structure, different values:**
- `NEXTAUTH_URL="https://staging.videoshorts.pl"`
- Staging database (separate Neon project)
- Staging R2 bucket
- Same OAuth apps (add staging redirect URIs)

---

## 11. Reusable Patterns for Architecture Phase

### 11.1 File Organization Pattern

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routes
│   ├── api/                      # API routes
│   └── actions/                  # Server Actions
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── auth/                     # Auth-specific components
│   ├── profile/                  # Profile-specific components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared utilities
├── lib/                          # Business logic & utilities
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── validation.ts             # Zod schemas
│   ├── r2.ts                     # Cloudflare R2 client
│   ├── resend.ts                 # Resend client
│   └── locales/                  # i18n translation files
├── types/                        # TypeScript types
└── middleware.ts                 # Edge middleware
```

### 11.2 Naming Conventions

**Components:**
- PascalCase: `LoginForm`, `AvatarUpload`, `ThemeToggle`
- Descriptive suffixes: `-form`, `-dialog`, `-button`, `-menu`

**Server Actions:**
- camelCase with `Action` suffix: `signupAction`, `updateProfileAction`
- File location: `src/app/actions/[domain]/[action].ts`

**API Routes:**
- REST convention: `route.ts` in folder matching endpoint
- Example: `/api/users/me/route.ts` for `/api/users/me`

**Database Models:**
- PascalCase singular: `User`, `UserProfile`, `Account`
- Relations: descriptive names (`profile`, `accounts`, `user`)

**Translation Keys:**
- Dot notation: `auth.login.title`, `validation.email.invalid`
- Namespaced by domain: `auth.*`, `profile.*`, `common.*`

### 11.3 Error Handling Pattern

**Server Actions:**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: ZodIssue[] };

export async function myAction(data: unknown): Promise<ActionResult<MyData>> {
  try {
    // ... validation, auth, database
    return { success: true, data: result };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}
```

**Client Components:**
```typescript
const handleSubmit = async (data: FormData) => {
  const result = await myAction(data);

  if (result.success) {
    toast.success('Success!');
    router.push('/success');
  } else {
    toast.error(result.error);
  }
};
```

### 11.4 Loading & Error States

**Loading State:**
```typescript
// app/[locale]/settings/profile/loading.tsx
export default function Loading() {
  return <Skeleton className="h-96 w-full" />;
}
```

**Error Boundary:**
```typescript
// app/[locale]/settings/profile/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error loading profile</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button onClick={reset}>Try again</Button>
    </Alert>
  );
}
```

---

## 12. Recommendations for Architecture Phase

### 12.1 Component Architecture

**Recommendation:** Use React Server Components (RSC) by default, Client Components only when necessary

**RSC Usage (Default):**
- Pages (all routes)
- Layout components (Header, Footer, Sidebar)
- Static forms (no real-time interactions)

**Client Components (When Needed):**
- Forms with react-hook-form (`'use client'`)
- Interactive elements (ThemeToggle, modals, dropdowns)
- Hooks usage (useState, useEffect, useRouter)
- Third-party libraries requiring browser APIs (Mapbox)

**Example Pattern:**
```typescript
// Server Component (default)
export default async function ProfilePage() {
  const session = await auth();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  return <ProfileForm initialData={profile} />; // Client Component
}

// Client Component
'use client';
export function ProfileForm({ initialData }) {
  const form = useForm({ defaultValues: initialData });
  // ... form logic
}
```

### 12.2 Data Fetching Strategy

**Recommendation:** Use RSC for initial data, TanStack Query for client-side interactions (if needed in future stages)

**Current Stage (1):**
- All data fetching in Server Components
- No need for React Query yet (no real-time updates)
- Use revalidatePath after mutations

**Future Stages (4+):**
- React Query for infinite scroll feed
- Optimistic updates for likes/comments
- Real-time notifications

### 12.3 Form Validation Strategy

**Recommendation:** Dual validation (client + server)

**Client-Side (UX):**
```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

**Server-Side (Security):**
```typescript
export async function signupAction(data: unknown) {
  const validated = schema.safeParse(data);
  if (!validated.success) {
    return { error: 'Invalid input', issues: validated.error.issues };
  }
  // ... proceed
}
```

**Why Both?**
- Client: Immediate feedback, better UX
- Server: Security (never trust client), API endpoints protection

### 12.4 Authentication Flow

**Recommendation:** NextAuth.js v5 with JWT strategy + database sessions

**Why JWT + DB Sessions?**
- JWT: Fast validation (no DB roundtrip for every request)
- DB Sessions: Ability to invalidate sessions (logout all devices)
- Best of both worlds: performance + security

**Session Refresh:**
```typescript
// middleware.ts
const token = await getToken({ req });
if (token && isExpiringSoon(token)) {
  // Trigger session refresh
  await refreshSession(token);
}
```

### 12.5 Email Verification Flow

**Recommendation:** Token-based with expiry + manual resend option

**Flow:**
1. User signs up → Create User (emailVerified: null)
2. Generate token → Store in VerificationToken table
3. Send email with link → `https://videoshorts.pl/verify-email?token=xxx`
4. User clicks link → Validate token → Set emailVerified → Redirect to onboarding
5. If expired → Show "Resend verification email" button

**Token Security:**
- Random CUID (not sequential)
- 24h expiry
- Single use (delete after verification)

### 12.6 Dark Mode Implementation

**Recommendation:** System preference detection + user override

**Implementation:**
```typescript
// ThemeProvider defaultTheme="system"
// User preference overrides system
// Persisted in UserProfile.darkMode (if authenticated) or localStorage (if not)
```

**CSS Strategy:**
```css
/* Tailwind dark: classes */
<div className="bg-white dark:bg-slate-900">
<p className="text-black dark:text-white">
```

**All components must include dark: variants**

### 12.7 i18n Strategy

**Recommendation:** URL-based locales with server-side translations

**URL Structure:**
- `/pl/login` (default)
- `/en/login`
- `/de/login`
- etc.

**Why URL-based?**
- SEO friendly
- Shareable localized links
- Clear user intent

**Translation Loading:**
```typescript
// Server Component
const t = await getTranslations('auth.login');

// Client Component
const t = useTranslations('auth.login');
```

**Translation File Split:**
- Small files by domain (`auth.json`, `profile.json`)
- NOT one huge `translations.json`
- Easier maintenance

### 12.8 Security Recommendations

**Password Requirements:**
- Minimum 8 characters (enforce in Zod)
- Optional: complexity rules (post-MVP)
- bcrypt cost factor: 12 (balance security vs performance)

**Rate Limiting:**
- Start liberal in MVP (avoid false positives)
- Login: 5 attempts per 15 min (per IP)
- Signup: 3 per hour (per IP)
- Tighten post-launch based on data

**CSRF Protection:**
- NextAuth handles automatically
- Server Actions include CSRF token
- No additional work needed

**XSS Prevention:**
- React auto-escapes (default safe)
- Markdown rendering: Use DOMPurify (if bio supports markdown in future)

**SQL Injection:**
- Prisma parameterized queries (default safe)
- NEVER use raw SQL in MVP

---

## 13. Testing Strategy Recommendations

### 13.1 Unit Tests (Recommended Post-MVP)

**Tools:** Jest + React Testing Library

**What to Test:**
- Utility functions (validation, formatters)
- Server Actions (mock Prisma)
- Component logic (form submissions)

### 13.2 Integration Tests (Recommended Post-MVP)

**Tools:** Playwright or Cypress

**What to Test:**
- Auth flows (signup → verify → login)
- Profile update flow
- OAuth flows (mock providers)

### 13.3 Manual Testing Checklist (MVP)

**Auth:**
- [ ] Sign up with email/password
- [ ] Receive verification email
- [ ] Verify email via link
- [ ] Login with credentials
- [ ] Login with Google OAuth
- [ ] Login with Facebook OAuth
- [ ] Forgot password flow
- [ ] Reset password via email link
- [ ] Logout

**Profile:**
- [ ] View profile
- [ ] Update display name
- [ ] Update bio
- [ ] Update location (Mapbox autocomplete)
- [ ] Upload avatar (R2)
- [ ] Change password
- [ ] Delete account

**Layout:**
- [ ] Navigation works (Header, Sidebar, Footer)
- [ ] Dark mode toggle
- [ ] Mobile responsive (drawer, touch targets)
- [ ] User menu dropdown

**i18n:**
- [ ] Polish translations complete
- [ ] Locale switcher shows all languages
- [ ] URLs include locale prefix

---

## 14. Documentation Requirements

### 14.1 README.md

**Must Include:**
- Project overview
- Tech stack
- Prerequisites (Node 20+, pnpm, etc.)
- Setup instructions:
  ```bash
  npm install
  cp .env.example .env.local
  # Fill in env vars
  npx prisma migrate dev
  npm run dev
  ```
- Scripts:
  - `npm run dev`: Development server
  - `npm run build`: Production build
  - `npm run start`: Production server
  - `npm run lint`: ESLint
  - `npm run type-check`: TypeScript check
  - `npx prisma studio`: Database GUI
- Deployment (Vercel)
- Environment variables list

### 14.2 Prisma Schema Comments

**Recommendation:** Document all models

```prisma
/// User account (can be upgraded to COMPANY)
model User {
  /// Unique identifier (CUID)
  id String @id @default(cuid())

  /// Email address (unique, used for login)
  email String @unique

  /// Nullable: OAuth users don't have passwords
  passwordHash String?

  // ... etc
}
```

### 14.3 API Documentation (Optional MVP)

**Post-MVP:** Generate OpenAPI spec for API routes

**Tools:** swagger-jsdoc + swagger-ui-express

---

## 15. Performance Budget (Stage 1)

### 15.1 Core Web Vitals Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| LCP (Largest Contentful Paint) | < 1.5s | 2.5s |
| FID (First Input Delay) | < 50ms | 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 | 0.1 |

**Why Stage 1 should be fast:**
- Minimal JavaScript (mostly RSC)
- No video player
- No infinite scroll
- Simple forms

### 15.2 Bundle Size

**Target:** < 200KB initial JS bundle

**Optimization:**
- Tree shaking (automatic in Next.js)
- Dynamic imports for heavy components
- shadcn/ui (no full library import)

**Example:**
```typescript
// Bad
import { Button, Dialog, Input, ... } from 'shadcn-ui';

// Good (already done by shadcn/ui CLI)
import { Button } from '@/components/ui/button';
```

### 15.3 Database Query Performance

**Target:** < 100ms p95 for profile queries

**Optimization:**
- Indexes on all FK
- Select only needed fields
- No N+1 queries (use Prisma `include`)

**Example:**
```typescript
// Good
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    profile: {
      select: {
        displayName: true,
        avatar: true,
      },
    },
  },
});
```

---

## 16. Risks & Mitigation Strategies

### 16.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OAuth provider downtime | High | Low | Always offer email/password fallback |
| Resend email delivery failures | High | Low | Manual resend button + retry logic |
| R2 upload failures | Medium | Low | Client retry (1 attempt) + clear error message |
| Neon DB connection issues | High | Low | Connection pooling, retry logic, error boundaries |
| NextAuth session issues | High | Medium | Thorough testing, fallback to re-login |

### 16.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't verify email | Medium | Medium | Clear onboarding flow, resend option, reminder emails |
| OAuth confusion (users try to login with wrong provider) | Low | Medium | Clear messaging, "Continue with Google/Facebook" buttons |
| Password reset abuse | Low | Low | Rate limiting (3 requests/hour per email) |

### 16.3 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Brute force login attempts | High | Medium | Rate limiting (5 attempts/15 min), CAPTCHA (post-MVP) |
| Email enumeration | Medium | Medium | Generic error messages ("If email exists, link sent") |
| Session hijacking | High | Low | HTTP-only cookies, Secure flag, short expiry |
| XSS via bio field | Medium | Low | React auto-escape, DOMPurify if markdown support |

---

## 17. Stage 1 Completion Checklist

### 17.1 Functional Criteria

- [ ] User can sign up with email/password
- [ ] User receives verification email (Resend)
- [ ] User can verify email via link
- [ ] User can log in with email/password
- [ ] User can log in with Google OAuth
- [ ] User can log in with Facebook OAuth
- [ ] User can reset password (forgot password flow)
- [ ] User can view their profile
- [ ] User can edit profile (display name, bio, location)
- [ ] User can upload avatar (R2)
- [ ] User can change password
- [ ] User can delete account (soft delete)
- [ ] Dark mode toggle works
- [ ] Dark mode preference persists
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] Navigation works (Header, Sidebar, Footer)
- [ ] Mobile drawer works
- [ ] i18n routing works (/pl, /en, etc.)
- [ ] Polish translations complete

### 17.2 Non-Functional Criteria

- [ ] LCP < 2s (p95)
- [ ] FID < 100ms (p95)
- [ ] No console errors in production
- [ ] All forms have validation
- [ ] All errors have user-friendly messages
- [ ] All mutations show loading states
- [ ] All mutations show success/error toasts
- [ ] Mobile touch targets >= 44x44px
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)

### 17.3 Security Criteria

- [ ] Passwords hashed with bcrypt (cost 12)
- [ ] Rate limiting active (login, signup)
- [ ] CSRF protection enabled
- [ ] Session cookies HTTP-only + Secure
- [ ] No sensitive data in console.log (production)
- [ ] OAuth state parameter validated
- [ ] Email verification required before full access

### 17.4 DevOps Criteria

- [ ] Deployed to Vercel (staging + production)
- [ ] Environment variables configured
- [ ] Prisma migrations run successfully
- [ ] Database backups enabled (Neon auto-backup)
- [ ] Vercel Analytics enabled
- [ ] Error boundaries catch runtime errors
- [ ] 404 page works
- [ ] 500 page works

### 17.5 Documentation Criteria

- [ ] README.md complete (setup instructions)
- [ ] .env.example complete (all vars listed)
- [ ] Prisma schema has comments
- [ ] Code has JSDoc comments (complex functions)
- [ ] Translation keys documented (common.json structure)

---

## 18. Next Steps After Stage 1

### 18.1 Immediate Follow-Up (Stage 2)

**Focus:** Company Profiles + Verification

**What's Needed:**
- Upgrade user to company flow
- NIP validation + VIES API integration
- Company profile creation (logo, banner, description)
- Category management (admin panel basics)
- Company public profile page

**Dependencies on Stage 1:**
- User authentication (done)
- Profile system (extend to company profile)
- Layout (add dashboard navigation)

### 18.2 Stage 3: Shorts Upload

**What's Needed:**
- Mux integration (direct upload)
- Short metadata form
- Stripe checkout integration
- Payment webhooks
- Video transcoding status tracking

**Dependencies on Stage 1 & 2:**
- Company profiles (only companies can upload)
- Auth system (protect upload routes)

### 18.3 Stage 4: Feed

**What's Needed:**
- Feed query with filters (location, categories)
- Infinite scroll component
- Video player (Mux Player)
- Geolocation filter (Mapbox)
- Search functionality

**Dependencies on Stage 1, 2, 3:**
- Layout (embed feed in home page)
- Dark mode (video player theme)

---

## 19. Conclusion

This greenfield analysis provides a comprehensive blueprint for implementing Stage 1 (Core + Auth) of the VideoShorts platform. All components, APIs, database models, routing, patterns, and external services have been documented with specific implementation guidance.

### Key Takeaways:

1. **Comprehensive Scope:** 20+ components, 10+ API endpoints, 5 database models, complete auth flow
2. **Modern Stack:** Next.js 14+ App Router, React Server Components, shadcn/ui, Prisma, NextAuth v5
3. **Security-First:** bcrypt password hashing, rate limiting, CSRF protection, OAuth
4. **Performance-Optimized:** RSC default, minimal client JS, optimized queries
5. **Future-Proof:** i18n ready, dark mode, modular architecture, clear patterns

### Success Metrics for Stage 1:

- **Functional:** All 9 user stories from brief.md completed
- **Performance:** LCP < 2s, no console errors
- **Security:** All authentication flows secure, rate limiting active
- **DevOps:** Deployed to Vercel, environment variables configured, database migrated

**Next Phase:** Architecture design (subagent_architect will create technical implementation plan based on this analysis)

---

**Prepared by:** Code Analyst Agent (Greenfield Mode)
**Date:** 2025-11-28
**Iteration:** 1/3
**Status:** Ready for Architecture Phase
