# Category Model

Model reprezentujący hierarchiczny system kategorii dla firm.

**Tabela:** `Category`
**ORM:** Prisma
**Utworzono:** Stage 02 (task-01)
**Struktura:** Hierarchiczna (max 2 poziomy)

---

## Schema

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   // JSON: {pl, en, de, es, ru}
  slug      String   @unique
  icon      String?
  parentId  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent          Category?        @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children        Category[]       @relation("CategoryHierarchy")
  companyProfiles CompanyProfile[]

  @@index([slug])
  @@index([parentId])
}
```

---

## Pola

| Pole | Typ | Nullable | Unique | Default | Opis |
|------|-----|----------|--------|---------|------|
| `id` | String | ❌ | ✅ | cuid() | Primary key |
| `name` | String (JSON) | ❌ | ❌ | - | Nazwa w 5 językach |
| `slug` | String | ❌ | ✅ | - | URL-friendly identifier |
| `icon` | String | ✅ | ❌ | - | Nazwa ikony (Lucide React) |
| `parentId` | String | ✅ | ❌ | - | FK → Category.id (null = main) |
| `order` | Int | ❌ | ❌ | 0 | Kolejność wyświetlania |
| `createdAt` | DateTime | ❌ | ❌ | now() | Data utworzenia |
| `updatedAt` | DateTime | ❌ | ❌ | now() | Data ostatniej aktualizacji |

---

## JSON Field: name

**Format:**
```json
{
  "pl": "Gastronomia",
  "en": "Food & Beverage",
  "de": "Gastronomie",
  "es": "Gastronomía",
  "ru": "Гастрономия"
}
```

**TypeScript Type:**
```typescript
type CategoryName = {
  pl: string;
  en: string;
  de: string;
  es: string;
  ru: string;
};
```

**Walidacja:**
- Wszystkie języki wymagane
- Min 2, max 50 znaków per język

---

## Hierarchia

### Struktura

```
Kategoria Główna (parentId = null)
  ├── Subkategoria 1 (parentId = cat_main)
  ├── Subkategoria 2
  └── Subkategoria 3
```

**Ograniczenia:**
- Max 2 poziomy (parent → child)
- Brak child → grandchild (walidacja w create action)

### Self-Referencing Relation

```prisma
parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
children Category[] @relation("CategoryHierarchy")
```

**Cascade Delete:** Usunięcie parent → usunięcie children (jeśli brak walidacji)

---

## Relacje

### → CompanyProfile (1:N)

```prisma
companyProfiles CompanyProfile[]
```

**Używane jako:**
- `categoryId` (główna kategoria)
- `subcategoryIds[]` (dodatkowe subkategorie, max 3)

---

## Slug Generation

**Algorytm:** Transliteracja + normalizacja

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
    .replace(/^-+|-+$/g, ''); // Trim dashes
}
```

**Przykłady:**
- "Gastronomia" → "gastronomia"
- "Zdrowie & Uroda" → "zdrowie-uroda"
- "Café & Restaurant" → "cafe-restaurant"

**Unique Constraint:** Slug musi być unikalny (sprawdzane przy create/update)

---

## Icons

**Library:** Lucide React

**Przykłady:**
- "Utensils" → 🍴
- "Home" → 🏠
- "Briefcase" → 💼
- "Heart" → ❤️

**Dozwolone ikony:** Wszystkie z `lucide-react` (300+ icons)

**Rendering:**
```tsx
import * as Icons from 'lucide-react';

const Icon = Icons[category.icon as keyof typeof Icons];
return <Icon className="w-5 h-5" />;
```

---

## Przykłady

### Utworzenie kategorii głównej

```typescript
const mainCategory = await prisma.category.create({
  data: {
    name: JSON.stringify({
      pl: "Gastronomia",
      en: "Food & Beverage",
      de: "Gastronomie",
      es: "Gastronomía",
      ru: "Гастрономия"
    }),
    slug: "gastronomia",
    icon: "Utensils",
    parentId: null,
    order: 0
  }
});
```

### Utworzenie subkategorii

```typescript
const subCategory = await prisma.category.create({
  data: {
    name: JSON.stringify({
      pl: "Restauracje",
      en: "Restaurants",
      de: "Restaurants",
      es: "Restaurantes",
      ru: "Рестораны"
    }),
    slug: "restauracje",
    icon: "ChefHat",
    parentId: mainCategory.id,
    order: 0
  }
});
```

### Pobranie hierarchii

```typescript
const categories = await prisma.category.findMany({
  where: { parentId: null }, // Only main categories
  include: {
    children: {
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { order: 'asc' }
});
```

### Wyszukiwanie po slug

```typescript
const category = await prisma.category.findUnique({
  where: { slug: "gastronomia" },
  include: {
    children: true,
    companyProfiles: {
      take: 10,
      where: { viesVerified: true }
    }
  }
});
```

---

## Seed Data

**Lokalizacja:** `prisma/seed-categories.ts`

**Przykładowe kategorie:**

```typescript
const categories = [
  {
    name: { pl: "Gastronomia", en: "Food & Beverage", ... },
    slug: "gastronomia",
    icon: "Utensils",
    children: [
      { name: { pl: "Restauracje", ... }, slug: "restauracje", icon: "ChefHat" },
      { name: { pl: "Catering", ... }, slug: "catering", icon: "Truck" },
      { name: { pl: "Piekarnie", ... }, slug: "piekarnie", icon: "Croissant" }
    ]
  },
  {
    name: { pl: "Zdrowie", en: "Health", ... },
    slug: "zdrowie",
    icon: "Heart",
    children: [
      { name: { pl: "Kliniki", ... }, slug: "kliniki", icon: "Hospital" },
      { name: { pl: "Fizjoterapia", ... }, slug: "fizjoterapia", icon: "Activity" }
    ]
  }
];
```

**Uruchomienie:**
```bash
npm run db:seed
```

---

## Constraints & Validation

### Database Constraints

```sql
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
```

### Application-Level Validation

**Create Category:**
- ✅ Unique slug
- ✅ Parent exists (if parentId provided)
- ✅ Parent is not a subcategory (max 2 levels)
- ✅ All 5 languages provided

**Delete Category:**
- ❌ Has companies (categoryId or subcategoryIds)
- ❌ Has children (parentId references)

---

## TypeScript Utilities

### Build Category Tree

```typescript
export type CategoryTree = Category & {
  children: CategoryTree[];
};

export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      parent?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

### Parse Name JSON

```typescript
export function parseCategoryName(nameJson: string): CategoryName {
  return JSON.parse(nameJson) as CategoryName;
}

export function getCategoryName(category: Category, locale: string): string {
  const name = parseCategoryName(category.name);
  return name[locale as keyof CategoryName] || name.pl;
}
```

---

## Migration History

### Initial Schema (2025-12-15, task-01)

```sql
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT,
  "parentId" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId")
  REFERENCES "Category"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
```

---

## Powiązana Dokumentacja

- [Admin Categories Management](../../features/admin/categories.md)
- [Admin Categories Actions](../../api/server-actions/admin-categories.md)
- [CompanyProfile Model](./company-profile.md)
- [CategoriesManager Component](../../components/admin/categories-manager.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
