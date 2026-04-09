# Task 02: Core Infrastructure

## Overview

**Priority:** HIGH
**Dependencies:** task-01
**Complexity:** Medium (12 files, ~12k tokens)
**Status:** pending

## What to Build

Setup Prisma ORM with database schema, configure NextAuth.js v5 with OAuth providers, create Cloudflare R2 client for file uploads, setup Resend email client, create validation schemas with Zod, and setup middleware for i18n and auth protection.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `prisma/schema.prisma` | Create | Database schema (5 models) |
| `prisma/seed.ts` | Create | Database seed script |
| `src/lib/auth.ts` | Create | NextAuth v5 configuration |
| `src/lib/prisma.ts` | Create | Prisma client singleton |
| `src/lib/r2.ts` | Create | Cloudflare R2 client |
| `src/lib/resend.ts` | Create | Resend email client |
| `src/lib/validation.ts` | Create | Zod validation schemas |
| `src/lib/utils.ts` | Create | Utility functions (cn, etc.) |
| `src/middleware.ts` | Create | i18n + auth middleware |
| `src/app/api/auth/[...nextauth]/route.ts` | Create | NextAuth API route |
| `src/types/next-auth.d.ts` | Create | NextAuth TypeScript types |
| `src/app/globals.css` | Create | Global CSS with theme variables |

## Acceptance Criteria

- [ ] Prisma schema defines 5 models (User, Account, Session, VerificationToken, UserProfile)
- [ ] Database migrations created: `npx prisma migrate dev --name init`
- [ ] Prisma Client generated: `npx prisma generate`
- [ ] NextAuth v5 configured with Credentials + Google + Facebook providers
- [ ] R2 client can generate presigned URLs
- [ ] Resend client can send emails
- [ ] Zod schemas validate all form inputs
- [ ] Middleware protects `/panel/*` routes
- [ ] Middleware detects locale from URL
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Database Schema

### Prisma Schema (prisma/schema.prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  COMPANY
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          Role      @default(USER)
  emailVerified DateTime? @db.Timestamptz
  createdAt     DateTime  @default(now()) @db.Timestamptz
  updatedAt     DateTime  @updatedAt @db.Timestamptz

  profile  UserProfile?
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([role])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
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

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime @db.Timestamptz

  @@unique([identifier, token])
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?
  bio         String?  @db.Text
  location    String?
  latitude    Float?
  longitude   Float?
  preferences Json?
  darkMode    Boolean  @default(false)
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([latitude, longitude])
}
```

## Key Implementations

### NextAuth Configuration (src/lib/auth.ts)

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!
    }),
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED")
        return { id: user.id, email: user.email, role: user.role }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    }
  }
})
```

### Middleware (src/middleware.ts)

```typescript
import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { auth } from "@/lib/auth"

const intlMiddleware = createMiddleware({
  locales: ["pl", "en", "de", "es", "ru"],
  defaultLocale: "pl",
  localePrefix: "always"
})

export default async function middleware(req: NextRequest) {
  // 1. Locale detection
  const response = intlMiddleware(req)

  // 2. Auth protection
  const session = await auth()
  const isAuthPage = req.nextUrl.pathname.match(/\/(login|signup|verify-email|forgot-password|reset-password)/)
  const isProtectedPage = req.nextUrl.pathname.includes("/panel")

  if (isProtectedPage && !session) {
    const locale = req.nextUrl.pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  if (isAuthPage && session) {
    const locale = req.nextUrl.pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/panel`, req.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
}
```

### Validation Schemas (src/lib/validation.ts)

```typescript
import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

export const emailSchema = z.object({
  email: z.string().email("Invalid email address")
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const profileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "Type DELETE to confirm"
  })
})
```

## Visual Verification Steps

### Prerequisites
- Task 01 completed
- PostgreSQL database available (Neon DB)
- `.env.local` with DATABASE_URL configured

### Steps
| Step | Action | Expected Result | Command/Verification |
|------|--------|-----------------|---------------------|
| 1 | Validate Prisma schema | Schema is valid | `npx prisma validate` exits with code 0 |
| 2 | Run migrations | Tables created | `npx prisma migrate dev --name init` creates migration |
| 3 | Generate Prisma Client | Client generated | `npx prisma generate` completes |
| 4 | Open Prisma Studio | Database GUI opens | `npx prisma studio` opens on port 5555 |
| 5 | Verify tables | All 5 tables visible | User, Account, Session, VerificationToken, UserProfile in Studio |
| 6 | Test middleware | No import errors | `npm run build` passes |
| 7 | Check auth setup | NextAuth route accessible | API route `/api/auth/providers` responds |

### Verification Commands
```bash
# Validate Prisma schema
npx prisma validate

# Create and apply migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open database GUI
npx prisma studio

# Build to verify all imports
npm run build

# Start dev server
npm run dev

# Test auth endpoint (in another terminal)
curl http://localhost:3000/api/auth/providers
```

### Database Verification in Prisma Studio
- [ ] User table exists with all columns
- [ ] Account table exists with provider fields
- [ ] Session table exists with sessionToken
- [ ] VerificationToken table exists
- [ ] UserProfile table exists with preferences field

## Notes

1. Run migrations AFTER creating schema: `npx prisma migrate dev --name init`
2. Generate Prisma Client: `npx prisma generate`
3. Test database connection in Prisma Studio: `npx prisma studio`
4. Ensure all environment variables are set in `.env.local`
5. NextAuth v5 uses edge-compatible JWT sessions by default
6. R2 presigned URLs expire after 1 hour (3600 seconds)
7. Middleware runs on ALL routes except `/api`, `/_next`, static files
