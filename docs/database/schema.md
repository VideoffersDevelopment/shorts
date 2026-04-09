# Database Schema

Complete database schema overview.

**File:** `prisma/schema.prisma`

---

## Models

### User

Core user entity for authentication.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   // Nullable for OAuth users
  role          Role      @default(USER)
  emailVerified DateTime?
  deletedAt     DateTime? // Soft delete
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile  UserProfile?
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([role])
  @@index([deletedAt])
}
```

### Account

OAuth provider accounts (NextAuth).

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

### Session

User sessions (NextAuth).

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

### VerificationToken

Email verification and password reset tokens.

```prisma
model VerificationToken {
  identifier String   // Email address
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### UserProfile

Extended user profile data.

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
  @@index([latitude, longitude])
}
```

---

## Enums

### Role

```prisma
enum Role {
  USER      // Regular user
  COMPANY   // Company account
  ADMIN     // Administrator
}
```

---

## Relationships

### User → UserProfile (1:1)

```typescript
// User has one profile
user.profile

// Profile belongs to one user
profile.user
```

### User → Account (1:N)

```typescript
// User can have multiple OAuth accounts
user.accounts

// Each account belongs to one user
account.user
```

### User → Session (1:N)

```typescript
// User can have multiple sessions
user.sessions

// Each session belongs to one user
session.user
```

---

## Cascade Behaviors

All foreign key relations use `onDelete: Cascade`:

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Implications:**
- Deleting a User automatically deletes:
  - UserProfile
  - All Accounts
  - All Sessions

---

## Constraints

### Unique Constraints

- `User.email` - Each email must be unique
- `Account.[provider, providerAccountId]` - Unique OAuth account per provider
- `Session.sessionToken` - Each session token must be unique
- `VerificationToken.token` - Each verification token must be unique
- `VerificationToken.[identifier, token]` - Composite unique
- `UserProfile.userId` - One profile per user

---

## Default Values

| Model       | Field       | Default         |
|-------------|-------------|-----------------|
| User        | id          | cuid()          |
| User        | role        | USER            |
| User        | createdAt   | now()           |
| User        | updatedAt   | now()           |
| UserProfile | id          | cuid()          |
| UserProfile | darkMode    | false           |
| UserProfile | createdAt   | now()           |
| UserProfile | updatedAt   | now()           |
| Account     | id          | cuid()          |
| Session     | id          | cuid()          |

---

**Last Updated:** 2025-11-29
