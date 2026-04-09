# CompanyProfile Model

Model reprezentujący profil firmowy w systemie.

**Tabela:** `CompanyProfile`
**ORM:** Prisma
**Utworzono:** Stage 02 (task-01)
**Wersja:** 1.2 (task-11, task-12: dodano subcategoryIds, businessHours)

---

## Schema

```prisma
model CompanyProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  companyName     String
  nip             String    @unique
  viesVerified    Boolean   @default(false)
  verifiedAt      DateTime?
  logo            String?
  banner          String?
  description     String?   @db.Text
  categoryId      String?
  subcategoryIds  String[]
  website         String?
  phone           String?
  email           String?
  socialLinks     Json?
  businessHours   Json?
  latitude        Float?
  longitude       Float?
  address         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([nip])
  @@index([viesVerified])
  @@index([categoryId])
  @@index([latitude, longitude])
}
```

---

## Pola

| Pole | Typ | Nullable | Unique | Default | Opis |
|------|-----|----------|--------|---------|------|
| `id` | String | ❌ | ✅ | cuid() | Primary key |
| `userId` | String | ❌ | ✅ | - | Foreign key → User.id |
| `companyName` | String | ❌ | ❌ | - | Nazwa firmy |
| `nip` | String | ❌ | ✅ | - | Numer NIP (10 cyfr) |
| `viesVerified` | Boolean | ❌ | ❌ | false | Czy zweryfikowany przez VIES |
| `verifiedAt` | DateTime | ✅ | ❌ | - | Data weryfikacji VIES |
| `logo` | String | ✅ | ❌ | - | URL logo w R2 |
| `banner` | String | ✅ | ❌ | - | URL banner w R2 |
| `description` | Text | ✅ | ❌ | - | Opis firmy (Markdown, max 5000) |
| `categoryId` | String | ✅ | ❌ | - | FK → Category.id (główna) |
| `subcategoryIds` | String[] | ❌ | ❌ | [] | Array FK → Category.id (max 3) |
| `website` | String | ✅ | ❌ | - | Website URL |
| `phone` | String | ✅ | ❌ | - | Telefon kontaktowy |
| `email` | String | ✅ | ❌ | - | Email kontaktowy |
| `socialLinks` | Json | ✅ | ❌ | - | Social media links |
| `businessHours` | Json | ✅ | ❌ | - | Godziny otwarcia (7 dni) |
| `latitude` | Float | ✅ | ❌ | - | Geolokalizacja (szerokość) |
| `longitude` | Float | ✅ | ❌ | - | Geolokalizacja (długość) |
| `address` | String | ✅ | ❌ | - | Adres tekstowy |
| `createdAt` | DateTime | ❌ | ❌ | now() | Data utworzenia |
| `updatedAt` | DateTime | ❌ | ❌ | now() | Data ostatniej aktualizacji |

---

## Relacje

### → User (1:1)

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Cascade Delete:** Usunięcie User → usunięcie CompanyProfile

### → Category (N:1)

```prisma
category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
```

**Set Null:** Usunięcie Category → categoryId = null

---

## Constraints

### Unique Constraints

- `userId` - Jeden profil firmowy per user
- `nip` - Jeden NIP w systemie (unikalność)

### Indexes

```sql
CREATE INDEX idx_company_profile_user_id ON CompanyProfile(userId);
CREATE INDEX idx_company_profile_nip ON CompanyProfile(nip);
CREATE INDEX idx_company_profile_vies_verified ON CompanyProfile(viesVerified);
CREATE INDEX idx_company_profile_category_id ON CompanyProfile(categoryId);
CREATE INDEX idx_company_profile_location ON CompanyProfile(latitude, longitude);
```

**Performance:**
- Szybkie lookup po userId (profil użytkownika)
- Szybkie wyszukiwanie po NIP (weryfikacja unikalności)
- Filtrowanie po viesVerified (admin panel)
- Geo queries (latitude + longitude composite index)

---

## JSON Fields

