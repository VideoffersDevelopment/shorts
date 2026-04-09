# Database Documentation

PostgreSQL database schema and model documentation.

**Database:** Neon (PostgreSQL 15+)
**ORM:** Prisma
**Schema File:** `prisma/schema.prisma`

---

## Quick Links

- [Schema Overview](./schema.md)
- [Models](./models/README.md)

---

## Database Overview

### Technology Stack

- **Database:** Neon PostgreSQL 15+
- **ORM:** Prisma 5.8+
- **Migration Tool:** Prisma Migrate
- **Connection:** Connection pooling enabled

### Schema Statistics

- **Total Models:** 5
- **Total Enums:** 1
- **Total Relations:** 7

---

## Models

| Model             | Purpose                    | Key Relations           |
|-------------------|----------------------------|-------------------------|
| User              | Core user entity           | → UserProfile, Account  |
| Account           | OAuth provider accounts    | → User                  |
| Session           | User sessions (NextAuth)   | → User                  |
| VerificationToken | Email verification tokens  | None                    |
| UserProfile       | Extended user data         | → User                  |

---

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└─────────────┘
      │ 1
      ├──────< Account (1:N)
      │
      ├──────< Session (1:N)
      │
      └────── UserProfile (1:1)
```

---

## Enums

### Role

User role enumeration.

```prisma
enum Role {
  USER      // Regular user
  COMPANY   // Company account
  ADMIN     // Administrator
}
```

---

## Indexes

Optimized indexes for common queries:

| Model       | Index Fields            | Purpose                     |
|-------------|-------------------------|-----------------------------|
| User        | email                   | Fast user lookup            |
| User        | role                    | Role-based queries          |
| User        | deletedAt               | Soft delete filtering       |
| Account     | userId                  | User's accounts lookup      |
| Session     | userId                  | User's sessions lookup      |
| UserProfile | userId                  | Profile lookup              |
| UserProfile | latitude, longitude     | Geospatial queries          |

---

## Common Queries

### Get User with Profile

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { profile: true }
})
```

### Get User with All Relations

```typescript
const user = await prisma.user.findUnique({
  where: { email },
  include: {
    profile: true,
    accounts: true,
    sessions: true
  }
})
```

### Update Profile

```typescript
const profile = await prisma.userProfile.update({
  where: { userId },
  data: {
    displayName: 'New Name',
    avatar: 'https://...'
  }
})
```

### Soft Delete User

```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() }
})
```

---

## Migrations

Migrations are managed with Prisma Migrate.

### Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Migration History

| Migration           | Date       | Description                   |
|---------------------|------------|-------------------------------|
| initial_schema      | 2025-11-28 | Initial database schema       |

---

## Best Practices

### Prisma Client Usage

**Import:**
```typescript
import { prisma } from '@/lib/prisma'
```

**Connection:**
- Use singleton pattern (prevents connection exhaustion)
- Automatically managed in dev and production

### Transactions

```typescript
await prisma.$transaction([
  prisma.user.update({ ... }),
  prisma.userProfile.update({ ... })
])
```

### Error Handling

```typescript
try {
  const user = await prisma.user.create({ ... })
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
  }
}
```

---

## Related Documentation

- [UserProfile Model](./models/user-profile.md)
- [User Model](./models/user.md)

---

**Last Updated:** 2025-11-29