### socialLinks

**Format:**
```json
{
  "facebook": "https://facebook.com/company",
  "instagram": "https://instagram.com/company",
  "linkedin": "https://linkedin.com/company/company",
  "twitter": "https://twitter.com/company"
}
```

**Walidacja:** All URLs, optional fields

### businessHours

**Format:**
```json
{
  "monday": { "open": "09:00", "close": "17:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "17:00", "closed": false },
  "thursday": { "open": "09:00", "close": "17:00", "closed": false },
  "friday": { "open": "09:00", "close": "17:00", "closed": false },
  "saturday": { "open": "10:00", "close": "14:00", "closed": false },
  "sunday": { "closed": true }
}
```

**Walidacja:**
- HH:MM format (00:00 - 23:59)
- open < close
- closed = true → open/close opcjonalne

**TypeScript Type:**
```typescript
type DayHours = {
  open?: string;
  close?: string;
  closed: boolean;
};

type BusinessHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};
```

---

## Przykłady

### Utworzenie profilu firmowego (Upgrade)

```typescript
const companyProfile = await prisma.companyProfile.create({
  data: {
    userId: user.id,
    companyName: "Example Sp. z o.o.",
    nip: "1234567890",
    viesVerified: true,
    verifiedAt: new Date()
  }
});
```

### Aktualizacja profilu

```typescript
await prisma.companyProfile.update({
  where: { userId: session.user.id },
  data: {
    description: "Nasza firma...",
    categoryId: "cat_gastronomia",
    subcategoryIds: ["cat_restauracje", "cat_catering"],
    website: "https://example.com",
    businessHours: {
      monday: { open: "08:00", close: "20:00", closed: false },
      // ...
      sunday: { closed: true }
    }
  }
});
```

### Upload logo

```typescript
await prisma.companyProfile.update({
  where: { userId: session.user.id },
  data: {
    logo: "https://cdn.videoshorts.pl/companies/user_123/logo.png"
  }
});
```

### Wyszukiwanie po NIP

```typescript
const company = await prisma.companyProfile.findUnique({
  where: { nip: "1234567890" },
  include: {
    user: true,
    category: true
  }
});
```

### Geo query (firmy w okolicy)

```typescript
const nearby = await prisma.$queryRaw`
  SELECT *
  FROM "CompanyProfile"
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(${lat})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) *
        sin(radians(latitude))
      )
    ) < ${radiusKm}
  ORDER BY (
    6371 * acos(
      cos(radians(${lat})) *
      cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lng})) +
      sin(radians(${lat})) *
      sin(radians(latitude))
    )
  )
  LIMIT 20
`;
```

---

## Walidacja

### Server-Side (Zod)

```typescript
const companyProfileSchema = z.object({
  companyName: z.string().min(3).max(100),
  nip: z.string().regex(/^[0-9]{10}$/),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  subcategoryIds: z.array(z.string()).max(3),
  website: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional()
  }).optional(),
  businessHours: z.record(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    z.object({
      open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean()
    })
  ).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(200).optional()
});
```

---

## Migration History

### Initial Schema (2025-12-15, task-01)

```sql
CREATE TABLE "CompanyProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "nip" TEXT NOT NULL,
  "viesVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "logo" TEXT,
  "banner" TEXT,
  "description" TEXT,
  "categoryId" TEXT,
  "website" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "socialLinks" JSONB,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON "CompanyProfile"("userId");
CREATE UNIQUE INDEX "CompanyProfile_nip_key" ON "CompanyProfile"("nip");
```

### Add subcategoryIds and businessHours (2025-12-16, task-11, task-12)

```sql
ALTER TABLE "CompanyProfile"
  ADD COLUMN "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "businessHours" JSONB;
```

---

## Powiązana Dokumentacja

- [Companies Feature](../../features/companies/README.md)
- [Companies Server Actions](../../api/server-actions/companies.md)
- [User Model](./user.md)
- [Category Model](./category.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.2
